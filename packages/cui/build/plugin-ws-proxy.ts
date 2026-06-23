/**
 * Umi plugin: WebSocket proxy using ws library on both ends.
 * Only active during development (umi dev). Has no effect on production builds.
 *
 * Client side: ws.Server.handleUpgrade (same mechanism as webpack-hmr — works in browsers)
 * Backend side: new WebSocket() client connection (forwards auth headers)
 * Proxy: bidirectional message forwarding with retry on connection failure
 */
import http from 'http'
import net from 'net'
import { URL } from 'url'

const YAO_SERVER = process.env.YAO_SERVER_HOST || 'http://yao-dev-server:5099'
const WS_PROXY_PATHS = ['/v1/', '/api/']
const BACKEND_CONNECT_TIMEOUT = 5000
const BACKEND_RETRY_ATTEMPTS = 3
const BACKEND_RETRY_DELAY = 500

export default (api: any) => {
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

			server.setMaxListeners(50)

			const target = new URL(YAO_SERVER)
			const wss = new WS.Server({ noServer: true })
			wss.setMaxListeners(50)

			const existingListeners = server.listeners('upgrade').slice()
			server.removeAllListeners('upgrade')

			server.on('upgrade', (upgradeReq: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
				const url = upgradeReq.url || ''
				const protocol = upgradeReq.headers['sec-websocket-protocol']

				if (protocol === 'webpack-hmr') {
					for (const listener of existingListeners) {
						;(listener as any)(upgradeReq, socket, head)
					}
					return
				}

				if (!WS_PROXY_PATHS.some((p) => url.startsWith(p))) {
					socket.destroy()
					return
				}

				wss.handleUpgrade(upgradeReq, socket, head, (clientWs: any) => {
					const backendUrl = `ws://${target.host}${url}`
					const headers: Record<string, string> = {}
					if (upgradeReq.headers.cookie) headers['Cookie'] = upgradeReq.headers.cookie
					if (upgradeReq.headers.authorization) headers['Authorization'] = upgradeReq.headers.authorization
					headers['Origin'] = target.origin
					headers['Host'] = target.host

					connectBackend(WS, backendUrl, headers, clientWs, BACKEND_RETRY_ATTEMPTS)
				})
			})

			next()
		}
	})
}

function connectBackend(WS: any, url: string, headers: Record<string, string>, clientWs: any, retriesLeft: number) {
	if (clientWs.readyState !== WS.OPEN) return

	const backendWs = new WS(url, {
		headers,
		handshakeTimeout: BACKEND_CONNECT_TIMEOUT
	})

	let connected = false
	let cleaned = false
	const pendingMessages: Array<{ data: any; isBinary: boolean }> = []

	function cleanup() {
		if (cleaned) return
		cleaned = true
		pendingMessages.length = 0
		backendWs.removeAllListeners()
		clientWs.removeAllListeners('message')
		clientWs.removeAllListeners('close')
		clientWs.removeAllListeners('error')
	}

	backendWs.on('open', () => {
		connected = true
		if (pendingMessages.length > 0) {
			console.log(`[WS Proxy] flushing ${pendingMessages.length} pending messages`)
			for (const msg of pendingMessages) {
				backendWs.send(msg.data, { binary: msg.isBinary })
			}
			pendingMessages.length = 0
		}
	})

	backendWs.on('unexpected-response', (_req: any, res: any) => {
		let body = ''
		res.on('data', (chunk: any) => { body += chunk.toString() })
		res.on('end', () => {
			console.error(`[WS Proxy] Backend rejected ${res.statusCode}: ${body}`)
			cleanup()
			if (clientWs.readyState === WS.OPEN) {
				clientWs.close(1002, 'Backend rejected')
			}
		})
	})

	backendWs.on('message', (data: any, isBinary: boolean) => {
		if (clientWs.readyState === WS.OPEN) {
			clientWs.send(data, { binary: isBinary })
		}
	})

	clientWs.on('message', (data: any, isBinary: boolean) => {
		if (backendWs.readyState === WS.OPEN) {
			backendWs.send(data, { binary: isBinary })
		} else if (!cleaned) {
			console.log(`[WS Proxy] client message queued (backendWs connecting)`)
			pendingMessages.push({ data, isBinary })
		}
	})

	const validCode = (code: number) => code === 1000 || (code >= 3000 && code <= 4999)

	backendWs.on('close', (code: number, reason: Buffer) => {
		cleanup()
		if (clientWs.readyState === WS.OPEN) {
			clientWs.close(validCode(code) ? code : 1000, reason)
		}
	})

	clientWs.on('close', (code: number, reason: Buffer) => {
		cleanup()
		if (backendWs.readyState === WS.OPEN) {
			backendWs.close(validCode(code) ? code : 1000, reason)
		}
	})

	backendWs.on('error', (err: Error) => {
		if (!connected && retriesLeft > 0) {
			backendWs.removeAllListeners()
			setTimeout(() => {
				connectBackend(WS, url, headers, clientWs, retriesLeft - 1)
			}, BACKEND_RETRY_DELAY)
			return
		}

		console.error(`[WS Proxy] Backend WS error (connected=${connected}): ${err.message}`)
		cleanup()
		if (clientWs.readyState === WS.OPEN) {
			clientWs.close(1001, 'Backend error')
		}
	})

	clientWs.on('error', (_err: Error) => {
		cleanup()
		if (backendWs.readyState === WS.OPEN) {
			backendWs.close()
		}
	})
}
