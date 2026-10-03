/* 把应用的语言包**另出一份给宿主读**（`dist/locales/<locale>.json` + `index.json`）。
 *
 * 为什么需要：前端的语言包被 `import.meta.glob(…, { eager: true })` 编进了 JS —— 宿主（桌面壳）
 * 拿不到，而宿主若有原生界面文案（菜单等）需要同一份翻译。**一份源，两个消费者**：
 *   · 源：`app/src/locales/*.json` · `app/src/features/<unit>/locales/<locale>.json` · `app/src/components/<unit>/locales/<locale>.json`
 *   · 出口一：前端（Vite 打包进 JS）
 *   · 出口二：宿主（本脚本，按语言合并成静态 JSON）
 *
 * `index.json` 是**语言清单**（由目录得出）—— 宿主据此知道有哪些语言，**不自己维护数组**
 * （见 architecture/08-i18n.md「语言集只有一个来源」）。
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** 应用支持的语言 = **语言包目录**（唯一来源，见 08-i18n.md）。给清单与构建脚本共用。 */
export function scanLocales() {
  const found = new Set()
  for (const file of localeFiles()) {
    const locale = file.replace(/\.json$/, '').split(/[\\/]/).pop()
    if (locale) found.add(locale)
  }
  return [...found].sort()
}
const src = resolve(pkg, 'app/src')

/** 语言包所在的三处目录（与 `platform/i18n/i18n.ts` 的 glob 一致）。 */
export function localeFiles() {
  const found = []
  const push = (dir) => {
    if (!existsSync(dir)) return
    for (const name of readdirSync(dir)) {
      if (name.endsWith('.json')) found.push(join(dir, name))
    }
  }
  push(resolve(src, 'locales'))
  for (const area of ['features', 'components']) {
    const root = resolve(src, area)
    if (!existsSync(root)) continue
    for (const unit of readdirSync(root)) push(resolve(root, unit, 'locales'))
  }
  return found
}

/** 按语言合并：后读到的覆盖先读到的（同名键以更深处的域为准，与前端一致）。 */

// 被 import（给别的脚本用）时不写文件；直接执行才产出
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outDir = resolve(pkg, process.env.CELADON_OUT_DIR ?? 'dist', 'locales')
  mkdirSync(outDir, { recursive: true })
  const locales = scanLocales()
  for (const locale of locales) {
    const merged = {}
    for (const file of localeFiles()) {
      const name = file.replace(/\.json$/, '').split(/[\\/]/).pop()
      if (name === locale) Object.assign(merged, JSON.parse(readFileSync(file, 'utf8')))
    }
    writeFileSync(resolve(outDir, `${locale}.json`), JSON.stringify(merged, null, 2) + '\n')
  }
  writeFileSync(resolve(outDir, 'index.json'), JSON.stringify({ locales, generated_from: 'app/src/**/locales/*.json' }, null, 2) + '\n')
  console.log(`✓ locales: ${locales.join(' · ')} → ${outDir}`)
}
