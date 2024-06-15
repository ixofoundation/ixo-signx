import crypto from 'crypto';

import * as Types from '../types/transact';
import * as Constants from '../constants/signx';

/**
 * Generate a sha256 hex encoded hash from the provided data in a fixed format
 * @param data - transaction data to generate hash for (type TRANSACT_HASH)
 * @param fixedSort - whether to sort the keys in the data before hashing (default: true), keep false for backwards compatibility
 */
export const hashTransactData = (data: Types.TRANSACT_HASH, fixedSort = true): string => {
	const formattedData = {
		address: data.address,
		did: data.did,
		pubkey: data.pubkey,
		txBodyHex: data.txBodyHex,
		timestamp: data.timestamp,
	};

	// Sort the keys to ensure consistent ordering for the hash
	const sortedFormattedData = JSON.stringify(formattedData, fixedSort ? Object.keys(formattedData).sort() : null);

	return crypto.createHash('sha256').update(sortedFormattedData).digest('hex');
};

/**
 * Generate a sha256 hex encoded hash from the provided hash and secureNonce
 * @param hash - hash to generate secure hash for
 * @param nonce - secure nonce to use in hash generation
 */
export const generateSecureHash = (hash: string, nonce: string): string => {
	return crypto
		.createHash('sha256')
		.update(hash + nonce)
		.digest('hex');
};

/**
 * Generate a deeplink uri from the provided data
 * @param data - data to generate deeplink for (type LOGIN_DATA | TRANSACT_DATA)
 * @param scheme - scheme to use in deeplink uri (default: 'impactsx')
 */
export const convertDataToDeeplink = (data: Types.LOGIN_DATA | Types.TRANSACT_DATA | Types.DATA_PASS_DATA, scheme = 'impactsx'): string => {
	switch (data?.type) {
		case Constants.SIGN_X_LOGIN:
			const loginData = data as Types.LOGIN_DATA;
			let loginDeeplink =
				scheme +
				'://signx?hash=' +
				loginData.hash +
				'&secureHash=' +
				loginData.secureHash +
				'&type=' +
				loginData.type +
				'&sitename=' +
				loginData.sitename +
				'&timeout=' +
				loginData.timeout +
				'&network=' +
				loginData.network +
				'&version=' +
				loginData.version;
			return loginDeeplink;
		case Constants.SIGN_X_DATA:
			const dataPassData = data as Types.DATA_PASS_DATA;
			let dataDeeplink =
				scheme +
				'://signx?hash=' +
				dataPassData.hash +
				'&secureHash=' +
				dataPassData.secureHash +
				'&key=' +
				dataPassData.key +
				'&type=' +
				dataPassData.type +
				'&dataType=' +
				dataPassData.dataType +
				'&sitename=' +
				dataPassData.sitename +
				'&timeout=' +
				dataPassData.timeout +
				'&network=' +
				dataPassData.network +
				'&version=' +
				dataPassData.version;
			return dataDeeplink;
		case Constants.SIGN_X_TRANSACT:
			const transactData = data as Types.TRANSACT_DATA;
			let transactDeeplink = scheme + '://signx?hash=' + transactData.hash + '&type=' + transactData.type + '&sitename=' + transactData.sitename + '&network=' + transactData.network + '&version=' + transactData.version;
			if (transactData.sessionHash) transactDeeplink += '&sessionHash=' + transactData.sessionHash;
			return transactDeeplink;
		case Constants.SIGN_X_CLEAN_DEEPLINK:
			return scheme + '://signx';
		default:
			throw new Error('Unable to convert data to deeplink - invalid data type');
	}
};
