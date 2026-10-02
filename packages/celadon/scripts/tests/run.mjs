#!/usr/bin/env node
/**
 * run.mjs — 把每个检查器喂给它的测试样本，核对"该过的过、该挂的挂"
 *
 * 用例目录命名即期望：
 *   clean*        → 检查器应通过（退出码 0）
 *   violation*    → 检查器应失败（退出码非 0）
 *
 * 跑法：node scripts/tests/run.mjs
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SCRIPTS = resolve(HERE, '..')
const CASES = resolve(HERE, 'cases')

/** 检查器 → 它的样本目录（样本按检查器分） */
const SUITES = [
  ['check-css-conventions.mjs', 'css-conventions'],
  ['check-tokens.mjs', 'tokens'],
  ['check-i18n.mjs', 'i18n'],
  ['check-readme-values.mjs', 'readme-values'],
  ['check-plan-md.mjs', 'check-plan-md'],
  ['check-app-layout.mjs', 'app-layout'],
  ['check-effect-url-write.mjs', 'effect-url-write'],
]

let pass = 0, fail = 0
const failures = []

for (const [script, group] of SUITES) {
  const groupDir = resolve(CASES, group)
  if (!existsSync(groupDir)) continue
  const cases = readdirSync(groupDir).sort()
  for (const name of cases) {
    const dir = resolve(groupDir, name)
    const expectPass = name.startsWith('clean')
    let ok, output = ''
    try {
      output = execFileSync('node', [resolve(SCRIPTS, script), dir], { encoding: 'utf8', stdio: 'pipe' })
      ok = true
    } catch (e) {
      ok = false
      output = String((e.stdout || '') + (e.stderr || ''))
    }
    const good = ok === expectPass
    if (good) pass++
    else { fail++; failures.push({ script, name, expectPass, ok, output }) }
    console.log(`  ${good ? '✓' : '✗'} ${script.replace('.mjs', '').padEnd(26)} ${name.padEnd(30)} want ${expectPass ? 'pass' : 'fail'} · got ${ok ? 'pass' : 'fail'}`)
  }
}

console.log(`\n  ${pass} / ${pass + fail} cases passed`)
if (fail) {
  console.log('\n  Failure detail:')
  for (const f of failures) {
    console.log(`\n  ── ${f.script} · ${f.name}`)
    console.log(`     wanted ${f.expectPass ? 'pass' : 'fail'}, got ${f.ok ? 'pass' : 'fail'}`)
    console.log('     ' + f.output.trim().split('\n').slice(0, 4).join('\n     '))
  }
  process.exit(1)
}
