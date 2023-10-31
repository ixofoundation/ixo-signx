export declare class Random {
    /**
     * Returns `count` cryptographically secure random bytes
     */
    static getBytes(count: number): Uint8Array;
    /**
     * Returns a hexadecimal string of `count` cryptographically secure random bytes
     */
    static getHex(count: number): string;
}
