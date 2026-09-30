#!/usr/bin/env node
/**
 * build-css.mjs — 从 tokens.less 生成 tokens.css
 * 用途：色卡（color-card.html）与后续 AntD 主题都从「同一份 token」派生，避免两份来源。
 * 用法：node packages/design/build-css.mjs   （在仓库根或任意目录均可）
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

/* 本脚本住在 scripts/，目标资产在 ../design/ —— 统一切到那里作为工作目录，
   这样下面所有相对路径（icons/… · *.html · tokens.less · i18n/…）都继续成立，
   并且从任何目录调用都不会出错。 */
const DESIGN = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'design')
process.chdir(DESIGN)


const here = DESIGN
const lessFile = resolve(here, 'tokens.less')
const cssFile = resolve(here, 'tokens.css')

if (!existsSync(lessFile)) { console.error('缺少 tokens.less:', lessFile); process.exit(1) }

let css
try {
  const less = (await import('less')).default
  css = (await less.render(readFileSync(lessFile, 'utf8'), { filename: lessFile })).css
} catch {
  // 退回 lessc 二进制
  const roots = [resolve(here, '../../..'), resolve(here, '../../../..')]
  const bin = roots.map(r => resolve(r, 'node_modules/.pnpm/node_modules/.bin/lessc')).find(existsSync)
  if (!bin) { console.error('既无 less 模块也无 lessc 二进制'); process.exit(1) }
  css = execFileSync(bin, [lessFile], { encoding: 'utf8' })
}

writeFileSync(cssFile, `/* 自动生成，勿手改 —— 源：tokens.less（node design/build-css.mjs） */\n${css}`)
console.log('✓ 生成', cssFile.replace(process.cwd() + '/', ''), `(${css.split('\n').length} 行)`)
