#!/usr/bin/env node
/* 给 architecture/*.md 的 meta 盖戳 —— **版本**与**最后修改**由 git 算，不手写。

   · 版本    = v1.<该文档的提交次数>（改了多少次，客观、单调）
   · 最后修改 = 盖戳时刻（精确到秒）—— 不用 git 时间，否则永远慢一个提交
   · 说明    = 取自 architecture/README.md 的索引行（**不在这里再抄一份**，避免第二处真相）

   改完文档跑 `pnpm docs:stamp`；只想核对就跑 `pnpm docs:stamp --check`。 */
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ARCH = join(PACKAGE, 'architecture')
const check = process.argv.includes('--check')

const git = (...args) => execFileSync('git', ['-C', PACKAGE, ...args], { encoding: 'utf8' }).trim()

/** 索引行里的说明：| 00 | [principles](00-principles.md) | **说明** | ✅ | */
const index = readFileSync(join(ARCH, 'README.md'), 'utf8')
const description = (file) => {
  const row = index.split('\n').find((l) => l.includes(`](${file})`))
  const cells = row?.split('|').map((c) => c.trim()) ?? []
  return (cells[3] ?? '').replace(/\*\*/g, '')
}

let changed = 0
for (const name of readdirSync(ARCH).filter((n) => /^\d\d-.*\.md$/.test(n)).sort()) {
  const path = join(ARCH, name)
  const text = readFileSync(path, 'utf8')
  const commits = git('rev-list', '--count', 'HEAD', '--', `architecture/${name}`)
  // 用盖戳时刻，不用 git 时间：写戳时这次改动还没提交，git 的时间永远慢一个提交
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const modified = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  const meta = `- **状态**：✅ 已定\n- **版本**：v1.${commits}\n- **最后修改**：${modified}\n- **说明**：${description(name)}\n`

  const start = text.indexOf('- **状态**')
  if (start < 0) { console.error(`  ✗ ${name}: 没有 meta 块`); process.exitCode = 1; continue }
  const end = text.slice(start).search(/\n(?!- \*\*)/) + start + 1
  const next = text.slice(0, start) + meta + text.slice(end > start ? end : start)
  if (next === text) continue
  changed++
  if (check) console.error(`  ✗ ${name}: meta 与 git 不一致`)
  else writeFileSync(path, next)
}
console.log(check ? `  ${changed === 0 ? '✓' : '✗'} meta ${changed === 0 ? '全部与 git 一致' : `${changed} 份需刷新（跑 pnpm docs:stamp）`}` : `  ✓ 盖戳 ${changed} 份`)
process.exitCode = process.exitCode ?? (check && changed > 0 ? 1 : 0)
