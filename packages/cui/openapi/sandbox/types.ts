/**
 * Sandbox API Types
 * Provides types for Sandbox VNC management functionality
 */

/**
 * VNC Status response
 */
export interface VNCStatus {
	/** VNC service status: ready, starting, not_supported, unavailable */
	status: 'ready' | 'starting' | 'not_supported' | 'unavailable'
	/** Whether VNC is available */
	available?: boolean
	/** Sandbox ID */
	sandbox_id?: string
	/** Container name */
	container?: string
	/** Status message from server */
	message?: string
	/** Client URL path */
	client_url?: string
	/** WebSocket URL path */
	websocket_url?: string
}

/**
 * Sandbox info
 */
export interface SandboxInfo {
	/** Sandbox ID (userID-chatID format) */
	id: string
	/** Container ID */
	container_id?: string
	/** Container status */
	status?: string
	/** Docker image name */
	image?: string
	/** Creation time */
	created_at?: string
}
