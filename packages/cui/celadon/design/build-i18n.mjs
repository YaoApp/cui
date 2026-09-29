#!/usr/bin/env node
/**
 * build-i18n.mjs — 把 i18n/*.json 打包成浏览器可直接引用的 bundle
 * 为什么不用 fetch：mock 是 file:// 打开的，fetch 会被 CORS 拦；bundle.js 用 script 标签即可。
 * 用法：node celadon/design/build-i18n.mjs   （或 pnpm design:i18n）
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dir = resolve(here, 'i18n')
const out = resolve(dir, 'bundle.js')

const files = readdirSync(dir).filter(f => f.endsWith('.json')).sort()
const bundle = {}
for (const f of files) {
  const lang = f.replace(/\.json$/, '')
  bundle[lang] = JSON.parse(readFileSync(resolve(dir, f), 'utf8'))
}
writeFileSync(out, '/* 自动生成，勿手改 —— 源：i18n/*.json（node celadon/design/build-i18n.mjs） */\n'
  + 'window.CELADON_I18N = ' + JSON.stringify(bundle, null, 2) + ';\n')
console.log('✓ 生成 i18n/bundle.js （' + files.join(' · ') + '）')
