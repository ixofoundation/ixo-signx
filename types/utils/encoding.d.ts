import * as Types from '../types/transact';
export declare const hashTransactData: (data: Types.TRANSACT_DTO) => string;
export declare const generateSecureHash: (hash: string, nonce: string) => string;
export declare const convertDataToDeeplink: (data: Types.LOGIN_DATA | Types.TRANSACT_DATA, scheme?: string) => string;
