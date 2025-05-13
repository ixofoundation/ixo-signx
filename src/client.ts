import axios from 'axios';
import { EventEmitter } from 'events';

import * as Random from './utils/random';
import * as Types from './types/transact';
import * as Encoding from './utils/encoding';
import * as Encryption from './utils/encryption';
import * as Constants from './constants/signx';

const MAX_TRANSACTIONS = 99;

export class SignX extends EventEmitter {
	public timeout: number = 2 * 60 * 1000; // 2 minutes
	public pollingInterval: number = 2.5 * 1000; // 2.5 seconds
	public network: Types.NETWORK;
	public endpoint: string;
	public sitename: string;
	private pollingTimeout: NodeJS.Timeout | null = null;
	private pollingTimecheckTimeout: NodeJS.Timeout | null = null;

	private transactSecureNonce: string | null = null;
	public transactSessionHash: string | null = null;
	public transactSequence: number = 0;

	private axiosAbortController = new AbortController();

	constructor(p: {
		endpoint: string;
		sitename: string;
		network: Types.NETWORK;
		timeout?: number;
		pollingInterval?: number;
	}) {
		super();
		this.endpoint = p.endpoint;
		this.sitename = p.sitename;
		this.network = p.network;
		if (p.timeout) this.timeout = p.timeout;
		if (p.pollingInterval) this.pollingInterval = p.pollingInterval;
		// setup the beforeunload listener for cancelling pending long polling requests
		this.setupBeforeUnloadListener();
	}

	/**
	 * Generate a random hash
	 */
	public generateRandomHash(): string {
		return Random.Random.getHex(32);
	}

	/**
	 * Start the login flow, returns login data for client to generate deeplink/QR code
	 * @param {number} pollingInterval - custom polling interval (optional)
	 * @param {boolean} matrix - whether to include matrix data in the login request (optional)
	 */
	async login(p: { pollingInterval?: number; matrix?: boolean }): Promise<Types.LOGIN_DATA> {
		const secureNonce = this.generateRandomHash();
		const hash = this.generateRandomHash();
		const secureHash = await Encoding.generateSecureHash(hash, secureNonce);

		// start polling for login response
		this.startPolling(
			Constants.ROUTES.login.fetch,
			{ hash, secureNonce },
			Constants.SIGN_X_LOGIN_SUCCESS,
			Constants.SIGN_X_LOGIN_ERROR,
			p.pollingInterval,
		);

		// return login data for client to generate deeplink/QR code
		return {
			hash,
			secureHash,
			type: Constants.SIGN_X_LOGIN,
			sitename: this.sitename,
			timeout: new Date(Date.now() + this.timeout).toISOString(),
			network: this.network,
			matrix: p.matrix ?? false,
			version: Constants.LOGIN_VERSION,
		};
	}

	/**
	 * Start the matrix login flow, returns matrix login data for client to generate deeplink/QR code
	 * @param {number} pollingInterval - custom polling interval (optional)
	 */
	async matrixLogin(p: { pollingInterval?: number }): Promise<Types.MATRIX_LOGIN_DATA> {
		const secureNonce = this.generateRandomHash();
		const hash = this.generateRandomHash();
		const secureHash = await Encoding.generateSecureHash(hash, secureNonce);

		// start polling for matrix login response
		this.startPolling(
			Constants.ROUTES.matrix_login.fetch,
			{ hash, secureNonce },
			Constants.SIGN_X_MATRIX_LOGIN_SUCCESS,
			Constants.SIGN_X_MATRIX_LOGIN_ERROR,
			p.pollingInterval,
		);

		// return matrix login data for client to generate deeplink/QR code
		return {
			hash,
			secureHash,
			type: Constants.SIGN_X_MATRIX_LOGIN,
			sitename: this.sitename,
			timeout: new Date(Date.now() + this.timeout).toISOString(),
			network: this.network,
			version: Constants.MATRIX_VERSION,
		};
	}

