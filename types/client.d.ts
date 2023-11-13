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
    constructor(p: {
        endpoint: string;
        sitename: string;
        network: Types.NETWORK;
        timeout?: number;
        pollingInterval?: number;
    });
    private generateRandomHash;
    login(p: {
        pollingInterval?: number;
    }): Promise<Types.LOGIN_DATA>;
    transact(data: Types.TRANSACT_DTO): Promise<Types.TRANSACT_DATA>;
    private startPolling;
    stopPolling(errorMessage?: string, failEvent?: string): void;
}
