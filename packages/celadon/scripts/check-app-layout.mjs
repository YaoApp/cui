#!/usr/bin/env node
/* app 源码布局检查 —— 管的是"文件该住在哪"。
   规则：测试产物（*.test.* / *.browser.* / *.agent.*）必须在名为 tests 的目录内，源码目录里不许有。
   目标目录取 process.argv[2]，默认 app/src。 */
import { readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TARGET = resolve(process.argv[2] || join(PACKAGE, 'app', 'src'))

try { statSync(TARGET) } catch {
  console.log('✗ target directory does not exist — the checker refuses to pass on an empty tree (target: ' + TARGET + '）')
  process.exit(1)
}

const isCase = (name) => /\.(test|spec|browser|agent)\.(?:[cm]?[jt]sx?|md)$/.test(name)
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
        `${relative(TARGET, full)} is a test artefact outside a tests/ directory — move it there` +
        ` (e.g. ${parts.slice(0, -1).join('/')}/tests/${entry.name})`
      )
    }
  }
}
walk(TARGET)

if (problems.length) {
  console.log(`✗ ${problems.length} layout problem(s) found (${cases.length} test file(s) scanned):`)
  problems.forEach((p) => console.log('  ' + p))
  process.exit(1)
}
console.log('  ✓ app layout ok (' + cases.length + ' test file(s), all inside tests/)')
