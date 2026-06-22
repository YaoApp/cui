/**
 * Umi plugin: WebSocket proxy using ws library on both ends.
 * Only active during development (umi dev). Has no effect on production builds.
 *
 * Client side: ws.Server.handleUpgrade (same mechanism as webpack-hmr — works in browsers)
 * Backend side: new WebSocket() client connection (forwards auth headers)
 * Proxy: bidirectional message forwarding
 */
import http from 'http'
import net from 'net'
import { URL } from 'url'

const YAO_SERVER = process.env.YAO_SERVER_HOST || 'http://yao-dev-server:5099'
const WS_PROXY_PATHS = ['/v1/', '/api/']

export default (api: any) => {
	// addBeforeMiddlewares only runs during umi dev, not umi build
	api.addBeforeMiddlewares(() => {
		let registered = false
		let WS: any
		try {
			WS = require('ws')
		} catch {
			console.warn('[WS Proxy] ws package not available, skipping')
			return (_req: any, _res: any, next: any) => next()
		}

		return (req: any, _res: any, next: any) => {
			if (registered) return next()
			const server: http.Server | undefined = req.socket?.server
			if (!server) return next()
			registered = true

			const target = new URL(YAO_SERVER)

			// Create our own WebSocket server (noServer mode, like umi's HMR)
			const wss = new WS.Server({ noServer: true })

			// Remove umi's upgrade listener and take over
			const existingListeners = server.listeners('upgrade')
			server.removeAllListeners('upgrade')

			server.on('upgrade', (upgradeReq: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
				const url = upgradeReq.url || ''
				const protocol = upgradeReq.headers['sec-websocket-protocol']

				// Webpack HMR — delegate to umi's original handler
				if (protocol === 'webpack-hmr') {
					for (const listener of existingListeners) {
						;(listener as any)(upgradeReq, socket, head)
					}
					return
				}

				// Our proxy paths
				if (!WS_PROXY_PATHS.some((p) => url.startsWith(p))) {
					socket.destroy()
					return
				}

				// Use ws library to complete browser handshake (handles extensions, etc)
				wss.handleUpgrade(upgradeReq, socket, head, (clientWs: any) => {
					// Build backend WebSocket URL
					const backendUrl = `ws://${target.host}${url}`

					// Forward original headers to backend (changeOrigin: use backend's own origin)
					const headers: Record<string, string> = {}
					if (upgradeReq.headers.cookie) headers['Cookie'] = upgradeReq.headers.cookie
					if (upgradeReq.headers.authorization) headers['Authorization'] = upgradeReq.headers.authorization
					headers['Origin'] = target.origin
					headers['Host'] = target.host

					const backendWs = new WS(backendUrl, { headers })

					backendWs.on('unexpected-response', (_req: any, res: any) => {
						let body = ''
						res.on('data', (chunk: any) => { body += chunk.toString() })
						res.on('end', () => {
							console.error(`[WS Proxy] Backend rejected ${res.statusCode}: ${body}`)
							clientWs.close(1002, 'Backend rejected')
						})
					})

					// Backend → Client
					backendWs.on('message', (data: any, isBinary: boolean) => {
						if (clientWs.readyState === WS.OPEN) {
							clientWs.send(data, { binary: isBinary })
						}
					})

					// Client → Backend
					clientWs.on('message', (data: any, isBinary: boolean) => {
						if (backendWs.readyState === WS.OPEN) {
							backendWs.send(data, { binary: isBinary })
						}
					})

					// Close propagation (validate code per RFC 6455 — must be 1000 or 3000-4999)
					const validCode = (code: number) => code === 1000 || (code >= 3000 && code <= 4999)
					backendWs.on('close', (code: number, reason: Buffer) => {
						if (clientWs.readyState === WS.OPEN) {
							clientWs.close(validCode(code) ? code : 1000, reason)
						}
					})
					clientWs.on('close', (code: number, reason: Buffer) => {
						if (backendWs.readyState === WS.OPEN) {
							backendWs.close(validCode(code) ? code : 1000, reason)
						}
					})

					// Error handling
					backendWs.on('error', (err: Error) => {
						console.error('[WS Proxy] Backend WS error:', err.message)
						clientWs.close(1001, 'Backend error')
					})
					clientWs.on('error', (err: Error) => {
						console.error('[WS Proxy] Client WS error:', err.message)
						backendWs.close()
					})
				})
			})

			next()
		}
	})
}
