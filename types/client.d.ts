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
    private pollingTimecheckTimeout;
    private transactSecureNonce;
    transactSessionHash: string | null;
    transactSequence: number;
    private axiosAbortController;
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
     * Open deeplink in browser
     * @param {string} deeplink - deeplink URL to open
     */
    private openDeeplink;
    /**
     * Start the login flow, returns login data for client to generate deeplink/QR code
     * @param {number} pollingInterval - custom polling interval (optional)
     * @param {boolean} matrix - whether to include matrix data in the login request (optional)
     * @param {boolean} useDeeplink - whether to open deeplink automatically (optional, default false)
     */
    login(p: {
        pollingInterval?: number;
        matrix?: boolean;
        useDeeplink?: boolean;
    }): Promise<Types.LOGIN_DATA>;
    /**
     * Start the matrix login flow, returns matrix login data for client to generate deeplink/QR code
     * @param {number} pollingInterval - custom polling interval (optional)
     * @param {boolean} useDeeplink - whether to open deeplink automatically (optional, default false)
     */
    matrixLogin(p: {
        pollingInterval?: number;
        useDeeplink?: boolean;
    }): Promise<Types.MATRIX_LOGIN_DATA>;
    /**
     * Data pass flow
     * @param {any} data - data to pass to mobile app
     * @param {string} type - type of data
     * @param {number} pollingInterval - custom polling interval (optional)
     * @param {boolean} useDeeplink - whether to open deeplink automatically (optional, default false)
     */
    dataPass(p: {
        data: any;
        type: string;
        pollingInterval?: number;
        useDeeplink?: boolean;
    }): Promise<Types.DATA_PASS_DATA>;
    /**
     * Create or add transactions to an existing transaction session, if no session exists, a new session is created.
     * If new session is created, the client should generate a new deeplink/QR code for the user to scan to start the mobile app flow.
     * If existing session is used, the client should not generate a new deeplink/QR code, the transactions will jsut be added to the existing session and the polling that is already in progress will continue and pick up the new transactions added to the server.
     * Transactions polling and additions are secure through a secure nonce and session hash, and only the sdk knows the secure nonce that is used to generate the session hash.
     * @param data - transaction data (type TRANSACT_DTO)
     * @param forceNewSession - force a new session to be created if one is already in progress, default false
     * @param useDeeplink - whether to open deeplink automatically (optional, default false)
     */
    transact(data: Types.TRANSACT_DTO, forceNewSession?: boolean, useDeeplink?: boolean): Promise<Types.TRANSACT_DATA>;
    /**
     * Poll for the active transaction response
     * @param {string} activeTrxHash - hash of the active transaction to start polling for
     */
    pollTransactionResponse(activeTrxHash: string): void;
    /**
     * Poll for the next transaction in a session, will also error if session ends on server side
     */
    pollNextTransaction(): void;
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
     * Setup the window beforeunload listener to abort any pending requests
     */
    private setupBeforeUnloadListener;
    /**
     * Abort any pending axios requests when the tab is closing
     */
    private abortPendingRequests;
    /**
     * Dispose the SignX instance, stop polling and clear session data
     */
    dispose(): void;
}
