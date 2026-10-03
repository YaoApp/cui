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
const src = resolve(pkg, 'app/src')
const outDir = resolve(pkg, process.env.CELADON_OUT_DIR ?? 'dist', 'locales')

/** 语言包所在的三处目录（与 `platform/i18n/i18n.ts` 的 glob 一致）。 */
function localeFiles() {
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
const merged = new Map()
for (const file of localeFiles()) {
  const locale = file.replace(/\.json$/, '').split(/[\\/]/).pop()
  const current = merged.get(locale) ?? {}
  merged.set(locale, { ...current, ...JSON.parse(readFileSync(file, 'utf8')) })
}

mkdirSync(outDir, { recursive: true })
const locales = [...merged.keys()].sort()
for (const locale of locales) {
  writeFileSync(resolve(outDir, `${locale}.json`), JSON.stringify(merged.get(locale), null, 2) + '\n')
}
writeFileSync(
  resolve(outDir, 'index.json'),
  JSON.stringify({ locales, generated_from: 'app/src/**/locales/*.json' }, null, 2) + '\n',
)
console.log(`✓ locales: ${locales.join(' · ')} → ${outDir}`)