	/**
	 *
	 */
	async dataPass(p: { data: any; type: string; pollingInterval?: number }): Promise<Types.DATA_PASS_DATA> {
		const secureNonce = this.generateRandomHash();
		const hash = this.generateRandomHash();
		const encryptionKey = this.generateRandomHash();
		const secureHash = await Encoding.generateSecureHash(hash, secureNonce);

		// encrypt data
		const encryptedData = await Encryption.encryptJson(p.data, encryptionKey);

		const res = await axios.post(this.endpoint + Constants.ROUTES.data.create, {
			hash,
			type: p.type,
			data: encryptedData,
		});

		if (!res.data.success) throw new Error(res.data.data?.message || 'Data creation failed');

		// start polling for data response
		this.startPolling(
			Constants.ROUTES.data.response,
			{ hash, secureNonce },
			Constants.SIGN_X_DATA_SUCCESS,
			Constants.SIGN_X_DATA_ERROR,
			p.pollingInterval,
		);

		// return dataPass data for client to generate deeplink/QR code
		return {
			hash,
			secureHash,
			key: encryptionKey,
			type: Constants.SIGN_X_DATA,
			dataType: p.type,
			sitename: this.sitename,
			timeout: new Date(Date.now() + this.timeout).toISOString(),
			network: this.network,
			version: Constants.DATA_VERSION,
		};
	}

	/**
	 * Create or add transactions to an existing transaction session, if no session exists, a new session is created.
	 * If new session is created, the client should generate a new deeplink/QR code for the user to scan to start the mobile app flow.
	 * If existing session is used, the client should not generate a new deeplink/QR code, the transactions will jsut be added to the existing session and the polling that is already in progress will continue and pick up the new transactions added to the server.
	 * Transactions polling and additions are secure through a secure nonce and session hash, and only the sdk knows the secure nonce that is used to generate the session hash.
	 * @param data - transaction data (type TRANSACT_DTO)
	 * @param forceNewSession - force a new session to be created if one is already in progress, default false
	 */
	async transact(data: Types.TRANSACT_DTO, forceNewSession = false): Promise<Types.TRANSACT_DATA> {
		// validation
		if (!data.address || !data.did || !data.pubkey) throw new Error('Account details missing');
		if (!data.timestamp) throw new Error('Timestamp missing');
		if (!data.transactions || data.transactions.length === 0) throw new Error('No transactions found');
		if (data.transactions.length > MAX_TRANSACTIONS) throw new Error('Maximum 99 transactions allowed');

		// order transactions by sequence and get request data structure
		let transactions: any[] = data.transactions
			.sort((a, b) => (a.sequence ?? MAX_TRANSACTIONS) - (b.sequence ?? MAX_TRANSACTIONS))
			.map(async (trx, index) => ({
				hash: await Encoding.hashTransactData({
					address: data.address,
					did: data.did,
					pubkey: data.pubkey,
					txBodyHex: trx.txBodyHex,
					timestamp: data.timestamp,
				}),
				txBodyHex: trx.txBodyHex,
				timestamp: data.timestamp,
				sequence: index + 1,
			}));

		// if session hash exists and not forcing new session, just add new transactions to existing session
		if (this.transactSessionHash && !forceNewSession) {
			const res = await axios.post(this.endpoint + Constants.ROUTES.transact.add, {
				hash: this.transactSessionHash,
				secureNonce: this.transactSecureNonce,
				transactions: transactions,
			});

			if (res.data.success) {
				// if response contains active transaction sequence, update the sequence
				if (res.data.data?.activeTransaction?.sequence) {
					this.transactSequence = res.data.data.activeTransaction.sequence;
				}
				return res.data.data;
			}

			// if addition fails because session is not found (418), then force new session, aka continue flow,
			if (res.data.code !== 418) throw new Error(res.data.data?.message || 'Transaction addition failed');
		}

		// if session hash exists, first stop current polling
		if (this.transactSessionHash) {
			this.stopPolling();
		}
		this.transactSecureNonce = this.generateRandomHash();
		this.transactSessionHash = await Encoding.generateSecureHash(transactions[0].hash, this.transactSecureNonce);
		this.transactSequence = 1;

		const res = await axios.post(this.endpoint + Constants.ROUTES.transact.create, {
			hash: this.transactSessionHash,
			address: data.address,
			did: data.did,
			pubkey: data.pubkey,
			transactions: {
				hash: this.transactSessionHash,
				secureNonce: this.transactSecureNonce,
				transactions,
			},
		});

		if (!res.data.success) throw new Error(res.data.data?.message || 'Transaction creation failed');
		const activeTrxHash = res.data.data?.activeTransaction?.hash;

		// emit session started event
		this.emit(Constants.SIGN_X_TRANSACT_SESSION_STARTED, {
			sessionHash: this.transactSessionHash,
			activeTransaction: res.data.data?.activeTransaction,
		});
		// start polling for transaction response
		this.pollTransactionResponse(activeTrxHash);

		// return transact data for client to generate deeplink/QR code
		return {
			sessionHash: this.transactSessionHash,
			hash: transactions[0].hash,
			type: Constants.SIGN_X_TRANSACT,
			sitename: this.sitename,
			network: this.network,
			version: Constants.TRANSACT_VERSION,
		};
	}

