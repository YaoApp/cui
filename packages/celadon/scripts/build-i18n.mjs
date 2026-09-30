#!/usr/bin/env node
/**
 * build-i18n.mjs — 把 i18n/*.json 打包成浏览器可直接引用的 bundle
 * 为什么不用 fetch：mock 是 file:// 打开的，fetch 会被 CORS 拦；bundle.js 用 script 标签即可。
 * 用法：node packages/celadon/design/build-i18n.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/* 本脚本住在 scripts/，目标资产在 ../design/ —— 统一切到那里作为工作目录，
   这样下面所有相对路径（icons/… · *.html · tokens.less · i18n/…）都继续成立，
   并且从任何目录调用都不会出错。 */
const DESIGN = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'design')
process.chdir(DESIGN)


const here = DESIGN
const dir = resolve(here, 'i18n')
const out = resolve(dir, 'bundle.js')

const files = readdirSync(dir).filter(f => f.endsWith('.json')).sort()
const bundle = {}
for (const f of files) {
  const lang = f.replace(/\.json$/, '')
  bundle[lang] = JSON.parse(readFileSync(resolve(dir, f), 'utf8'))
}
writeFileSync(out, '/* 自动生成，勿手改 —— 源：i18n/*.json（node packages/celadon/design/build-i18n.mjs） */\n'
  + 'window.CELADON_I18N = ' + JSON.stringify(bundle, null, 2) + ';\n')
console.log('✓ 生成 i18n/bundle.js （' + files.join(' · ') + '）')
