import { createServer } from 'vite'

const server = await createServer({
  configFile: new URL('./vite.config.mjs', import.meta.url).pathname,
  server: { host: '0.0.0.0', port: 5066, strictPort: true },
})

await server.listen()
server.printUrls()
