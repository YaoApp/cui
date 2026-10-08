#!/usr/bin/env node
/* 组件复用的检查器 —— **`features/` · `routes/` · `components/`（`components/base/` 除外）
   里不许出现裸控件（`<button>` · `<select>`）**。

   为什么：裸控件拿不到基础件的行为与无障碍，也拿不到设计系统的尺寸档 · token 颜色 · 焦点环，
   于是每个页面各写一套"看起来差不多"的控件 —— 设计规范就是这么烂掉的。
   要按钮用 `<Button>`（`components/base/button`），要下拉用 `<Select>`（`components/base/select`）。

   为什么 `components/base/` 除外：那里就是**包装库**的地方，基础件内部必须落到原生控件，
   库的 headless 组件自身也渲染原生 `<button>` / 弹层结构。

   为什么先不管 `<input>`：`components/base/input` 还没有，而 `features/` 里已有真实的裸 `<input>`
   （world 的过滤框）。在没有受认可的替身之前就禁掉，只会把门禁逼成"过不去"，不是守规范。
   等 `base/input` 落地再把它加进 RAW_CONTROLS。

   目标目录取 process.argv[2]，默认 app/src；给文件时只看这些文件（改动文件级）。 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readTargets, reports } from './lib/inputs.mjs'

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { roots, filter, target: TARGET, dirMode, missing } = readTargets(process.argv.slice(2), { defaultDir: join(PACKAGE, 'app', 'src') })

if (missing.length) {
  console.log('✗ target does not exist — the checker refuses to pass on an empty tree (target: ' + missing.join(', ') + ')')
  process.exit(1)
}

const CODE = /\.tsx$/
/** 要守的顶层目录 */
const GUARDED = ['features', 'routes', 'components']
/** 基础件自己的地盘：包装库的地方，允许落到原生控件 */
const BASE_DIR = 'components/base'
const RAW_CONTROLS = [
  {
    pattern: /<button[\s>]/,
    name: '<button>',
    hint: "use <Button> from '@/components/base/button' (variant / size 表达外观)",
  },
  {
    pattern: /<select[\s>]/,
    name: '<select>',
    hint: "use <Select> from '@/components/base/select'",
  },
]

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
    if (rel === BASE_DIR || rel.startsWith(BASE_DIR + '/')) continue
    if (!reports(filter, full)) continue
    scanned++
    readFileSync(full, 'utf8').split('\n').forEach((line, index) => {
      for (const control of RAW_CONTROLS) {
        if (control.pattern.test(line)) {
          problems.push(`${rel}:${index + 1} uses a raw ${control.name} — ${control.hint} instead`)
        }
      }
    })
  }
}
for (const root of roots) walk(root)

/* 0 文件也算通过是最危险的假绿：目录模式的目标里必须真的有被检查的源码；
   文件模式给的就是改动文件，跳过（例如只改了测试）不算异常。 */
if (!scanned && dirMode) {
  console.log(`✗ no .tsx under features/ · routes/ · components/ (except components/base) — the checker refuses to pass on an empty scan (target: ${TARGET})`)
  process.exit(1)
}

if (problems.length) {
  console.log(`✗ ${problems.length} raw control(s) outside components/base (${scanned} file(s) scanned):`)
  problems.forEach((p) => console.log('  ' + p))
  console.log('  Why: raw controls miss the base components\' behaviour/a11y and the design system sizes / token colours / focus ring.')
  console.log('  Fix: import { Button } from \'@/components/base/button\', or use Select (and base/input once it lands).')
  process.exit(1)
}
console.log(`  ✓ no raw <button> / <select> outside components/base (${scanned} file(s) scanned)`)
