export type TRANSACT_DTO = {
	address: string;
	did: string;
	pubkey: string;
	txBodyHex: string;
	timestamp: string;
};

export type NETWORK = 'mainnet' | 'testnet' | 'devnet';
