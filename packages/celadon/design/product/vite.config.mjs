import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const health = {
  name: 'product-health',
  configureServer(server) {
    server.middlewares.use('/api/health', (_request, response) => {
      response.setHeader('content-type', 'application/json; charset=utf-8')
      response.end(JSON.stringify({ ok: true, surface: 'design/product' }))
    })
  },
}

export default defineConfig({
  plugins: [react(), health],
  server: {
    host: '0.0.0.0',
    port: 5066,
    strictPort: true,
  },
})
