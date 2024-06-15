import crypto from 'crypto';

/**
 * Encrypts a JSON object with the provided key (hexadecimal string)
 *
 * @param jsonData The JSON object to encrypt
 * @param key The encryption key as a hexadecimal string
 * @returns A string containing the encrypted data (base64 encoded)
 * @throws Error if key is invalid or encryption fails
 */
export function encryptJson<T>(jsonData: T, key: string): string {
	// Validate key format (hexadecimal string)
	if (!/^[0-9a-fA-F]+$/.test(key)) {
		throw new Error('Invalid encryption key. Key must be a hexadecimal string.');
	}

	try {
		// Convert JSON object to a string
		const dataString = JSON.stringify(jsonData);

		// Convert key string to a Buffer
		const keyBuffer = Buffer.from(key, 'hex');
		// Check key length (AES-256 requires a 32-byte key)
		if (keyBuffer.length !== 32) {
			throw new Error('Invalid encryption key length. Key must be 256 bits.');
		}

		// Use AES-256 in CBC mode with random initialization vector (IV)
		const iv = crypto.randomBytes(16); // Generate random IV
		const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
		cipher.setAutoPadding(true); // Ensure that padding is applied

		// Encrypt the data string with the cipher
		let encrypted = cipher.update(dataString, 'utf8', 'base64');
		encrypted += cipher.final('base64');

		// Prepend the IV to the encrypted data for decryption
		return Buffer.concat([iv, Buffer.from(encrypted, 'base64')]).toString('base64');
	} catch (error) {
		throw new Error('Encryption failed: ' + error.message);
	}
}

/**
 * Decrypts a base64 encoded string containing encrypted JSON data
 *
 * @param encryptedData The base64 encoded string containing encrypted data
 * @param key The encryption key as a hexadecimal string
 * @returns The decrypted JSON object
 * @throws Error if key is invalid, decryption fails, or data format is corrupt
 */
export function decryptJson<T>(encryptedData: string, key: string): T {
	// Validate key format (hexadecimal string)
	if (!/^[0-9a-fA-F]+$/.test(key)) {
		throw new Error('Invalid encryption key. Key must be a hexadecimal string.');
	}

	try {
		// Convert key string to a Buffer
		const keyBuffer = Buffer.from(key, 'hex');
		// Check key length (AES-256 requires a 32-byte key)
		if (keyBuffer.length !== 32) {
			throw new Error('Invalid encryption key length. Key must be 256 bits.');
		}

		// Decode the base64 encoded string
		const combinedBuffer = Buffer.from(encryptedData, 'base64');
		// Ensure there's enough data for the IV and encrypted content
		if (combinedBuffer.length < 17) {
			// At least 16 bytes for IV and a byte of data
			throw new Error('Invalid encrypted data. Data is too short.');
		}

		// Extract the IV from the beginning of the combined buffer
		const iv = combinedBuffer.slice(0, 16);
		const encryptedText = combinedBuffer.slice(16);

		// Use AES-256 in CBC mode with the extracted IV
		const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
		decipher.setAutoPadding(true); // Ensure that padding is applied

		// Decrypt the data buffer with the decipher
		// @ts-ignore
		let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
		// @ts-ignore
		decrypted += decipher.final('utf8');

		// Parse the decrypted string back to a JSON object
		return JSON.parse(decrypted) as T;
	} catch (error) {
		throw new Error('Decryption failed: ' + error.message);
	}
}
