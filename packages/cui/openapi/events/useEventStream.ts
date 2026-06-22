type EventHandler = (data: Record<string, any>) => void

interface EventStreamOptions {
	baseURL?: string
	reconnectMaxDelay?: number
	heartbeatTimeout?: number
}

interface EventStreamState {
	isConnected: boolean
	reconnectAttempts: number
}

class EventStream {
	private ws: WebSocket | null = null
	private listeners = new Map<string, Set<EventHandler>>()
	private state: EventStreamState = { isConnected: false, reconnectAttempts: 0 }
	private heartbeatTimer: ReturnType<typeof setTimeout> | null = null
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null
	private destroyed = false
	private onReconnectCallback: (() => void) | null = null

	private readonly maxDelay: number
	private readonly heartbeatTimeout: number

	constructor(private options: EventStreamOptions = {}) {
		this.maxDelay = options.reconnectMaxDelay ?? 30000
		this.heartbeatTimeout = options.heartbeatTimeout ?? 60000
	}

	connect() {
		if (this.destroyed || this.ws) return
		const url = this.buildWSUrl()
		if (!url) return

		this.ws = new WebSocket(url)

		this.ws.onopen = () => {
			this.state.isConnected = true
			this.state.reconnectAttempts = 0
			this.resetHeartbeat()
		}

		this.ws.onmessage = (event) => {
			try {
				const msg = JSON.parse(event.data)
				this.handleMessage(msg)
			} catch {
				console.warn('[EventStream] Failed to parse message:', event.data)
			}
		}

		this.ws.onclose = () => {
			this.state.isConnected = false
			this.ws = null
			this.clearHeartbeat()
			if (!this.destroyed) this.scheduleReconnect()
		}

		this.ws.onerror = () => {
			this.ws?.close()
		}
	}

	disconnect() {
		this.destroyed = true
		this.clearHeartbeat()
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = null
		}
		if (this.ws) {
			this.ws.close()
			this.ws = null
		}
		this.state.isConnected = false
	}

	subscribe(eventType: string, handler: EventHandler) {
		if (!this.listeners.has(eventType)) {
			this.listeners.set(eventType, new Set())
		}
		this.listeners.get(eventType)!.add(handler)
		return () => this.unsubscribe(eventType, handler)
	}

	unsubscribe(eventType: string, handler: EventHandler) {
		this.listeners.get(eventType)?.delete(handler)
	}

	onReconnect(callback: () => void) {
		this.onReconnectCallback = callback
	}

	get connected() {
		return this.state.isConnected
	}

	private handleMessage(msg: Record<string, any>) {
		const type = msg.type as string
		if (!type) return

		if (type === 'ping') {
			this.sendPong()
			this.resetHeartbeat()
			return
		}

		const data = msg.data as Record<string, any>
		if (!data) return

		// Dispatch to exact-match listeners
		this.listeners.get(type)?.forEach((handler) => handler(data))

		// Dispatch to wildcard listeners (e.g., 'task.*' matches 'task.created')
		const prefix = type.split('.')[0] + '.*'
		this.listeners.get(prefix)?.forEach((handler) => handler({ ...data, __event_type: type }))

		// Dispatch to catch-all
		this.listeners.get('*')?.forEach((handler) => handler({ ...data, __event_type: type }))
	}

	private sendPong() {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify({ type: 'pong' }))
		}
	}

	private resetHeartbeat() {
		this.clearHeartbeat()
		this.heartbeatTimer = setTimeout(() => {
			// No ping received within timeout, assume dead connection
			this.ws?.close()
		}, this.heartbeatTimeout)
	}

	private clearHeartbeat() {
		if (this.heartbeatTimer) {
			clearTimeout(this.heartbeatTimer)
			this.heartbeatTimer = null
		}
	}

	private scheduleReconnect() {
		if (this.destroyed) return
		const attempt = this.state.reconnectAttempts++
		const delay = Math.min(1000 * Math.pow(2, attempt), this.maxDelay)

		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null
			this.connect()
			if (this.onReconnectCallback) {
				setTimeout(() => {
					if (this.state.isConnected && this.onReconnectCallback) {
						this.onReconnectCallback()
					}
				}, 500)
			}
		}, delay)
	}

	private buildWSUrl(): string | null {
		const baseURL = this.options.baseURL || (window.$app?.openapi as any)?.config?.baseURL || '/v1'
		const loc = window.location
		const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:'

		let wsBase: string
		if (baseURL.startsWith('http://') || baseURL.startsWith('https://')) {
			const url = new URL(baseURL)
			wsBase = `${url.protocol === 'https:' ? 'wss:' : 'ws:'}//${url.host}${url.pathname}`
		} else {
			wsBase = `${protocol}//${loc.host}${baseURL}`
		}

		wsBase = wsBase.replace(/\/$/, '')
		return `${wsBase}/events`
	}
}

let globalInstance: EventStream | null = null

export function getEventStream(options?: EventStreamOptions): EventStream {
	if (!globalInstance) {
		globalInstance = new EventStream(options)
	}
	return globalInstance
}

export function destroyEventStream() {
	if (globalInstance) {
		globalInstance.disconnect()
		globalInstance = null
	}
}

export { EventStream }
export type { EventHandler, EventStreamOptions }
