export class Random {
	/**
	 * Returns `count` cryptographically secure random bytes
	 */
	static getBytes(count: number): Uint8Array {
		try {
			// Determine the global object based on the runtime environment
			// @ts-ignore
			const globalObject: Window = typeof window === 'object' ? window : self;
			// Attempt to access the crypto API from the global object
			const cryptoApi = globalObject.crypto || (globalObject as any).msCrypto;

			if (cryptoApi && cryptoApi.getRandomValues) {
				// Use the Web Crypto API if available
				const out = new Uint8Array(count);
				cryptoApi.getRandomValues(out);
				return out;
			} else {
				throw new Error('Web Crypto API not available');
			}
		} catch (error) {
			try {
				// Attempt to use Node.js's crypto module as a fallback
				const crypto = require('crypto');
				return crypto.randomBytes(count);
			} catch (nodeError) {
				// If both methods fail, throw an error
				throw new Error('No secure random number generator found');
			}
		}
	}

	/**
	 * Returns a hexadecimal string of `count` cryptographically secure random bytes
	 */
	static getHex(count: number): string {
		const bytes = this.getBytes(count); // Get random bytes
		// Convert the byte array to a hexadecimal string
		return Array.from(bytes)
			.map(byte => byte.toString(16).padStart(2, '0'))
			.join('');
	}
}
