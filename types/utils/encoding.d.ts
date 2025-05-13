import * as Types from '../types/transact';
/**
 * Generate a sha256 hex encoded hash from the provided data in a fixed format
 * @param data - transaction data to generate hash for (type TRANSACT_HASH)
 * @param fixedSort - whether to sort the keys in the data before hashing (default: true), keep false for backwards compatibility
 */
export declare const hashTransactData: (data: Types.TRANSACT_HASH, fixedSort?: boolean) => Promise<string>;
/**
 * Generate a sha256 hex encoded hash from the provided hash and secureNonce
 * @param hash - hash to generate secure hash for
 * @param nonce - secure nonce to use in hash generation
 */
export declare const generateSecureHash: (hash: string, nonce: string) => Promise<string>;
/**
 * Generate a deeplink uri from the provided data
 * @param data - data to generate deeplink for (type LOGIN_DATA | TRANSACT_DATA)
 * @param scheme - scheme to use in deeplink uri (default: 'impactsx')
 */
export declare const convertDataToDeeplink: (data: Types.LOGIN_DATA | Types.TRANSACT_DATA | Types.DATA_PASS_DATA, scheme?: string) => string;
