#!/usr/bin/env node
/* 源图标：lucide（ISC）—— **按需**把清单里点名的界面图标取进 `design/icons/lucide-sprite.svg`。
   不批量导入（整包上千个，绝大多数与产品无关）；只转 manifest 里已经登记、但源雪碧图里还没有的那些。

   用法：
     node vendor-lucide.mjs i-mail i-lock i-eye i-eye-off i-gift    # 按 manifest id 取
     node vendor-lucide.mjs mail lock                               # 也可按 lucide 的源名取，前提是 manifest 里有对应条目
     node vendor-lucide.mjs --dry i-mail                            # 只看会写入什么，不落盘
     node vendor-lucide.mjs --list                                  # 已收录的 lucide 图标（按 manifest 顺序）

   版本取自 `design/icons/lucide-sprite.svg` 文件头里登记的版本，**不另设常量**，避免两处漂移。
   产出：`design/icons/lucide-sprite.svg`（追加对应 symbol）；随后照常跑 `node scripts/build-icons.mjs`。
   格式与既有符号逐字一致：`<symbol id="i-…" viewBox="0 0 24 24" data-src="lucide:…">…</symbol>`，
   子节点保留上游原文，路径属性不动（描边 2 与配色由 `icon.less` 与 `Icon` 组件统一给）。 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const DESIGN = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'design')
process.chdir(DESIGN)

const SPRITE = 'icons/lucide-sprite.svg'
const source = readFileSync(SPRITE, 'utf8')
const versionMatch = source.match(/Lucide v(\d+\.\d+\.\d+)/)
if (!versionMatch) {
  console.error(`✗ ${SPRITE} 的文件头里找不到 lucide 版本号`)
  process.exit(1)
}
const VERSION = versionMatch[1]
const manifest = JSON.parse(readFileSync('icons/manifest.json', 'utf8'))

const args = process.argv.slice(2)
const dry = args.includes('--dry')
const wanted = args.filter((arg) => !arg.startsWith('--'))

if (args.includes('--list') || wanted.length === 0) {
  console.log(`  ${SPRITE} · lucide v${VERSION} · manifest 里已登记 ${manifest.filter((e) => e.lib === 'lucide').length} 个`)
  console.log('  ' + manifest.filter((e) => e.lib === 'lucide').map((e) => `${e.id}←${e.src}`).join(' '))
  if (wanted.length === 0 && !args.includes('--list')) {
    console.log('  用法：node vendor-lucide.mjs i-mail i-lock …（--dry 只预览，--list 看已收录）')
  }
  process.exit(0)
}

/* 参数既可以是 manifest id，也可以是 lucide 源名；两者都必须能在 manifest 里找到条目，
   否则不允许写入（避免出现「雪碧图里有、清单里没有」的孤儿符号）。 */
const entries = wanted.map((arg) => {
  const entry = arg.startsWith('i-')
    ? manifest.find((e) => e.id === arg)
    : manifest.find((e) => e.lib === 'lucide' && e.src === arg)
  if (!entry) throw new Error(`✗ ${arg} 不在 design/icons/manifest.json 里，先在清单里登记再取图`)
  if (entry.lib !== 'lucide') throw new Error(`✗ ${entry.id} 的来源不是 lucide（lib=${entry.lib}），本脚本不处理`)
  return entry
})

const existing = Object.fromEntries(
  (source.match(/<symbol[\s\S]*?<\/symbol>/g) || []).map((s) => [s.match(/id="([^"]+)"/)[1], s]),
)

const fetchIcon = (slug) => {
  const url = `https://unpkg.com/lucide-static@${VERSION}/icons/${slug}.svg`
  const raw = execFileSync('curl', ['-sL', url], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
  const svg = raw.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/)
  if (!svg) throw new Error(`✗ 取不到 ${slug}：${url} 没返回 svg`)
  const open = raw.match(/<svg\b[^>]*>/)[0]
  const viewBox = open.match(/viewBox="([^"]+)"/)?.[1]
  /* 图标体系按 24 网格缩放（见 architecture/10-icons.md §1），源图不是 24 网格就必须拦下，不许静默缩错 */
  if (viewBox !== '0 0 24 24') throw new Error(`✗ ${slug} 的 viewBox 是 ${viewBox}，不是 24 网格`)
  const children = svg[1].trim().replace(/>\s+</g, '> <')
  return { slug, children, line: `<symbol id="i-${slug}" viewBox="0 0 24 24" data-src="lucide:${slug}">${children}</symbol>` }
}

const fresh = entries.filter((e) => !existing[e.id])
const stale = entries.filter((e) => existing[e.id] && existing[e.id] !== `<symbol id="${e.id}"`)
for (const entry of entries) {
  if (existing[entry.id]?.includes(`data-src="lucide:${entry.src}"`)) {
    console.log(`  · ${entry.id} 已在雪碧图里（源名 ${entry.src}），跳过`)
  }
}

const added = []
for (const entry of fresh) {
  const icon = fetchIcon(entry.src)
  /* id 以 manifest 为准：源名与我们的 id 不一定同名（i-down ← chevron-down） */
  added.push(icon.line.replace(`id="i-${entry.src}"`, `id="${entry.id}"`))
  console.log(`  + ${entry.id} ← lucide:${entry.src}（${icon.children.length} 字符）`)
}

if (added.length === 0) {
  console.log('  没有需要写入的图标')
  process.exit(0)
}
/* 追加到文件末尾，保持既有符号原文不动；顺序按调用参数，重跑幂等 */
const next = `${source.replace(/\s*$/, '')}\n${added.join('\n')}\n`
if (dry) {
  console.log(`  --dry：会写入 ${added.length} 个符号，文件由 ${source.length} 变成 ${next.length} 字符`)
  process.exit(0)
}
writeFileSync(SPRITE, next)
console.log(`  ✓ ${SPRITE}：写入 ${added.length} 个符号（lucide v${VERSION}${stale.length ? ` · 注意有 ${stale.length} 个同名符号未覆盖` : ''}）`)
