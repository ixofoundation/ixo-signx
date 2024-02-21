/// <reference types="node" />
import { EventEmitter } from 'events';
import * as Types from './types/transact';
export declare class SignX extends EventEmitter {
    timeout: number;
    pollingInterval: number;
    network: Types.NETWORK;
    endpoint: string;
    sitename: string;
    private pollingTimeout;
    private transactSessionHash;
    private transactSecureNonce;
    constructor(p: {
        endpoint: string;
        sitename: string;
        network: Types.NETWORK;
        timeout?: number;
        pollingInterval?: number;
    });
    /**
     * Generate a random hash
     */
    generateRandomHash(): string;
    /**
     * Start the login flow, returns login data for client to generate deeplink/QR code
     * @param {number} pollingInterval - custom polling interval (optional)
     */
    login(p: {
        pollingInterval?: number;
    }): Promise<Types.LOGIN_DATA>;
    /**
     * Create or add transactions to an existing transaction session, if no session exists, a new session is created.
     * If new session is created, the client should generate a new deeplink/QR code for the user to scan to start the mobile app flow.
     * If existing session is used, the client should not generate a new deeplink/QR code, the transactions will jsut be added to the existing session and the polling that is already in progress will continue and pick up the new transactions added to the server.
     * Transactions polling and additions are secure through a secure nonce and session hash, and only the sdk knows the secure nonce that is used to generate the session hash.
     * @param data - transaction data (type TRANSACT_DTO)
     * @param forceNewSession - force a new session to be created if one is already in progress, default false
     */
    transact(data: Types.TRANSACT_DTO, forceNewSession?: boolean): Promise<Types.TRANSACT_DATA>;
    /**
     * Poll for the active transaction response
     * @param {string} activeTrxHash - hash of the active transaction to start polling for
     */
    private pollTransactionResponse;
    /**
     * Poll for the next transaction in a session, will also error if session has on server side
     */
    private pollNextTransaction;
    /**
     * Start polling for a response from the server
     * @param {string} route - server route to poll
     * @param {any} body - request body
     * @param {string} successEvent - event to emit on success
     * @param {string} failEvent - event to emit on failure
     * @param {number} customPollingInterval - custom polling interval
     */
    private startPolling;
    /**
     * Stop polling for a response from the server
     * @param {string} errorMessage - error message to emit (optional)
     * @param {string} failEvent - event to emit on failure (optional), only used if errorMessage is provided
     * @param {boolean} clearTransactSession - default true, clear transact session hash and secure nonce used for polling
     */
    stopPolling(errorMessage?: string, failEvent?: string, clearTransactSession?: boolean): void;
    /**
     * Dispose the SignX instance, stop polling and clear session data
     */
    dispose(): void;
}
