const crypto = globalThis.crypto;

/**
 * Encrypts a JSON object with the provided key (hexadecimal string)
 *
 * @param jsonData The JSON object to encrypt
 * @param key The encryption key as a hexadecimal string
 * @returns A string containing the encrypted data (base64 encoded)
 * @throws Error if key is invalid or encryption fails
 */
export async function encryptJson<T>(jsonData: T, key: string): Promise<string> {
	if (!/^[0-9a-fA-F]+$/.test(key)) {
		throw new Error('Invalid encryption key. Key must be a hexadecimal string.');
	}

	try {
		const dataString = JSON.stringify(jsonData);
		const keyBuffer = hexToUint8Array(key);
		if (keyBuffer.length !== 32) {
			throw new Error('Invalid encryption key length. Key must be 256 bits.');
		}

		const iv = crypto.getRandomValues(new Uint8Array(16)); // 16-byte IV
		const encodedData = new TextEncoder().encode(dataString);

		const cryptoKey = await crypto.subtle.importKey('raw', keyBuffer, { name: 'AES-CBC' }, false, ['encrypt']);

		const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, cryptoKey, encodedData);

		const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
		combined.set(iv, 0);
		combined.set(new Uint8Array(encryptedBuffer), iv.length);

		return Buffer.from(combined).toString('base64');
	} catch (error: any) {
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
export async function decryptJson<T>(encryptedData: string, key: string): Promise<T> {
	if (!/^[0-9a-fA-F]+$/.test(key)) {
		throw new Error('Invalid encryption key. Key must be a hexadecimal string.');
	}

	try {
		const keyBuffer = hexToUint8Array(key);
		if (keyBuffer.length !== 32) {
			throw new Error('Invalid encryption key length. Key must be 256 bits.');
		}

		const combinedBuffer = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
		if (combinedBuffer.length < 17) {
			throw new Error('Invalid encrypted data. Data is too short.');
		}

		const iv = combinedBuffer.slice(0, 16);
		const encryptedText = combinedBuffer.slice(16);

		const cryptoKey = await crypto.subtle.importKey('raw', keyBuffer, { name: 'AES-CBC' }, false, ['decrypt']);

		const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, cryptoKey, encryptedText);

		const decrypted = new TextDecoder().decode(decryptedBuffer);
		return JSON.parse(decrypted) as T;
	} catch (error: any) {
		throw new Error('Decryption failed: ' + error.message);
	}
}

/**
 * Helper: Convert hex string to Uint8Array
 */
function hexToUint8Array(hex: string): Uint8Array {
	const bytes = [];
	for (let i = 0; i < hex.length; i += 2) {
		bytes.push(parseInt(hex.substr(i, 2), 16));
	}
	return new Uint8Array(bytes);
}
