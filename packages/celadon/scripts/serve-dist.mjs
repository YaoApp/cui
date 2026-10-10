#!/usr/bin/env node
/* 预览 dist/ 的静态服务器 —— **带 SPA fallback**。

   为什么不能用 `python3 -m http.server`：它没有 fallback。我们的路由是**路径**路由
   （`/app/inbox`，见 architecture/07-routing.md），用户刷新深链时服务器必须把 index.html 发回去。
   生产由引擎托管，同样需要这条 fallback —— 这是选路径路由的代价，写在 04 里。
   应用跑在**构建决定的命名空间**之下（见 architecture/04）：名字取 CUI_BASE（默认 app），根 `/` 不属于应用。

   用法：node scripts/serve-dist.mjs [port] [dir] */
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.argv[2] ?? 5200)
const ROOT = resolve(process.argv[3] ?? join(PACKAGE, 'dist'))
const NS = (process.env.CUI_BASE ?? 'app').replace(/^\/+|\/+$/g, '')
const NS_PREFIX = `/${NS}`

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
}

createServer((req, res) => {
  let path
  try {
    path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)
  } catch {
    // 非法转义（如 /app/%zz）：一条坏请求不该打死服务器
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('bad request')
    return
  }
  // 根不属于应用：命名空间外一律 404，别让人以为这是根部署（见 architecture/04-host-integration.md）
  if (path !== NS_PREFIX && !path.startsWith(NS_PREFIX + '/')) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(`not found — the app lives under ${NS_PREFIX}/`)
    return
  }
  const rest = path.slice(NS_PREFIX.length) || '/'
  let file = join(ROOT, normalize(rest).replace(/^(\.\.[/\\])+/, ''))
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file)) {
    // SPA fallback 只给**导航请求**（浏览器要一个文档）；缺的静态资源老老实实 404 ——
    // 否则"JS 请求拿到 HTML"会变成难查的 MIME 报错。
    const wantsDocument = (req.headers.accept ?? '').includes('text/html') && !extname(path)
    if (!wantsDocument) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('not found'); return }
    file = join(ROOT, 'index.html')
  }
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'no-cache',
  })
  createReadStream(file).pipe(res)
}).listen(PORT, '0.0.0.0', () => {
  console.log(`  dist preview → http://0.0.0.0:${PORT}${NS_PREFIX}/  (SPA fallback on, root ${ROOT})`)
})
