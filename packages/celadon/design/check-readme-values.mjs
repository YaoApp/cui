#!/usr/bin/env node
/**
 * check-readme-values.mjs — README 里引用的色值是否都还在 tokens 里（防「表没跟上」）
 * 用法：node packages/celadon/design/check-readme-values.mjs    （有陈旧值退出码 1，可进 CI）
 *
 * 背景：配色改过之后，叙述段落更新了、表格里的手写数值却没跟上（已发生两次）。
 * 规范：hex 统一小写比较；rgba 解析成数值再比较（`0.6` 与 `.60` 视为同一值）。
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const tokens = readFileSync(resolve(here, 'tokens.css'), 'utf8')
const readme = readFileSync(resolve(here, 'README.md'), 'utf8')

/** rgba(18, 17, 16, 0.6) / rgba(18,17,16,.60) → "rgba(18,17,16,0.60)" */
const canon = v => {
  const s = v.replace(/\s+/g, '')
  const m = s.match(/^rgba?\(([^)]*)\)$/i)
  if (!m) return s.toLowerCase()
  const n = m[1].split(',').map(Number)
  return `rgba(${n[0]|0},${n[1]|0},${n[2]|0},${n[3] === undefined ? 1 : Number(n[3].toFixed(2))})`
}
/** 叙述里"曾经用什么"的历史值／说明性数值，明确允许 */
const ALLOW = new Set([
  '#080808', '#101010',   // 「暗面不再是纯黑」引用
  '#7a7a82', '#e9f6f1',   // 「原值不达标 / 与品牌软底撞色」引用
  '#2d8282',              // 「品牌色如何选定」的历史取值
  '#000000'
].map(canon))

const tokenValues = new Set([
  ...[...tokens.matchAll(/#[0-9a-fA-F]{6}\b/g)].map(m => canon(m[0])),
  ...[...tokens.matchAll(/rgba?\([^)]*\)/g)].map(m => canon(m[0]))
])

const stale = []
readme.split('\n').forEach((line, i) => {
  for (const m of line.matchAll(/#[0-9a-fA-F]{6}\b|rgba?\([^)]*\)/g)) {
    const v = canon(m[0])
    if (ALLOW.has(v) || tokenValues.has(v)) continue
    stale.push(`L${i + 1}: ${m[0]}  ← ${line.trim().slice(0, 72)}`)
  }
})

console.log(`✓ README 引用色值检查 · tokens.css 共 ${tokenValues.size} 个色值`)
if (stale.length) {
  console.log(`✗ 发现 ${stale.length} 个 README 里出现、tokens 里没有的值（可能是旧值）：`)
  stale.forEach(x => console.log('   ' + x))
  process.exit(1)
}
console.log('✓ README 引用的色值与 tokens 一致')
