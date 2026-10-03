#!/usr/bin/env node
/**
 * build-css.mjs — 从 design/tokens.less 生成两份内容相同的 tokens.css
 *
 * 用途：设计规范页与应用主题从「同一份 token」派生，产物不许手改。
 * 落盘（一次生成、两处写相同内容）：
 *   design/tokens.css                     设计规范页消费
 *   app/src/platform/theme/tokens.css     应用消费入口（平台层）
 *
 * 用法：node scripts/build-css.mjs             （写包内两处产物）
 *       node scripts/build-css.mjs <root>      （测试用：把 <root> 当包根，写 <root>/design 与 <root>/app/src/platform/theme）
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

/* 本脚本住在 scripts/；包根 = 脚本的上一级。<root> 参数只是让检查器的样本
   能在临时目录里跑同一段生成逻辑，默认仍写真实包。 */
const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ROOT = process.argv[2] ? resolve(process.argv[2]) : PACKAGE

const lessFile = resolve(ROOT, 'design', 'tokens.less')
/* 两份产物的顺序即比对清单的顺序（见 check-generated.mjs）。 */
const outputs = [
  resolve(ROOT, 'design', 'tokens.css'),
  resolve(ROOT, 'app', 'src', 'platform', 'theme', 'tokens.css'),
]

if (!existsSync(lessFile)) { console.error('missing tokens.less:', lessFile); process.exit(1) }
/* **内容不变就不落盘** —— 否则每次生成都刷新 mtime，而拟人层用 mtime 判"产物是否比源码旧"：
   `pnpm check` 之后紧接着单跑 `pnpm test:persona` 会得到假失败（2026-10-03 复核者复现过）。 */
function writeIfChanged(file, content) {
  if (existsSync(file) && readFileSync(file, 'utf8') === content) return false
  writeFileSync(file, content)
  return true
}


let css
try {
  const less = (await import('less')).default
  css = (await less.render(readFileSync(lessFile, 'utf8'), { filename: lessFile })).css
} catch {
  // 退回 lessc 二进制
  const roots = [
    PACKAGE,
    resolve(PACKAGE, '..', '..'),
    resolve(PACKAGE, '..', '..', '..'),
  ]
  const bin = roots.map(r => resolve(r, 'node_modules/.pnpm/node_modules/.bin/lessc')).find(existsSync)
  if (!bin) { console.error('neither the less module nor a lessc binary is available'); process.exit(1) }
  css = execFileSync(bin, [lessFile], { encoding: 'utf8' })
}

/* 两份产物写同样内容、同样的生成头 —— 一次生成、两处落盘。 */
const HEADER = '/* generated — do not edit by hand; source: design/tokens.less (node scripts/build-css.mjs) */'
const body = `${HEADER}\n${css}`
for (const file of outputs) {
  mkdirSync(dirname(file), { recursive: true })
  writeIfChanged(file, body)
  console.log('✓ wrote', file.replace(PACKAGE + '/', ''), `(${css.split('\n').length} lines)`)
}
