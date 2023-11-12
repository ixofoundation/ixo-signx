export type NETWORK = 'mainnet' | 'testnet' | 'devnet';
export type LOGIN_DATA = {
    hash: string;
    secureHash: string;
    type: string;
    sitename: string;
    timeout: string;
    network: NETWORK;
    version: number;
};
export type TRANSACT_DTO = {
    address: string;
    did: string;
    pubkey: string;
    txBodyHex: string;
    timestamp: string;
};
export type TRANSACT_DATA = {
    hash: string;
    type: string;
    sitename: string;
    network: NETWORK;
    version: number;
};
