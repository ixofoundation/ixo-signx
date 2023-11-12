import axios from 'axios';
import { EventEmitter } from 'events';

import * as Random from './utils/random';
import * as Types from './types/transact';
import * as Encoding from './utils/encoding';
import * as Constants from './constants/signx';

export class SignX extends EventEmitter {
	public timeout: number = 2 * 60 * 1000; // 2 minutes
	public pollingInterval: number = 2.5 * 1000; // 2.5 seconds
	public network: Types.NETWORK;
	public endpoint: string;
	public sitename: string;
	private pollingTimeout: NodeJS.Timeout | null = null;

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
	}

	private generateRandomHash(): string {
		return Random.Random.getHex(32);
	}

	async login(p: { pollingInterval?: number }): Promise<Types.LOGIN_DATA> {
		const secureNonce = this.generateRandomHash();
		const hash = this.generateRandomHash();
		const secureHash = Encoding.generateSecureHash(hash, secureNonce);
		this.startPolling(
			'/login/fetch',
			{ hash, secureNonce },
			Constants.SIGN_X_LOGIN_SUCCESS,
			Constants.SIGN_X_LOGIN_ERROR,
			p.pollingInterval,
		);
		return {
			hash,
			secureHash,
			type: Constants.SIGN_X_LOGIN,
			sitename: this.sitename,
			timeout: new Date(Date.now() + this.timeout).toISOString(),
			network: this.network,
			version: Constants.VERSION,
		};
	}

	async transact(data: Types.TRANSACT_DTO): Promise<Types.TRANSACT_DATA> {
		const hash = Encoding.hashTransactData(data);
		await axios.post(`${this.endpoint}/transaction/create`, { hash, ...data });
		this.startPolling(
			'/transaction/response',
			{ hash },
			Constants.SIGN_X_TRANSACT_SUCCESS,
			Constants.SIGN_X_TRANSACT_ERROR,
		);
		return {
			hash,
			type: Constants.SIGN_X_TRANSACT,
			sitename: this.sitename,
			network: this.network,
			version: Constants.VERSION,
		};
	}

	private startPolling(
		route: string,
		body: any,
		successEvent: string,
		failEvent: string,
		customPollingInterval?: number,
	): void {
		const isLogin = route.includes('/login/');
		const isTransaction = route.includes('/transaction/');
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
					this.stopPolling();
					// if response data contains success property, then check and throw error if false
					if (!(response.data?.data?.success ?? true))
						throw new Error(response.data?.data?.data?.message ?? response.data?.data?.message ?? response.data?.data);

					const data = response.data.data?.data ?? {};
					if (!data) throw new Error('No data found');
					if (isLogin && (!data.address || !data.pubKey || !data.did)) throw new Error('Account details missing');
					if (isTransaction && (data.code != 0 || !data.transactionHash))
						throw new Error('Transaction failed, no success code');

					this.emit(successEvent, response.data.data);
				}
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

	public stopPolling(errorMessage?: string, failEvent?: string): void {
		if (this.pollingTimeout) {
			clearTimeout(this.pollingTimeout);
			this.pollingTimeout = null;
		}
		if (errorMessage) {
			this.emit(failEvent, errorMessage);
		}
	}
}
