#!/usr/bin/env node
/* 跑 features/<域>/tests/ 下的所有拟人采集脚本（*.agent.mjs），**一个场景一份日志**。
   发现规则与后缀约定一致；每个场景交给 run-logged.mjs，于是日志名就是场景名。
   用法：pnpm test:persona */
import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FEATURES = join(PACKAGE, 'app', 'src', 'features')

const found = []
for (const feature of readdirSync(FEATURES, { withFileTypes: true })) {
  if (!feature.isDirectory()) continue
  const dir = join(FEATURES, feature.name, 'tests')
  let entries
  try { entries = readdirSync(dir) } catch { continue }
  for (const name of entries) {
    if (name.endsWith('.agent.mjs')) found.push({ scenario: name.replace('.agent.mjs', ''), path: join(dir, name) })
  }
}

if (!found.length) {
  console.error('✗ no *.agent.mjs found under app/src/features/*/tests/')
  process.exit(1)
}

let failed = 0
for (const { scenario, path } of found) {
  try {
    execFileSync('node', [join(PACKAGE, 'scripts', 'run-logged.mjs'), scenario, 'node', path], { stdio: 'inherit', cwd: PACKAGE })
  } catch {
    failed++
  }
}
console.log(`  ${found.length - failed} / ${found.length} scenario(s) passed`)
process.exit(failed ? 1 : 0)
