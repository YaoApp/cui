import { OpenAPI } from '../openapi'
import type { VNCStatus } from './types'

/**
 * Sandbox API - OAuth protected Sandbox management
 * Provides access to Sandbox VNC functionality
 */
export class Sandbox {
	constructor(private api: OpenAPI) {}

	/**
	 * Get the base URL from API config
	 */
	private get baseURL(): string {
		// @ts-ignore - Access private config to get baseURL
		return this.api.config.baseURL
	}

	/**
	 * Get VNC status for a sandbox
	 * GET /sandbox/:id/vnc
	 *
	 * @param sandboxId - Sandbox ID (userID-chatID format)
	 * @returns VNC status
	 */
	async GetVNCStatus(sandboxId: string): Promise<VNCStatus | null> {
		const response = await this.api.Get<VNCStatus>(`/sandbox/${sandboxId}/vnc`)
		if (this.api.IsError(response)) {
			console.error('Failed to get VNC status:', response.error)
			return null
		}
		return this.api.GetData(response)
	}

	/**
	 * Get VNC client page URL (API path)
	 * @param sandboxId - Sandbox ID
	 * @returns VNC client page URL path
	 */
	GetVNCClientURL(sandboxId: string): string {
		return `${this.baseURL}/sandbox/${sandboxId}/vnc/client`
	}

	/**
	 * Get VNC WebSocket URL for direct connection
	 * @param sandboxId - Sandbox ID
	 * @returns WebSocket URL for VNC connection
	 */
	GetVNCWebSocketURL(sandboxId: string): string {
		// Convert http(s) base URL to ws(s) WebSocket URL
		const baseURL = this.baseURL
		let wsBaseURL: string

		if (typeof window !== 'undefined') {
			// Browser environment - use current host with appropriate protocol
			const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
			const host = window.location.host

			// Extract path from baseURL (e.g., "/api/v1" from "http://localhost/api/v1")
			let path = ''
			try {
				const url = new URL(baseURL, window.location.origin)
				path = url.pathname
			} catch {
				// If baseURL is relative, use it directly as path
				path = baseURL.startsWith('/') ? baseURL : `/${baseURL}`
			}

			wsBaseURL = `${protocol}//${host}${path}`
		} else {
			// Non-browser environment - convert URL protocol
			wsBaseURL = baseURL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')
		}

		return `${wsBaseURL}/sandbox/${sandboxId}/vnc/ws`
	}

	/**
	 * Get CUI Sandbox viewer page URL
	 * @param sandboxId - Sandbox ID
	 * @returns CUI Sandbox page URL path (for navigation)
	 */
	GetViewerURL(sandboxId: string): string {
		return `/sandbox/${sandboxId}`
	}
}
