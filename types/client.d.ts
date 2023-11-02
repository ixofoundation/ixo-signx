/// <reference types="node" />
import { EventEmitter } from 'events';
import { NETWORK, TRANSACT_DTO } from './types/transact';
export declare class SignX extends EventEmitter {
    timeout: number;
    pollingInterval: number;
    network: NETWORK;
    endpoint: string;
    sitename: string;
    private pollingTimeout;
    constructor(p: {
        endpoint: string;
        sitename: string;
        network: NETWORK;
        timeout?: number;
        pollingInterval?: number;
    });
    private generateRandomHash;
    login(p: {
        pollingInterval?: number;
    }): Promise<{
        hash: string;
        secureHash: string;
        type: string;
        sitename: string;
        timeout: string;
        network: NETWORK;
        version: number;
    }>;
    transact(data: TRANSACT_DTO): Promise<{
        hash: string;
        type: string;
        sitename: string;
        network: NETWORK;
        version: number;
    }>;
    private startPolling;
    stopPolling(errorMessage?: string, failEvent?: string): void;
}
