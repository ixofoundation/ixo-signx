import { ChainInfo } from '@keplr-wallet/types';
import { InterchainWallet } from '../types/opera';
export interface OperaInterchain {
    interchain?: InterchainWallet;
}
export declare const getInterchain: () => InterchainWallet | undefined;
export declare function transformSignature(signature: string): string | undefined;
export declare const getDIDDocJSON: () => Promise<any>;
export declare const getBech32PrefixAccAddr: (chainInfo?: ChainInfo | undefined) => string;
