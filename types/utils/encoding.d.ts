import { TRANSACT_DTO } from '../types/transact';
export declare const hashTransactData: (data: TRANSACT_DTO) => string;
export declare const generateSecureHash: (hash: string, nonce: string) => string;
