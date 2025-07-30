/**
 * Header utility class for type-safe header operations
 * Handles the complexity of HeadersInit union type (Headers | Record<string, string> | string[][])
 */
export class HeaderBuilder {
	private headers: Headers

	constructor(init: HeadersInit = {}) {
		this.headers = new Headers(init)
	}

	/**
	 * Set a header value
	 */
	set(name: string, value: string): HeaderBuilder {
		this.headers.set(name, value)
		return this
	}

	/**
	 * Get a header value
	 */
	get(name: string): string | null {
		return this.headers.get(name)
	}

	/**
	 * Check if header exists
	 */
	has(name: string): boolean {
		return this.headers.has(name)
	}

	/**
	 * Delete a header
	 */
	delete(name: string): HeaderBuilder {
		this.headers.delete(name)
		return this
	}

	/**
	 * Convert to Headers object for fetch
	 */
	toHeaders(): Headers {
		return this.headers
	}

	/**
	 * Convert to plain object
	 */
	toObject(): Record<string, string> {
		const obj: Record<string, string> = {}
		this.headers.forEach((value, key) => {
			obj[key] = value
		})
		return obj
	}
}

/**
 * Helper function to create a HeaderBuilder
 */
export function headers(init?: HeadersInit): HeaderBuilder {
	return new HeaderBuilder(init)
}
