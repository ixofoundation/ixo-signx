import crypto from 'crypto';

import * as Types from '../types/transact';
import * as Constants from '../constants/signx';

export const hashTransactData = (data: Types.TRANSACT_DTO): string => {
	const formattedData = {
		address: data.address,
		did: data.did,
		pubkey: data.pubkey,
		txBodyHex: data.txBodyHex,
		timestamp: data.timestamp,
	};
	return crypto.createHash('sha256').update(JSON.stringify(formattedData)).digest('hex');
};

export const generateSecureHash = (hash: string, nonce: string): string => {
	return crypto
		.createHash('sha256')
		.update(hash + nonce)
		.digest('hex');
};

export const convertDataToDeeplink = (data: Types.LOGIN_DATA | Types.TRANSACT_DATA, scheme = 'impactsx'): string => {
	switch (data?.type) {
		case Constants.SIGN_X_LOGIN:
			const loginData = data as Types.LOGIN_DATA;
			return (
				scheme +
				'://signx?hash=' +
				loginData.hash +
				'&secureHash=' +
				loginData.secureHash +
				'type=' +
				loginData.type +
				'sitename=' +
				loginData.sitename +
				'timeout=' +
				loginData.timeout +
				'network=' +
				loginData.network +
				'version=' +
				loginData.version
			);
		case Constants.SIGN_X_TRANSACT:
			const transactData = data as Types.TRANSACT_DATA;
			return (
				scheme +
				'://signx?hash=' +
				transactData.hash +
				'type=' +
				transactData.type +
				'sitename=' +
				transactData.sitename +
				'network=' +
				transactData.network +
				'version=' +
				transactData.version
			);
		default:
			throw new Error('Unable to convert data to deeplink - invalid data type');
	}
};
