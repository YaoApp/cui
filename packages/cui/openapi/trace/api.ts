import { OpenAPI } from '../openapi'
import {
	TraceInfo,
	TraceEvent,
	TraceEventsResponse,
	TraceNodesResponse,
	TraceNode,
	TraceLogsResponse,
	TraceSpacesResponse,
	TraceSpace,
	TraceEventCallback
} from './types'

export class TraceAPI {
	constructor(private api: OpenAPI) {}

	/**
	 * Get trace info
	 * GET /traces/:traceID/info
	 */
	async GetInfo(traceID: string) {
		return this.api.Get<TraceInfo>(`/trace/traces/${traceID}/info`)
	}

	/**
	 * Get trace events (history)
	 * GET /traces/:traceID/events
	 */
	async GetEvents(traceID: string) {
		return this.api.Get<TraceEventsResponse>(`/trace/traces/${traceID}/events`)
	}

	/**
	 * Stream trace events (SSE)
	 * GET /traces/:traceID/events?stream=true
	 *
	 * Note: This uses EventSource which relies on cookies for authentication.
	 * Make sure the client is authenticated before calling this.
	 */
	StreamEvents(traceID: string, onEvent: TraceEventCallback, onError?: (error: Event) => void): EventSource {
		// Access private config to get baseURL
		// @ts-ignore
		const baseURL = this.api.config.baseURL
		const url = `${baseURL}/trace/traces/${traceID}/events?stream=true`

		const eventSource = new EventSource(url, { withCredentials: true })

		// List of event types from backend
		const eventTypes = [
			'init',
			'node_start',
			'node_complete',
			'node_failed',
			'log_added',
			'space_created',
			'space_deleted',
			'memory_add',
			'memory_update',
			'memory_delete',
			'complete',
			'error'
		]

		// Add listener for each event type
		eventTypes.forEach((type) => {
			eventSource.addEventListener(type, (e: MessageEvent) => {
				try {
					const eventData = JSON.parse(e.data) as TraceEvent
					onEvent(eventData)

					// Close connection when trace is complete
					if (eventData.type === 'complete' || eventData.type === 'error') {
						eventSource.close()
					}
				} catch (err) {
					onError?.(err as any)
					eventSource.close()
				}
			})
		})

		eventSource.onerror = (error) => {
			// Only trigger error if not already closed
			if (eventSource.readyState !== EventSource.CLOSED) {
				onError?.(error)
				// Close to prevent auto-reconnect
				eventSource.close()
			}
		}

		return eventSource
	}

	/**
	 * Get all nodes
	 * GET /traces/:traceID/nodes
	 */
	async GetNodes(traceID: string) {
		return this.api.Get<TraceNodesResponse>(`/trace/traces/${traceID}/nodes`)
	}

	/**
	 * Get single node
	 * GET /traces/:traceID/nodes/:nodeID
	 */
	async GetNode(traceID: string, nodeID: string) {
		return this.api.Get<TraceNode>(`/trace/traces/${traceID}/nodes/${nodeID}`)
	}

	/**
	 * Get logs
	 * GET /traces/:traceID/logs
	 * GET /traces/:traceID/logs/:nodeID
	 */
	async GetLogs(traceID: string, nodeID?: string) {
		const path = nodeID ? `/trace/traces/${traceID}/logs/${nodeID}` : `/trace/traces/${traceID}/logs`
		return this.api.Get<TraceLogsResponse>(path)
	}

	/**
	 * Get spaces (metadata only)
	 * GET /traces/:traceID/spaces
	 */
	async GetSpaces(traceID: string) {
		return this.api.Get<TraceSpacesResponse>(`/trace/traces/${traceID}/spaces`)
	}

	/**
	 * Get single space with data
	 * GET /traces/:traceID/spaces/:spaceID
	 */
	async GetSpace(traceID: string, spaceID: string) {
		return this.api.Get<TraceSpace>(`/trace/traces/${traceID}/spaces/${spaceID}`)
	}
}
