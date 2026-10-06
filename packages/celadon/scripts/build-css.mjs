#!/usr/bin/env node
/**
 * build-css.mjs — 生成设计产物与应用主题
 *
 * 用途：设计规范页与应用主题从「同一份 token」派生，产物不许手改。
 * 落盘（两处内容不同，都从 token 定义派生）：
 *   design/tokens.css                     设计规范页消费 = token 定义 + 各组件的设计类
 *   app/src/platform/theme/tokens.css     应用消费入口（平台层）= 只有 token 定义
 * 应用侧的组件样式由组件自己 import 各自的 less（打包器内联），不重复落进主题文件。
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
const componentsFile = resolve(ROOT, 'design', 'components.less')
/* 两份产物的顺序即比对清单的顺序（见 check-generated.mjs）。 */
const designFile = resolve(ROOT, 'design', 'tokens.css')
const themeFile = resolve(ROOT, 'app', 'src', 'platform', 'theme', 'tokens.css')

if (!existsSync(lessFile)) { console.error('missing tokens.less:', lessFile); process.exit(1) }
if (!existsSync(componentsFile)) { console.error('missing components.less:', componentsFile); process.exit(1) }
/* **内容不变就不落盘** —— 否则每次生成都刷新 mtime，而拟人层用 mtime 判"产物是否比源码旧"：
   `pnpm check` 之后紧接着单跑 `pnpm test:persona` 会得到假失败（2026-10-03 复核者复现过）。 */
function writeIfChanged(file, content) {
  if (existsSync(file) && readFileSync(file, 'utf8') === content) return false
  writeFileSync(file, content)
  return true
}


/* 两路产物同源：定义来自 tokens.less，设计页另加 components.less 里的组件设计类。 */
let render
try {
  const less = (await import('less')).default
  render = async (file) => (await less.render(readFileSync(file, 'utf8'), { filename: file })).css
} catch {
  // 退回 lessc 二进制
  const roots = [
    PACKAGE,
    resolve(PACKAGE, '..', '..'),
    resolve(PACKAGE, '..', '..', '..'),
  ]
  const bin = roots.map(r => resolve(r, 'node_modules/.pnpm/node_modules/.bin/lessc')).find(existsSync)
  if (!bin) { console.error('neither the less module nor a lessc binary is available'); process.exit(1) }
  render = async (file) => execFileSync(bin, [file], { encoding: 'utf8' })
}

const definitions = await render(lessFile)
const componentClasses = await render(componentsFile)

const HEADER = '/* generated — do not edit by hand; source: design/tokens.less'
  + ' (design bundle also design/components.less) · node scripts/build-css.mjs */'
const targets = [
  { file: designFile, body: `${HEADER}\n${definitions}\n${componentClasses}` },
  { file: themeFile, body: `${HEADER}\n${definitions}` },
]
for (const { file, body } of targets) {
  mkdirSync(dirname(file), { recursive: true })
  writeIfChanged(file, body)
  console.log('✓ wrote', file.replace(PACKAGE + '/', ''), `(${body.split('\n').length} lines)`)
}
