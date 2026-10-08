#!/usr/bin/env node
/* app 源码布局检查 —— 两条方向相反的规则，管的是"测试产物该住在哪"。
     1. 单元用例（*.test.ts(x)）与源文件**同目录**，不许待在 tests/ 里
     2. 浏览器用例（*.browser.ts / *.spec.ts）与拟人剧本脚本（*.agent.md / *.agent.mjs）
        **必须**在名为 tests 的目录内
   目标目录取 process.argv[2]，默认 app/src；给文件时只看这些文件（改动文件级）。 */
import { readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readTargets, reports } from './lib/inputs.mjs'

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { roots, filter, target: TARGET, missing } = readTargets(process.argv.slice(2), { defaultDir: join(PACKAGE, 'app', 'src') })

if (missing.length) {
  console.log('✗ target does not exist — the checker refuses to pass on an empty tree (target: ' + missing.join(', ') + ')')
  process.exit(1)
}

const isUnit = (name) => /\.test\.[cm]?[jt]sx?$/.test(name)
const isOuter = (name) => /\.(spec|browser)\.(?:[cm]?[jt]sx?)$/.test(name) || /\.agent\.(?:[cm]?[jt]sx?|md)$/.test(name)

const artefacts = []
const problems = []

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  const siblings = entries.filter((e) => e.isFile() && !isUnit(e.name) && !isOuter(e.name))
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    const parts = relative(TARGET, full).split(/[\\/]/)
    if (entry.isDirectory()) { walk(full); continue }

    const inTests = parts.slice(0, -1).includes('tests')
    const rel = relative(TARGET, full)

    if (isUnit(entry.name)) {
      if (!reports(filter, full)) continue
      artefacts.push(rel)
      if (inTests) {
        problems.push(`${rel} is a unit test inside tests/ — unit tests sit beside the file they test (e.g. ${parts.slice(0, -1).filter((p) => p !== 'tests').join('/')}/${entry.name})`)
      } else if (siblings.length === 0) {
        problems.push(`${rel} has no sibling source file — a unit test belongs beside what it tests`)
      }
      continue
    }
    if (isOuter(entry.name)) {
      if (!reports(filter, full)) continue
      artefacts.push(rel)
      if (!inTests) {
        problems.push(`${rel} is a browser case or persona scenario outside a tests/ directory — move it into the sibling tests/ folder`)
      }
    }
  }
}
for (const root of roots) walk(root)

if (problems.length) {
  console.log(`✗ ${problems.length} layout problem(s) found (${artefacts.length} test artefact(s) scanned):`)
  problems.forEach((p) => console.log('  ' + p))
  process.exit(1)
}
console.log('  ✓ app layout ok (' + artefacts.length + ' test artefact(s): unit beside its source, the rest in tests/)')
