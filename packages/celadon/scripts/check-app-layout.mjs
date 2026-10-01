#!/usr/bin/env node
/* app 源码布局检查 —— 管的是"文件该住在哪"。
   规则：用例（*.test.* / *.spec.*）必须在名为 tests 的目录内，源码目录里不许有。
   目标目录取 process.argv[2]，默认 app/src。 */
import { readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TARGET = resolve(process.argv[2] || join(PACKAGE, 'app', 'src'))

try { statSync(TARGET) } catch {
  console.log('✗ 目标目录不存在 —— 检查器不会在空目录上假装通过（目标：' + TARGET + '）')
  process.exit(1)
}

const isCase = (name) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(name)
const cases = []
const problems = []

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) { walk(full); continue }
    if (!isCase(entry.name)) continue
    const parts = relative(TARGET, full).split(/[\\/]/)
    cases.push(relative(TARGET, full))
    if (!parts.slice(0, -1).includes('tests')) {
      problems.push(
        `${relative(TARGET, full)} 用例不在 tests/ 目录内 —— 移到同级 tests/ 下` +
        `（例：${parts.slice(0, -1).join('/')}/tests/${entry.name}）`
      )
    }
  }
}
walk(TARGET)

if (problems.length) {
  console.log(`✗ 发现 ${problems.length} 个布局问题（扫描到 ${cases.length} 个用例文件）：`)
  problems.forEach((p) => console.log('  ' + p))
  process.exit(1)
}
console.log('  ✓ app 布局合规（' + cases.length + ' 个用例文件全在 tests/ 内）')
