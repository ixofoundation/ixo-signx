/**
 * Encrypts a JSON object with the provided key (hexadecimal string)
 *
 * @param jsonData The JSON object to encrypt
 * @param key The encryption key as a hexadecimal string
 * @returns A string containing the encrypted data (base64 encoded)
 * @throws Error if key is invalid or encryption fails
 */
export declare function encryptJson<T>(jsonData: T, key: string): Promise<string>;
/**
 * Decrypts a base64 encoded string containing encrypted JSON data
 *
 * @param encryptedData The base64 encoded string containing encrypted data
 * @param key The encryption key as a hexadecimal string
 * @returns The decrypted JSON object
 * @throws Error if key is invalid, decryption fails, or data format is corrupt
 */
export declare function decryptJson<T>(encryptedData: string, key: string): Promise<T>;
