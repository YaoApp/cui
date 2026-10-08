#!/usr/bin/env node
/**
 * ci-like.mjs — `pnpm test:ci-like`：按「CI 等价」的定义跑两遍。
 *
 *   一：与 CI 同样的命令各跑一遍 —— lint · check · test:checkers · test · 全量 test:browser；
 *   二：后端不可达再跑一遍 test:browser（live 用例按设计跳过）。
 *
 * 第二条是防线：后端可达时才过的用例不算数，前端必须自己站得住。
 * 两条都过才算等价；任一失败以非 0 退出。跑完自动收掉自己起的 dev 服务。
 */
import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
import { PACKAGE } from './lib/targets.mjs'

const DEAD_BACKEND = 'http://127.0.0.1:9'

function run(command, args, env = {}) {
  const result = spawnSync(command, args, { cwd: PACKAGE, stdio: 'inherit', env: { ...process.env, ...env } })
  return result.status ?? 1
}

function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      server.close(() => resolvePort(port))
    })
  })
}

async function waitFor(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      await fetch(url, { signal: AbortSignal.timeout(1500) })
      return true
    } catch {
      await new Promise((r) => setTimeout(r, 300))
    }
  }
  return false
}

const failed = []
function step(name, command, args, env = {}) {
  console.log(`\n▸ ${name}`)
  if (run(command, args, env) !== 0) failed.push(name)
}

step('lint', 'pnpm', ['lint'])
step('check', 'pnpm', ['check'])
step('test:checkers', 'pnpm', ['test:checkers'])
step('test', 'pnpm', ['test'])
step('test:browser（后端可达）', 'pnpm', ['test:browser'])

console.log('\n▸ 后端不可达再跑一遍浏览器用例')
const port = await freePort()
const child = spawn('pnpm', ['dev', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: PACKAGE,
  env: { ...process.env, YAO_SERVER_HOST: DEAD_BACKEND },
  detached: true,
  stdio: 'ignore',
})
const stop = () => { try { process.kill(-child.pid, 'SIGTERM') } catch { /* 已经退出 */ } }
process.on('exit', stop)
for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) {
  process.on(signal, () => { stop(); process.exit(code) })
}

const url = `http://127.0.0.1:${port}`
if (!(await waitFor(url))) {
  stop()
  failed.push('dev server（后端不可达）没起来')
  console.log(`✗ dev server 没起来：${url}`)
} else {
  step('test:browser（后端不可达）', 'pnpm', ['test:browser'], { CUI_BASE_URL: url })
  stop()
}

if (failed.length) {
  console.log(`\ntest:ci-like ✗ 失败：${failed.join(' · ')}`)
  process.exit(1)
}
console.log('\ntest:ci-like ✓ 两条都过：CI 命令一遍 + 后端不可达一遍')
