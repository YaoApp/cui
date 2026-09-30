#!/usr/bin/env node
/**
 * serve.mjs — 设计资产的本地静态服务器（零依赖）
 *
 * 为什么不用 `python3 -m http.server`：它不发 Cache-Control，浏览器会启发式缓存
 * `tokens.css` / `bundle.js`，改完 token 刷新还是旧样式（"我改了但看不出变化"）。
 * 这里一律 `Cache-Control: no-store`，改完直接刷新即见。
 *
 * 用法：node packages/celadon/design/serve.mjs [端口]     （默认 8080）
 */
import { createServer } from 'node:http'
import { readdir, readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const port = Number(process.argv[2] || process.env.PORT || 8080)

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.less': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8'
}
const NO_CACHE = { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache' }

const list = async (dir, urlPath) => {
  const items = (await readdir(dir, { withFileTypes: true })).filter(d => !d.name.startsWith('.'))
  const rows = items
    .sort((a, b) => (a.isDirectory() === b.isDirectory() ? a.name.localeCompare(b.name) : a.isDirectory() ? -1 : 1))
    .map(d => `<li><a href="${urlPath}${encodeURIComponent(d.name)}${d.isDirectory() ? '/' : ''}">${d.name}${d.isDirectory() ? '/' : ''}</a></li>`)
    .join('')
  return `<!doctype html><meta charset="utf-8"><title>${urlPath}</title>
<body style="font:14px/1.6 -apple-system,system-ui,sans-serif;padding:24px">
<h3>${urlPath}</h3><ul>${rows}</ul></body>`
}

createServer(async (req, res) => {
  const send = (code, body, type = 'text/plain; charset=utf-8') =>
    res.writeHead(code, { 'Content-Type': type, ...NO_CACHE }).end(body)
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://local').pathname)
    if (p.endsWith('/')) p += 'index.html'
    const file = normalize(join(root, p))
    if (!file.startsWith(root)) return send(403, '403 forbidden')
    const info = await stat(file)
    if (info.isDirectory()) return send(200, await list(file, p.replace(/index\.html$/, '')), 'text/html; charset=utf-8')
    const body = await readFile(file)
    res.writeHead(200, { 'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream', 'Content-Length': body.length, ...NO_CACHE })
    res.end(body)
  } catch {
    // 目录（无 index.html）→ 列目录；其余 → 404
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://local').pathname)
      if (!p.endsWith('/')) return send(404, '404 not found')
      const dir = normalize(join(root, p))
      if (!dir.startsWith(root)) return send(403, '403 forbidden')
      await stat(dir)
      return send(200, await list(dir, p), 'text/html; charset=utf-8')
    } catch { return send(404, '404 not found') }
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`celadon design · 已启动 · http://0.0.0.0:${port}/  （改完刷新即见，不发缓存）`)
})
