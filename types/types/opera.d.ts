import { Key } from '@keplr-wallet/types';
export interface InterchainWallet {
    getDidDoc: (index: number) => Promise<string>;
    signMessage: (hexSignDoc: string, signMethod: string, addressIndex: number) => Promise<string>;
}
export type OperaKey = Key & {
    readonly name?: string;
    readonly did?: string;
};
