#!/usr/bin/env node
/**
 * verify-files.mjs — `pnpm verify:files <文件…>`：内圈第一段。
 *
 * 只针对改动文件跑：
 *   · eslint：改动的 .js / .mjs / .cjs（TS 由 tsc 负责）
 *   · stylelint：改动的 app 侧 .less
 *   · tsc --noEmit：整程序类型图，无法按文件切，跑全量（带增量缓存）
 *   · 检查器：文件级的只报改动文件，跨文件的四只整条跑
 *
 * 全部跑完再汇总，任一失败以非 0 退出。目标：一条命令不超过 10 秒。
 */
import { spawnSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { PACKAGE, checkersFor } from './lib/targets.mjs'

const inputs = process.argv.slice(2)
if (!inputs.length) {
  console.error('用法: pnpm verify:files <文件…>')
  process.exit(2)
}

const files = inputs.map((input) => resolve(process.cwd(), input)).filter((file) => existsSync(file) && statSync(file).isFile())
if (!files.length) {
  console.error('verify:files: 没有可用的文件')
  process.exit(2)
}

const rel = (file) => relative(PACKAGE, file)
const steps = []

const scriptFiles = files.filter((file) => /\.(js|mjs|cjs)$/.test(file))
if (scriptFiles.length) steps.push({ name: 'eslint', args: ['exec', 'eslint', ...scriptFiles.map(rel)] })

const styleFiles = files.filter((file) => file.endsWith('.less') && file.includes('/app/src/'))
if (styleFiles.length) steps.push({ name: 'stylelint', args: ['exec', 'stylelint', ...styleFiles.map(rel)] })

steps.push({ name: 'tsc', args: ['exec', 'tsc', '--noEmit'] })

for (const { script, scope, files: picked } of checkersFor(files)) {
  if (scope === 'files') {
    if (picked.length) steps.push({ name: script, args: [join(PACKAGE, 'scripts', script), ...picked.map((file) => join(PACKAGE, file))], node: true })
    continue
  }
  steps.push({ name: script, args: [join(PACKAGE, 'scripts', script)], node: true })
}

const started = Date.now()
const failed = []
for (const step of steps) {
  const cmd = step.node ? process.execPath : 'pnpm'
  process.stdout.write(`\n▸ ${step.name}\n`)
  const result = spawnSync(cmd, step.args, { cwd: PACKAGE, stdio: 'inherit' })
  if (result.status !== 0) failed.push(step.name)
}
const seconds = ((Date.now() - started) / 1000).toFixed(1)

if (failed.length) {
  console.log(`\nverify:files ✗ ${failed.length}/${steps.length} 步失败（${seconds}s）：${failed.join(' · ')}`)
  process.exit(1)
}
console.log(`\nverify:files ✓ ${steps.length} 步通过（${seconds}s，${files.length} 个改动文件）`)
