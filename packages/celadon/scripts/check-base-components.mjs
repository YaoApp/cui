#!/usr/bin/env node
/* 组件复用的检查器 —— **`features/` 与 `routes/` 里不许出现裸 `<button>`**。

   为什么：裸 `<button>` 拿不到设计系统的东西（尺寸档 · token 颜色 · 焦点环），
   于是每个页面各写一套"看起来差不多"的按钮 —— 设计规范就是这么烂掉的。
   要用 `<Button>`（`components/base/button`）。

   为什么只管这两处：`components/` 里有些组件**按设计系统自己的标记**写（分段控件 `.seg` 里就是
   `<button>`，设计页也是这么写的），那是有意的复刻，不是自造。规则窄一点才守得住。

   目标目录取 process.argv[2]，默认 app/src。 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TARGET = resolve(process.argv[2] || join(PACKAGE, 'app', 'src'))

try { statSync(TARGET) } catch {
  console.log('✗ target directory does not exist — the checker refuses to pass on an empty tree (target: ' + TARGET + ')')
  process.exit(1)
}

const CODE = /\.tsx$/
const RAW_BUTTON = /<button[\s>]/
const GUARDED = ['features', 'routes']

const problems = []
let scanned = 0

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) { walk(full); continue }
    if (!CODE.test(entry.name) || entry.name.includes('.test.')) continue
    const rel = relative(TARGET, full)
    if (!GUARDED.includes(rel.split('/')[0])) continue
    scanned++
    readFileSync(full, 'utf8').split('\n').forEach((line, index) => {
      if (RAW_BUTTON.test(line)) {
        problems.push(`${rel}:${index + 1} uses a raw <button> — use <Button> from components/base/button instead`)
      }
    })
  }
}
walk(TARGET)

if (problems.length) {
  console.log(`✗ ${problems.length} raw <button>(s) outside components/base (${scanned} file(s) scanned):`)
  problems.forEach((p) => console.log('  ' + p))
  console.log('  为什么：裸 button 拿不到设计系统的尺寸档 / token 颜色 / 焦点环，每个页面会各写一套。')
  console.log('  怎么办：import { Button } from \'@/components/base/button\'，用 variant / size 表达外观。')
  process.exit(1)
}
console.log(`  ✓ no raw <button> outside components/base (${scanned} file(s) scanned)`)
