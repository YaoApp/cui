#!/usr/bin/env node
/* **上层不许直接碰宿主机制** —— `features/` · `components/` · `routes/` 里 import `platform/bridge` 即失败。
 *
 * 依据 `15-platform.md` §5：宿主差异只在平台层消化；要问"这是不是桌面 / 能不能做某事"先问 `client/`
 * （能力开关），要读写服务地址走 `service/` 的面孔；`bridge/` 是平台层的内部机制。
 *
 * 白名单只有 `features/verify/**` —— 它是桥检查页，用途就是逐条点名调命令。
 * 目标目录取 process.argv[2]，默认 `app/src`。 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TARGET = resolve(process.argv[2] || join(PACKAGE, 'app', 'src'))

try {
  statSync(TARGET)
} catch {
  console.log('✗ target directory does not exist — the checker refuses to pass on an empty tree (target: ' + TARGET + ')')
  process.exit(1)
}

/** 受约束的上层（平台层以下不许出现宿主机制）。 */
const LAYERS = ['features', 'components', 'routes']
/** 白名单：桥检查页。 */
const ALLOW = /^features[\\/]verify[\\/]/
const CODE = /\.(?:ts|tsx)$/
/** 把注释换成等长空白（保留换行），免得注释里的 import 被当成真的；
    行注释只在 `//` 前面不是引号/冒号/反斜杠时才算注释（保住字符串里的 `https://`）。 */
const blankComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length))

/* 三种写法都要认：多行 import（子句里有换行）· 副作用 import · 动态 import。 */
const FROM = /(?:^|\n)[ \t]*(?:import|export)\b[A-Za-z0-9_$*{},\s]*?\bfrom\b[ \t]*['"]([^'"]+)['"]/g
const SIDE = /(?:^|\n)[ \t]*import[ \t]*['"]([^'"]+)['"]/g
const DYNAMIC = /\bimport[ \t]*\([ \t]*['"]([^'"]+)['"]/g
const BRIDGE_DIR = resolve(TARGET, 'platform', 'bridge')

const files = []
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (CODE.test(entry.name)) files.push(full)
  }
}
walk(TARGET)

const problems = []
for (const file of files) {
  const rel = relative(TARGET, file)
  const layer = rel.split(/[\\/]/)[0]
  if (!LAYERS.includes(layer) || ALLOW.test(rel)) continue
  const text = blankComments(readFileSync(file, 'utf8'))
  const specifiers = []
  for (const re of [FROM, SIDE, DYNAMIC]) {
    re.lastIndex = 0
    let hit
    while ((hit = re.exec(text)) !== null) specifiers.push(hit[1])
  }
  for (const specifier of specifiers) {
    let pointsAtBridge = false
    if (specifier === '@/platform/bridge' || specifier.startsWith('@/platform/bridge/')) pointsAtBridge = true
    else if (specifier.startsWith('.')) {
      const resolved = resolve(dirname(file), specifier)
      pointsAtBridge = resolved === BRIDGE_DIR || resolved.startsWith(BRIDGE_DIR + '/')
    }
    if (pointsAtBridge) problems.push(`${rel} → ${specifier}`)
  }
}

if (problems.length > 0) {
  console.log('✗ upper layers must not reach the host mechanism (use client/ or service/ faces):')
  for (const line of problems) console.log('  ' + line)
  process.exit(1)
}
console.log(`✓ no bridge imports outside the platform layer (${files.length} file(s) scanned)`)
