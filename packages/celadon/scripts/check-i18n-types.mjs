#!/usr/bin/env node
/**
 * check-i18n-types.mjs — 生成物一致性：`i18n-types.d.ts` 是否跟得上基准语言包
 * 用法：node scripts/check-i18n-types.mjs [目标根目录]   （默认本包根）
 *
 * 与 `check-generated.mjs` 同一模式：**重新生成一遍，再和仓库里的产物比对**。
 * 产物由 `build-i18n-types.mjs` 从基准语言 zh-CN 的三处语言包生成（见 architecture/08-i18n.md §5）。
 * 不一致（改了语言包忘了重跑 `pnpm build:i18n`，或手改了产物）→ 退出码 1。
 *
 * 为什么单独一个检查器、不并进 `check-generated.mjs`：那个检查器会真的重写 `design/` 下的产物、
 * 只认固定目录，喂不了"临时目标目录"的样本；这里要按 `check-i18n.mjs` 的样子支持目标目录，
 * 才能进 `scripts/tests/run.mjs` 的正例 / 违规例。
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BASE, buildTypes, typesPath } from './build-i18n-types.mjs'

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TARGET = resolve(process.argv[2] || PACKAGE)

let generated
try {
  generated = buildTypes(TARGET)
} catch (error) {
  console.log(`✗ ${error.message}`)
  process.exit(1)
}

const out = typesPath(TARGET)
if (!existsSync(out)) {
  console.log(`  ✗ generated i18n types are missing: ${relative(TARGET, out)} — run pnpm build:i18n and commit the output`)
  process.exit(1)
}

const committed = readFileSync(out, 'utf8')
if (committed !== generated.content) {
  console.log(`  ✗ generated i18n types are stale: ${relative(TARGET, out)} — run pnpm build:i18n and commit the output`)
  process.exit(1)
}

console.log(`  ✓ i18n types match the baseline ${BASE} pack (${generated.keys.length} key(s))`)
