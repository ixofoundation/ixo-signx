/// <reference types="node" />
import { EventEmitter } from 'events';
import { NETWORK, TRANSACT_DTO } from './types/transact';
declare class SignX extends EventEmitter {
    timeout: number;
    private endpoint;
    private sitename;
    private network;
    private pollingTimeout;
    constructor(endpoint: string, sitename: string, network: NETWORK);
    private generateRandomHash;
    login(): Promise<{
        hash: string;
        secureHash: string;
        type: string;
        sitename: string;
        timestamp: number;
        network: NETWORK;
    }>;
    transact(data: TRANSACT_DTO): Promise<{
        hash: string;
        type: string;
        sitename: string;
        network: NETWORK;
    }>;
    private startPolling;
    private stopPolling;
}
export default SignX;
