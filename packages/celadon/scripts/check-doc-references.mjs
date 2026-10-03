#!/usr/bin/env node
/* 文档引用检查 —— **文档提到的文件与命令必须真实存在**。

   文档漂移不靠人 review：提到不存在的文件、不存在的脚本、不存在的命令，直接判失败。
   目标目录取 process.argv[2]，默认文档三处（architecture/ · plan/ · scripts/tests/README.md）。

   两处例外，写在 ALLOW 里并注明原因 —— 例外要看得见，不能悄悄放过。 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** 允许缺失的引用 → 原因。 */
const ALLOW = new Map([
  ['app/src/data/', '规划中未建：架构文档描述目标结构（00-principles.md §2.5）'],
  ['app/src/data/hooks/use-request.ts', '规划中未建：00-principles.md §2.5 的取数钩子，尚未落地'],
  ['app/src/platform/transport/', '规划中未建：15-platform.md 描述的对外通信唯一出口，尚未落地'],
  ['app/src/platform/client/', '规划中未建：15-platform.md 描述的 platform 子目录，尚未落地'],
  ['app/src/platform/manifest.json', '规划中未建：15-platform.md §5.3 的构建清单，由打包写入'],
])
/** 允许出现在文档里、但不是本包 script 的命令。 */
const ALLOW_COMMANDS = new Set(['install', 'add', 'dlx', 'exec', 'run'])

const targets = process.argv[2]
  ? [resolve(process.argv[2])]
  : [join(PACKAGE, 'architecture'), join(PACKAGE, 'plan'), join(PACKAGE, 'scripts', 'tests', 'README.md')]

try { targets.forEach((t) => statSync(t)) } catch {
  console.log('✗ target does not exist — the checker refuses to pass on an empty tree (target: ' + targets.join(', ') + ')')
  process.exit(1)
}

const scripts = JSON.parse(readFileSync(join(PACKAGE, 'package.json'), 'utf8')).scripts ?? {}
const docs = []
const collect = (p) => {
  if (statSync(p).isDirectory()) {
    for (const e of readdirSync(p, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue
      collect(join(p, e.name))
    }
  } else if (/\.md$/.test(p)) docs.push(p)
}
targets.forEach(collect)

const problems = []
let refs = 0

for (const doc of docs) {
  const text = readFileSync(doc, 'utf8')
  const name = doc.replace(PACKAGE + '/', '')
  const check = (raw, kind, exists) => {
    if (raw.includes('<') || raw.includes('>') || raw.includes('*') || raw.includes('...')) return // 占位符、通配与省略
    if (ALLOW.has(raw)) return
    refs++
    if (!exists) problems.push(`${name}: ${kind}「${raw}」不存在`)
  }

  for (const raw of new Set(text.match(/`(app\/src\/[A-Za-z0-9_./-]+)`/g) ?? [])) check(raw.slice(1, -1), '路径', existsSync(join(PACKAGE, raw.slice(1, -1))))
  for (const raw of new Set(text.match(/`(scripts\/[A-Za-z0-9_./-]+\.mjs)`/g) ?? [])) check(raw.slice(1, -1), '脚本', existsSync(join(PACKAGE, raw.slice(1, -1))))
  for (const raw of new Set(text.match(/`pnpm ([a-z:]+)`/g) ?? [])) {
    const cmd = raw.slice(6, -1)
    if (ALLOW_COMMANDS.has(cmd)) continue
    check(cmd, '命令 pnpm', Object.prototype.hasOwnProperty.call(scripts, cmd))
  }
}

if (problems.length) {
  console.log(`✗ ${problems.length} dangling reference(s) across ${docs.length} document(s) (${refs} checked):`)
  problems.forEach((p) => console.log('  ' + p))
  console.log('  怎么办：改文档指向真实文件/命令，或在 check-doc-references.mjs 的 ALLOW 里注明原因。')
  process.exit(1)
}
console.log(`  ✓ document references resolve (${docs.length} document(s), ${refs} reference(s))`)
