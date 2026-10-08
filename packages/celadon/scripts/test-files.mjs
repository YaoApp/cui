#!/usr/bin/env node
/**
 * test-files.mjs — `pnpm test:files <文件…>`：内圈第二段，只跑与改动文件相关的单元用例。
 *
 * 找不到相关用例时改跑全量单测，避免「一个用例都没选中」被当成通过。
 * 命令走 run-logged，保留日志与步骤超时。
 */
import { spawnSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { APP_SRC, PACKAGE, relatedUnitTests } from './lib/targets.mjs'

const inputs = process.argv.slice(2)
if (!inputs.length) {
  console.error('用法: pnpm test:files <文件…>')
  process.exit(2)
}

const files = inputs.map((input) => resolve(process.cwd(), input)).filter((file) => existsSync(file) && statSync(file).isFile())
if (!files.length) {
  console.error('[test:files] 给的文件都不存在：' + inputs.join(' · '))
  process.exit(2)
}
const inApp = files
  .filter((file) => file === APP_SRC || file.startsWith(APP_SRC + '/'))
  .filter((file) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file))
if (!inApp.length) {
  console.log('[test:files] 改动文件不是 app/src 的代码（样式、资产等），没有相关单元用例。')
  process.exit(0)
}

const tests = relatedUnitTests(inApp)
const args = tests.map((test) => relative(PACKAGE, test))
/* 有改动文件一个相关用例都没选到（例如只被 barrel 间接引用），就不能只看选中的那些：改跑全量。 */
const orphans = inApp.filter((file) => !/\.test\./.test(file) && relatedUnitTests([file]).length === 0)
if (tests.length && !orphans.length) {
  console.log(`[test:files] 相关单元用例 ${tests.length} 个：\n  ${args.join('\n  ')}`)
} else if (orphans.length) {
  console.log(`[test:files] 有 ${orphans.length} 个改动文件选不到相关用例（${orphans.map((f) => relative(PACKAGE, f)).join(' · ')}），改跑全量单测。`)
  args.length = 0
} else {
  console.log('[test:files] 没有找到相关单元用例，改跑全量单测。')
}

const runner = resolve(PACKAGE, 'scripts', 'run-logged.mjs')
const result = spawnSync(process.execPath, [runner, 'unit-files', 'vitest', 'run', ...args], { stdio: 'inherit', cwd: PACKAGE })
process.exit(result.status ?? 1)
