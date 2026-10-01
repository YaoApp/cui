#!/usr/bin/env node
/* plan/*.md 的结构检查 —— 拦的是"表格写坏了自己看不出来"这一类。
   规则：
     1. 表格块内每行的列数必须一致
     2. 表格块必须 = 表头 + 分隔行 + 至少一行数据
     3. 分隔行只能由 ---、:、空格、| 组成
     4. 单行成块的表格行 = 孤立行（通常是插错了位置）→ 直接失败
   目标目录取 process.argv[2]，默认 design 目录的 ../plan（与其它检查器一致）。 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DESIGN = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'design')
process.chdir(DESIGN)
const TARGET = resolve(process.argv[2] || resolve(DESIGN, '..', 'plan'))
process.chdir(TARGET)

const FORBIDDEN_HEADINGS = /^#{1,6}\s*.*(待讨论|未决|TODO|FIXME|TBD)/i;

const files = readdirSync('.').filter((f) => f.endsWith('.md'))
if (files.length === 0) {
  console.log('✗ no Markdown files to check — wrong target directory? (target: ' + TARGET + ')')
  process.exit(1)
}
const isRow = (l) => /^\s*\|/.test(l)
const isSep = (l) => /^\s*\|[\s|:-]+\|\s*$/.test(l) && /-/.test(l)
const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').length

const problems = []
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n')
  const blocks = []
  let cur = []
  lines.forEach((l, i) => {
    if (isRow(l)) cur.push([i + 1, l])
    else { if (cur.length) blocks.push(cur); cur = [] }
  })
  if (cur.length) blocks.push(cur)

  lines.forEach((l, idx) => {
    if (FORBIDDEN_HEADINGS.test(l)) {
      problems.push(`${f}:${idx + 1} an outward-facing document may not have an open-question heading: ${l.trim().slice(0, 40)}`)
    }
  })

  for (const b of blocks) {
    const where = `${f}:${b[0][0]}`
    if (b.length === 1) {
      problems.push(`${where} orphan table row (no table around it): ${b[0][1].trim().slice(0, 50)}`)
      continue
    }
    if (!isSep(b[1][1])) {
      problems.push(`${where} second row of the table is not a separator: ${b[1][1].trim().slice(0, 50)}`)
      continue
    }
    const widths = b.map(([, l]) => cells(l))
    if (new Set(widths).size !== 1) {
      problems.push(`${where} table rows disagree on column count (${[...new Set(widths)].sort().join(' / ')})`)
    }
  }
}

if (problems.length) {
  console.log(`✗ ${problems.length} problem(s) found:`)
  problems.forEach((p) => console.log('  ' + p))
  process.exit(1)
}
console.log('  ✓ plan/ Markdown structure ok (' + files.length + ' file(s); tables and separators are well formed)')