	/**
	 * Poll for the active transaction response
	 * @param {string} activeTrxHash - hash of the active transaction to start polling for
	 */
	public pollTransactionResponse(activeTrxHash: string) {
		this.startPolling(
			Constants.ROUTES.transact.response,
			{ hash: activeTrxHash, secureNonce: this.transactSecureNonce },
			Constants.SIGN_X_TRANSACT_SUCCESS,
			Constants.SIGN_X_TRANSACT_ERROR,
		);
	}

	/**
	 * Poll for the next transaction in a session, will also error if session ends on server side
	 */
	public pollNextTransaction() {
		this.startPolling(
			Constants.ROUTES.transact.next,
			{ hash: this.transactSessionHash, secureNonce: this.transactSecureNonce },
			Constants.SIGN_X_TRANSACT_SESSION_NEW_TRANSACTION,
			Constants.SIGN_X_TRANSACT_SESSION_ENDED,
		);
	}

	/**
	 * Start polling for a response from the server
	 * @param {string} route - server route to poll
	 * @param {any} body - request body
	 * @param {string} successEvent - event to emit on success
	 * @param {string} failEvent - event to emit on failure
	 * @param {number} customPollingInterval - custom polling interval
	 */
	private startPolling(
		route: string,
		body: any,
		successEvent: string,
		failEvent: string,
		customPollingInterval?: number,
	): void {
		const isLogin = route == Constants.ROUTES.login.fetch;
		const isMatrixLogin = route == Constants.ROUTES.matrix_login.fetch;
		const isData = route == Constants.ROUTES.data.response;
		const isTransactionResponse = route == Constants.ROUTES.transact.response;
		const isTransactionNext = route == Constants.ROUTES.transact.next;
		const startTime = Date.now();
		let finished = false;

		// recursive function to check if polling has timed out
		const pollTimeCheck = async () => {
			if (finished) {
				return; // if polling has been stopped, then return
			}
			// handle timeout
			if (Date.now() - startTime > this.timeout) {
				this.stopPolling();
				this.emit(failEvent, 'TIMEOUT');
				return;
			}
			this.pollingTimecheckTimeout = setTimeout(pollTimeCheck, 1000);
		};

		const poll = async () => {
			try {
				const response = await axios.post(this.endpoint + route, body, { signal: this.axiosAbortController.signal });
				if (response.data.success) {
					this.stopPolling(undefined, undefined, false);
					finished = true;
					// if response data contains success property, then check and throw error if false
					if (!(response.data?.data?.success ?? true)) {
						let errorMessage =
							response.data?.data?.data?.message ?? response.data?.data?.message ?? response.data?.data;
						if (isData) errorMessage = response.data?.data?.response;
						throw new Error(errorMessage);
					}

					// validate response data with custom errors
					const data = response.data.data?.data ?? {};
					if (isMatrixLogin && !data.accessToken) throw new Error('Matrix details missing');
					if (isLogin && (!data.address || !data.pubKey || !data.did)) throw new Error('Account details missing');
					if (isData && !response.data.data?.response) throw new Error('Data response missing');
					if (isTransactionResponse && (data.code != 0 || !data.transactionHash))
						throw new Error('Transaction failed, no success code');

					this.emit(successEvent, response.data.data);

					if (isTransactionResponse) {
						if (response.data.data?.activeTransaction?.hash) {
							// if next trx is already in current active trx response, emit new transaction event
							this.emit(Constants.SIGN_X_TRANSACT_SESSION_NEW_TRANSACTION, response.data.data);
							this.transactSequence = response.data.data.activeTransaction.sequence;
							this.pollTransactionResponse(response.data.data.activeTransaction.hash);
						} else {
							this.pollNextTransaction();
						}
					} else if (isTransactionNext) {
						if (!response.data.data?.activeTransaction?.hash) throw new Error('No active transaction found');

						this.transactSequence = response.data.data.activeTransaction.sequence;
						this.pollTransactionResponse(response.data.data.activeTransaction.hash);
					}

					return;
				}
				// if response success is false, check code, if 418, continue polling, else throw error
				if (response.data.code !== 418) {
					throw new Error(response.data.data?.message || 'Polling failed');
				}
				this.pollingTimeout = setTimeout(poll, customPollingInterval || this.pollingInterval);
			} catch (error) {
				if (error.code === 'ERR_CANCELED') return;
				// handle network or other errors
				this.stopPolling();
				finished = true;
				this.emit(failEvent, error);
			}
		};

		poll();
		pollTimeCheck();
	}

