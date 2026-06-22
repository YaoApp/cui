/**
 * Minimal WS server for debugging proxy issues.
 * Uses the ws library (same as umi) for proper protocol compliance.
 *
 * Usage: node build/test-ws-server.js
 * Then test:
 *   1. Direct:  wscat -c ws://localhost:9999/v1/events
 *   2. Via proxy: browser connects to ws://localhost:8000/v1/events
 */
const http = require('http')
const WS = require('ws')

const PORT = 9999

const server = http.createServer((req, res) => {
	res.writeHead(200, { 'Content-Type': 'text/plain' })
	res.end('WS test server running\n')
})

const wss = new WS.Server({ server })

wss.on('connection', (ws, req) => {
	console.log(`[WS Test] New connection: ${req.url}`)
	console.log(`[WS Test] Headers:`, JSON.stringify(req.headers, null, 2))

	// Send welcome message
	ws.send(JSON.stringify({ type: 'connected', data: { server: 'test-ws-server', url: req.url } }))

	// Periodic ping data (simulates server events)
	const interval = setInterval(() => {
		if (ws.readyState === WS.OPEN) {
			ws.send(JSON.stringify({ type: 'ping', data: { ts: Date.now() } }))
		}
	}, 5000)

	ws.on('message', (data) => {
		console.log(`[WS Test] Received: ${data.toString().slice(0, 200)}`)
		// Echo back
		ws.send(JSON.stringify({ type: 'echo', data: JSON.parse(data.toString()) }))
	})

	ws.on('close', (code, reason) => {
		console.log(`[WS Test] Closed: code=${code} reason=${reason}`)
		clearInterval(interval)
	})

	ws.on('error', (err) => {
		console.log(`[WS Test] Error: ${err.message}`)
		clearInterval(interval)
	})
})

server.listen(PORT, () => {
	console.log(`[WS Test] Server listening on port ${PORT}`)
	console.log(`[WS Test] Direct test: wscat -c ws://localhost:${PORT}/v1/events`)
})
