import axios from 'axios';
import { EventEmitter } from 'events';

import * as Random from './utils/random';
import * as Types from './types/transact';
import * as Encoding from './utils/encoding';
import * as Constants from './constants/signx';

const MAX_TRANSACTIONS = 99;

export class SignX extends EventEmitter {
	public timeout: number = 2 * 60 * 1000; // 2 minutes
	public pollingInterval: number = 2.5 * 1000; // 2.5 seconds
	public network: Types.NETWORK;
	public endpoint: string;
	public sitename: string;
	private pollingTimeout: NodeJS.Timeout | null = null;

	public transactSessionHash: string | null = null;
	private transactSecureNonce: string | null = null;

	constructor(p: { endpoint: string; sitename: string; network: Types.NETWORK; timeout?: number; pollingInterval?: number }) {
		super();
		this.endpoint = p.endpoint;
		this.sitename = p.sitename;
		this.network = p.network;
		if (p.timeout) this.timeout = p.timeout;
		if (p.pollingInterval) this.pollingInterval = p.pollingInterval;
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
	 */
	async login(p: { pollingInterval?: number }): Promise<Types.LOGIN_DATA> {
		const secureNonce = this.generateRandomHash();
		const hash = this.generateRandomHash();
		const secureHash = Encoding.generateSecureHash(hash, secureNonce);

		// start polling for login response
		this.startPolling(Constants.ROUTES.login.fetch, { hash, secureNonce }, Constants.SIGN_X_LOGIN_SUCCESS, Constants.SIGN_X_LOGIN_ERROR, p.pollingInterval);

		// return login data for client to generate deeplink/QR code
		return {
			hash,
			secureHash,
			type: Constants.SIGN_X_LOGIN,
			sitename: this.sitename,
			timeout: new Date(Date.now() + this.timeout).toISOString(),
			network: this.network,
			version: Constants.LOGIN_VERSION,
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
			.map((trx, index) => ({
				hash: Encoding.hashTransactData({
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
		console.dir(transactions, { depth: null });

		// if session hash exists and not forcing new session, just add new transactions to existing session
		if (this.transactSessionHash && !forceNewSession) {
			const res = await axios.post(this.endpoint + Constants.ROUTES.transact.add, {
				hash: this.transactSessionHash,
				secureNonce: this.transactSecureNonce,
				transactions: transactions,
			});

			if (res.data.success) return res.data.data;

			// if addition fails because session is not found, then force new session, aka continue flow
			if (res.data.code !== 418) throw new Error(res.data.data?.message || 'Transaction addition failed');
		}

		// if session hash exists, first stop current polling
		if (this.transactSessionHash) {
			this.stopPolling();
		}
		this.transactSecureNonce = this.generateRandomHash();
		this.transactSessionHash = Encoding.generateSecureHash(transactions[0].hash, this.transactSecureNonce);

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
		this.emit(Constants.SIGN_X_TRANSACT_SESSION_STARTED, res.data.data);
		// start polling for transaction response
		this.pollTransactionResponse(activeTrxHash);

		// return transact data for client to generate deeplink/QR code
		return {
			hash: this.transactSessionHash,
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
	private pollTransactionResponse(activeTrxHash: string) {
		this.startPolling(Constants.ROUTES.transact.response, { hash: activeTrxHash, secureNonce: this.transactSecureNonce }, Constants.SIGN_X_TRANSACT_SUCCESS, Constants.SIGN_X_TRANSACT_ERROR);
	}

	/**
	 * Poll for the next transaction in a session, will also error if session has on server side
	 */
	private pollNextTransaction() {
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
	private startPolling(route: string, body: any, successEvent: string, failEvent: string, customPollingInterval?: number): void {
		const isLogin = route.includes(Constants.ROUTES.login.fetch);
		const isTransactionResponse = route.includes(Constants.ROUTES.transact.response);
		const isTransactionNext = route.includes(Constants.ROUTES.transact.add);
		let pollingTimeElapsed = 0;

		const poll = async () => {
			// handle timeout
			if (pollingTimeElapsed >= this.timeout) {
				this.stopPolling();
				this.emit(failEvent, 'TIMEOUT');
				return;
			}

			try {
				const response = await axios.post(this.endpoint + route, body);
				if (response.data.success) {
					this.stopPolling(undefined, undefined, false);
					// if response data contains success property, then check and throw error if false
					if (!(response.data?.data?.success ?? true)) throw new Error(response.data?.data?.data?.message ?? response.data?.data?.message ?? response.data?.data);

					// validate response data with custom errors
					const data = response.data.data?.data ?? {};
					if (isLogin && (!data.address || !data.pubKey || !data.did)) throw new Error('Account details missing');
					if (isTransactionResponse && (data.code != 0 || !data.transactionHash)) throw new Error('Transaction failed, no success code');

					this.emit(successEvent, response.data.data);

					if (isTransactionResponse) {
						if (response.data.data?.activeTransaction?.hash) {
							// if next trx is already in current active trx response, emit new transaction event
							this.emit(Constants.SIGN_X_TRANSACT_SESSION_NEW_TRANSACTION, response.data.data);
							this.pollTransactionResponse(response.data.data.activeTransaction.hash);
						} else {
							this.pollNextTransaction();
						}
					} else if (isTransactionNext) {
						this.pollTransactionResponse(response.data.data?.activeTransaction?.hash);
					}

					return;
				}
				// if response success is false, check code, if 418, continue polling, else throw error
				if (response.data.code !== 418) {
					throw new Error(response.data.data?.message || 'Polling failed');
				}
				pollingTimeElapsed += customPollingInterval || this.pollingInterval;
				this.pollingTimeout = setTimeout(poll, customPollingInterval || this.pollingInterval);
			} catch (error) {
				// handle network or other errors
				this.stopPolling();
				this.emit(failEvent, error);
			}
		};

		poll();
	}

	/**
	 * Stop polling for a response from the server
	 * @param {string} errorMessage - error message to emit (optional)
	 * @param {string} failEvent - event to emit on failure (optional), only used if errorMessage is provided
	 * @param {boolean} clearTransactSession - default true, clear transact session hash and secure nonce used for polling
	 */
	stopPolling(errorMessage?: string, failEvent?: string, clearTransactSession = true): void {
		if (this.pollingTimeout) {
			clearTimeout(this.pollingTimeout);
			this.pollingTimeout = null;
		}
		if (errorMessage) {
			this.emit(failEvent, errorMessage);
		}
		if (clearTransactSession && this.transactSessionHash) {
			this.transactSessionHash = null;
			this.transactSecureNonce = null;
			this.emit(Constants.SIGN_X_TRANSACT_SESSION_ENDED, 'TIMEOUT');
		}
	}

	/**
	 * Dispose the SignX instance, stop polling and clear session data
	 */
	dispose(): void {
		this.stopPolling();
	}
}
