export class Random {
	/**
	 * Returns `count` cryptographically secure random bytes
	 */
	static getBytes(count: number): Uint8Array {
		if (typeof globalThis.crypto?.getRandomValues === 'function') {
			const out = new Uint8Array(count);
			globalThis.crypto.getRandomValues(out);
			return out;
		}

		throw new Error('Web Crypto API (crypto.getRandomValues) not available in this environment.');
	}

	/**
	 * Returns a hexadecimal string of `count` cryptographically secure random bytes
	 */
	static getHex(count: number): string {
		const bytes = this.getBytes(count);
		return Array.from(bytes)
			.map((byte) => byte.toString(16).padStart(2, '0'))
			.join('');
	}
}
