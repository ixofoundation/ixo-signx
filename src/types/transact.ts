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

export type TRANSACTION = {
	txBodyHex: string;
	sequence?: number;
};

export type TRANSACT_DTO = {
	address: string;
	did: string;
	pubkey: string;
	timestamp: string;
	transactions: TRANSACTION[];
};

export type TRANSACT_DATA = {
	sessionHash?: string;
	hash: string;
	type: string;
	sitename: string;
	network: NETWORK;
	version: number;
};

export type TRANSACT_ADDITION_DATA = {
	showQR: boolean;
};

export type TRANSACT_HASH = {
	address: string;
	did: string;
	pubkey: string;
	timestamp: string;
	txBodyHex: string;
};
