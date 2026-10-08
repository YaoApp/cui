#!/usr/bin/env node
/* 路由写法的检查器 —— **URL 写在动作里，不写在 effect 里**。

   为什么：URL→store 与 store→URL 不在同一批里落地。effect 里改 URL 会与"读 URL 写 store"
   互相追 —— 你删我加，同步刷效果时就是**死循环**：vitest 直接卡死，用例自身的超时也拦不住
   （同步代码占死事件循环）。见 architecture/07-routing.md。

   规则：`useEffect(...)` 的块里不许出现 `setSearchParams(` 或 `navigate(`。
   目标目录取 process.argv[2]，默认 app/src；给文件时只看这些文件（改动文件级）。 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readTargets, reports } from './lib/inputs.mjs'

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { roots, filter, target: TARGET, missing } = readTargets(process.argv.slice(2), { defaultDir: join(PACKAGE, 'app', 'src') })

if (missing.length) {
  console.log('✗ target does not exist — the checker refuses to pass on an empty tree (target: ' + missing.join(', ') + ')')
  process.exit(1)
}

const CODE = /\.(?:[cm]?[jt]sx?)$/
/* 例外清单已清空（绑定钩子随侧边面撤掉了）
   而且它守住了不变量（读只在 POP · 写没变就不动）。 */
const ALLOWED = new Set([]) // 空着：URL 只由页面自己的同步钩子写（2026-10-04 撤掉公共钩子）
const WRITES = /\b(?:setSearchParams|navigate)\s*\(/

/** 从 `useEffect(` 的 `(` 开始，找到与它配对的 `)`；顺带跳过字符串与模板串，别被里面的括号骗了。 */
function effectBody(source, openParen) {
  let depth = 0
  let quote = null
  for (let i = openParen; i < source.length; i++) {
    const ch = source[i]
    const prev = source[i - 1]
    if (quote) {
      if (ch === quote && prev !== '\\') quote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue }
    if (ch === '(') depth++
    else if (ch === ')') {
      depth--
      if (depth === 0) return source.slice(openParen, i + 1)
    }
  }
  return source.slice(openParen)
}

const problems = []
let scanned = 0

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) { walk(full); continue }
    if (!CODE.test(entry.name)) continue
    if (ALLOWED.has(relative(TARGET, full))) continue
    if (!reports(filter, full)) continue
    scanned++
    const source = readFileSync(full, 'utf8')
    let at = source.indexOf('useEffect(')
    while (at >= 0) {
      const body = effectBody(source, at + 'useEffect'.length)
      const hit = body.match(WRITES)
      if (hit) {
        const line = source.slice(0, at).split('\n').length
        problems.push(
          `${relative(TARGET, full)}:${line} writes the URL inside useEffect (${hit[0].trim()}) — ` +
            'write it in the action instead; see architecture/07-routing.md',
        )
      }
      at = source.indexOf('useEffect(', at + 1)
    }
  }
}
for (const root of roots) walk(root)

if (problems.length) {
  console.log(`✗ ${problems.length} routing write(s) inside an effect (${scanned} file(s) scanned):`)
  problems.forEach((p) => console.log('  ' + p))
  console.log('  为什么：两个方向不在同一批落地，effect 里改 URL 会与"读 URL 写 store"互相追成同步死循环。')
  console.log('  怎么办：把改 URL 放进动作里（改过滤、打开面板），effect 只负责 URL → store。')
  process.exit(1)
}
console.log(`  ✓ no URL writes inside effects (${scanned} file(s) scanned)`)
