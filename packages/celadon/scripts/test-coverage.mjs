#!/usr/bin/env node
/**
 * test-coverage.mjs — `pnpm test:coverage <文件…>`：跑覆盖率并核改动文件的门槛。
 *
 * 规则（迭代规矩第三块）：改动文件的行与分支覆盖率不低于九成；
 * 桶文件（index.ts）· 纯类型（*.d.ts）· main.tsx 豁免；全量覆盖率只作趋势记录。
 * 只跑与改动文件相关的单元用例；找不到相关用例时跑全量。
 *
 * 覆盖率用 v8 提供者的 json-summary 报告读，报告目录默认 coverage/。
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { APP_SRC, PACKAGE, relatedUnitTests } from './lib/targets.mjs'

const THRESHOLD = 90

const inputs = process.argv.slice(2)
if (!inputs.length) {
  console.error('用法: pnpm test:coverage <文件…>')
  process.exit(2)
}

const files = inputs.map((input) => resolve(process.cwd(), input)).filter((file) => existsSync(file) && statSync(file).isFile())
if (!files.length) {
  console.error('[test:coverage] 给的文件都不存在：' + inputs.join(' · '))
  process.exit(2)
}

const inApp = files.filter((file) => file === APP_SRC || file.startsWith(APP_SRC + '/')).filter((file) => /\.(ts|tsx)$/.test(file))
if (!inApp.length) {
  console.log('[test:coverage] 改动文件不是 app/src 的 TS / TSX 代码，v8 覆盖率不覆盖它们。')
  process.exit(0)
}

/* 豁免与 vitest.config.ts 的 coverage.exclude 对齐：不在覆盖率报告里的文件不能拿来卡门槛。 */
const EXEMPT = [
  /\/tests\//,          // vitest coverage.exclude
  /\/test-support\//,   // vitest coverage.exclude
  /\.d\.ts$/,           // 纯类型
  /\/index\.ts$/,       // 桶文件
  /\/main\.tsx$/,       // 入口
]
const exempt = (file) => EXEMPT.some((pattern) => pattern.test(file))
const checked = inApp.filter((file) => !exempt(file))
if (!checked.length) {
  console.log('[test:coverage] 没有需要核覆盖率的改动文件（tests / test-support / 桶文件 / 纯类型 / main.tsx 豁免）。')
  process.exit(0)
}

const tests = relatedUnitTests(checked)
const testArgs = tests.length ? tests.map((test) => relative(PACKAGE, test)) : []
const includeArgs = checked.map((file) => `--coverage.include=${relative(PACKAGE, file)}`)

const runner = resolve(PACKAGE, 'scripts', 'run-logged.mjs')
const result = spawnSync(
  process.execPath,
  [runner, 'coverage-files', 'vitest', 'run', '--coverage', '--coverage.reporter=json-summary', '--coverage.reporter=text', ...includeArgs, ...testArgs],
  { stdio: 'inherit', cwd: PACKAGE },
)
if (result.status !== 0) process.exit(result.status ?? 1)

const summaryPath = join(PACKAGE, 'coverage', 'coverage-summary.json')
if (!existsSync(summaryPath)) {
  console.log(`✗ 没有找到覆盖率报告（${relative(PACKAGE, summaryPath)}）—— 覆盖率跑失败还是没生成 json-summary？`)
  process.exit(1)
}
const summary = JSON.parse(readFileSync(summaryPath, 'utf8'))

const failures = []
for (const file of checked) {
  const entry = summary[file]
  if (!entry) {
    failures.push(`${relative(PACKAGE, file)} 没有出现在覆盖率报告里（没被执行到？）`)
    continue
  }
  const { lines, branches } = entry
  const ok = lines.pct >= THRESHOLD && branches.pct >= THRESHOLD
  console.log(`  ${ok ? '·' : '✗'} ${relative(PACKAGE, file)}  行 ${lines.pct}% · 分支 ${branches.pct}%`)
  if (!ok) failures.push(`${relative(PACKAGE, file)} 行 ${lines.pct}% / 分支 ${branches.pct}%，要求都不低于 ${THRESHOLD}%`)
}

if (failures.length) {
  console.log(`\n✗ 覆盖率门槛未过（${failures.length} 个文件）：`)
  failures.forEach((line) => console.log('  ' + line))
  process.exit(1)
}
console.log(`\n✓ ${checked.length} 个改动文件的行与分支覆盖率都不低于 ${THRESHOLD}%`)
