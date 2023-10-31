import axios from 'axios';
import { EventEmitter } from 'events';

import { Random } from './utils/random';
import { NETWORK, TRANSACT_DTO } from './types/transact';
import { generateSecureHash, hashTransactData } from './utils/encoding';
import { SIGN_X_LOGIN, SIGN_X_LOGIN_ERROR, SIGN_X_LOGIN_SUCCESS, SIGN_X_TRANSACT, SIGN_X_TRANSACT_ERROR, SIGN_X_TRANSACT_SUCCESS, VERSION } from './constants/signx';

class SignX extends EventEmitter {
	public timeout: number = 2 * 60 * 1000; // 2 minutes
	private endpoint: string;
	private sitename: string;
	private network: NETWORK;
	private pollingTimeout: NodeJS.Timeout | null = null;

	constructor(endpoint: string, sitename: string, network: NETWORK) {
		super();
		this.endpoint = endpoint;
		this.sitename = sitename;
		this.network = network;
	}

	private generateRandomHash(): string {
		return Random.getHex(32);
	}

	async login() {
		const nonce = this.generateRandomHash();
		const hash = this.generateRandomHash();
		const secureHash = generateSecureHash(hash, nonce);
		this.startPolling('/login/fetch', { hash, nonce }, SIGN_X_LOGIN_SUCCESS, SIGN_X_LOGIN_ERROR);
		return { hash, secureHash, type: SIGN_X_LOGIN, sitename: this.sitename, timeout: Date.now() + this.timeout, network: this.network, version: VERSION };
	}

	async transact(data: TRANSACT_DTO) {
		const hash = hashTransactData(data);
		await axios.post(`${this.endpoint}/transaction/create`, { hash, data });
		this.startPolling('/transaction/response', { hash }, SIGN_X_TRANSACT_SUCCESS, SIGN_X_TRANSACT_ERROR);
		return { hash, type: SIGN_X_TRANSACT, sitename: this.sitename, network: this.network, version: VERSION };
	}

	private startPolling(route: string, body: any, successEvent: string, failEvent: string): void {
		const pollingInterval = 1.5 * 1000; // 1.5 seconds
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
					this.emit(successEvent, response.data);
				}
				if (response.data.code !== 418) {
					throw new Error(response.data.message);
				}
			} catch (error) {
				// handle network or other errors
				this.stopPolling();
				this.emit(failEvent, error);
			}

			pollingTimeElapsed += pollingInterval;
			this.pollingTimeout = setTimeout(poll, pollingInterval);
		};

		poll();
	}

	private stopPolling(): void {
		if (this.pollingTimeout) {
			clearTimeout(this.pollingTimeout);
			this.pollingTimeout = null;
		}
	}
}

export default SignX;