	/**
	 * Stop polling for a response from the server
	 * @param {string} errorMessage - error message to emit (optional)
	 * @param {string} failEvent - event to emit on failure (optional), only used if errorMessage is provided
	 * @param {boolean} clearTransactSession - default true, clear transact session hash and secure nonce used for polling
	 */
	public stopPolling(errorMessage?: string, failEvent?: string, clearTransactSession: boolean = true): void {
		if (this.pollingTimeout) {
			clearTimeout(this.pollingTimeout);
			this.pollingTimeout = null;
		}
		if (this.pollingTimecheckTimeout) {
			clearTimeout(this.pollingTimecheckTimeout);
			this.pollingTimecheckTimeout = null;
		}
		if (this.axiosAbortController) {
			this.axiosAbortController.abort('Polling stopped'); // first cancel the axios request if still in progress
			this.axiosAbortController = new AbortController(); // then create a new abort controller
		}
		if (errorMessage) {
			this.emit(failEvent, errorMessage);
		}
		if (clearTransactSession && this.transactSessionHash) {
			this.transactSessionHash = null;
			this.transactSecureNonce = null;
			this.transactSequence = 0;
			this.emit(Constants.SIGN_X_TRANSACT_SESSION_ENDED, 'TIMEOUT');
		}
	}

	/**
	 * Setup the window beforeunload listener to abort any pending requests
	 */
	private setupBeforeUnloadListener() {
		if (typeof window !== 'undefined') {
			window.addEventListener('beforeunload', this.abortPendingRequests);
		}
	}

	/**
	 * Abort any pending axios requests when the tab is closing
	 */
	private abortPendingRequests = () => {
		if (this.axiosAbortController) {
			this.axiosAbortController.abort('Tab or window is closing');
		}
	};

	/**
	 * Dispose the SignX instance, stop polling and clear session data
	 */
	dispose(): void {
		if (typeof window !== 'undefined') {
			window.removeEventListener('beforeunload', this.abortPendingRequests);
		}
		this.stopPolling();
	}
}
