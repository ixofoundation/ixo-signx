import { DirectSignResponse, OfflineDirectSigner } from '@cosmjs/proto-signing';
import { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { ChainInfo } from '@keplr-wallet/types';
import { OperaKey } from './types/opera';
export declare const opera_eventListener: {
    addMessageListener: any;
    postMessage: any;
    removeMessageListener: any;
};
export declare const opera_disable: () => Promise<void>;
export declare const opera_enable: (chainId: string) => Promise<void>;
export declare const opera_experimentalSuggestChain: (chainInfo: ChainInfo) => Promise<void>;
export declare const opera_getKey: (includeDid?: boolean) => Promise<OperaKey | undefined>;
/**
 * Only supports sign direct (for now)
 */
export declare const opera_getOfflineSigner: () => Promise<OfflineDirectSigner | null>;
export declare const opera_signDirect: (signerAddress: string, signDoc: SignDoc) => Promise<DirectSignResponse>;
