/**
 * Sandbox API Types
 * Provides types for Sandbox VNC management functionality
 */

/**
 * VNC Status response
 */
export interface VNCStatus {
	/** VNC service status: ready, starting, not_supported, error */
	status: 'ready' | 'starting' | 'not_supported' | 'error'
	/** Container ID */
	container_id?: string
	/** VNC port inside container */
	vnc_port?: number
	/** WebSocket port inside container */
	websocket_port?: number
	/** Error message if status is error */
	error?: string
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
