#!/usr/bin/env node
/* 设计页检查器：折行 · 溢出 · 字重取值。
 *
 * 为什么单独一条命令：折行与溢出必须量**被绘制的元素**，要真浏览器，
 * 因此不进静态的 `pnpm check`（那条必须无浏览器依赖），单独走 `pnpm check:design`。
 * 三个判据：
 *   1. 溢出：元素的 scrollWidth 超过 clientWidth。任何元素都不允许横向溢出；
 *      `.code-block` 例外，它按设计要横向滚动（overflow-x: auto，scrollWidth 必然大于 clientWidth）。
 *   2. 折行：**应当单行**的元素（下面 ONE_LINE 列出）内部文字换行即判缺陷。
 *      这一条来自真实事故：元信息列写死 48px，「12.5 / 430」折成两行把整行撑高。
 *   3. 字重：`font-weight` 只允许 400 · 430 · 500 · 600 · 700。「550」「650」这类中间值
 *      在只有 400 与 700 的字体上会直接跳到 Bold，是已废弃的写法（见 design/typography.md 第 10 节）。
 */
import { createServer } from 'node:http'
import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'

const ROOT = resolve(process.argv[2] ?? 'design')
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}
/* 应当单行的元素：这些选择器命中的元素里出现换行即缺陷。
   注意 `.src` 不在名单里：它是概述句，英文比中文长，窄窗下必须换行，属正常。 */
const ONE_LINE = ['.meta', '.cap', '.tag', 'button', '.numcol .v', '.mono', '.mono-cjk', '.langbar button']
/* 有意保留汉字的元素：切到英文视图后，这些元素以外出现汉字即判「文案没进语言包」。
   逐项说明：.langbar 是语言切换按钮（按钮名用各语言自己的写法）；.glyphs 是字形比对样本（直骨今）；
   .mono-cjk 是中日韩等宽样本（含中文路径）；.mix 是中西文混排与引号对照（对照本身要显示汉字）；
   .sub:has(code) 是含样本字的说明（例如「下面是直骨今三语并排」）。 */
const CJK_BY_DESIGN = ['.langbar', '.glyphs', '.mono-cjk', '.mix', '.sub:has(code)']
/* 字重允许集合：中间值在静态字体上会跳档 */
const ALLOWED_WEIGHTS = new Set(['400', '430', '500', '600', '700'])
/* 例外：按设计要横向滚动 */
const OVERFLOW_EXEMPT = new Set(['code-block', 'code-block--cjk'])
/* 遗留页：仍在 token 检查器的 LEGACY 名单里，旧写法尚未整治，检查时跳过。
   整治完成一页就从中移出一页，移空之后删除这份名单。 */
const LEGACY = new Set(['color-card.html', 'foundations.html', 'icons.html', 'mock.html'])

if (!existsSync(ROOT)) {
  console.log('✗ nothing to check — design directory not found: ' + ROOT)
  process.exit(1)
}

const files = (await readdir(ROOT)).filter((f) => f.endsWith('.html') && !LEGACY.has(f)).sort()
if (!files.length) {
  console.log('✗ nothing to check — no design/*.html')
  process.exit(1)
}

/* 自带静态服务：不依赖本地已启动的 8080，CI 也能跑 */
const server = createServer(async (req, res) => {
  const path = join(ROOT, decodeURIComponent((req.url ?? '/').split('?')[0]))
  try {
    const body = await readFile(path)
    res.writeHead(200, { 'content-type': MIME[extname(path)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404).end('not found')
  }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`

const { chromium } = await import('@playwright/test')
const browser = await chromium.launch({ channel: 'chrome' })
const problems = []

for (const file of files) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } })
  await page.goto(`${base}/${file}`, { waitUntil: 'networkidle' })
  /* 切到英文视图：下面用「正文里是否残留汉字」判「文案有没有进语言包」。
     两次「页面文案没进语言包」都是人眼发现的，这条把它变成机器判据。
     有意保留汉字的元素列在 CJK_BY_DESIGN 里，其余元素出现汉字即判缺陷。 */
  const hasLangButtons = await page.locator('.langbar button[data-lang]').count()
  if (hasLangButtons) {
    await page.click('.langbar button[data-lang="en"]')
    const leftover = await page.evaluate((exempt) => {
      const out = []
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const node = walker.currentNode
        /* 脚本与样式里的汉字是注释，不是展示内容 */
        if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.parentElement.tagName)) continue
        if (!/[\u3400-\u9fff\uf900-\ufaff]/.test(node.nodeValue)) continue
        let el = node.parentElement
        let skip = false
        while (el) {
          if (exempt.some((sel) => { try { return el.matches(sel) } catch { return false } })) { skip = true; break }
          el = el.parentElement
        }
        if (!skip) out.push(`${node.parentElement.className || node.parentElement.tagName}「${node.nodeValue.trim().slice(0, 20)}」`)
      }
      return out
    }, CJK_BY_DESIGN)
    for (const item of [...new Set(leftover)]) problems.push(`${file} 英文视图仍残留汉字：${item}`)
  }
  /* 页面标注的「字号 / 字重」必须与该元素的计算值一致。
     排版页第一节每一行右侧标着「20 / 650」这类取值，字重由 650 改为 600 之后标注没跟上，
     被用户看出「语义档位也不对」。这条把它变成机器判据：两列 meta、右侧形如「12.5 / 430」的行参与比对，
     只看第一列 meta（左侧是档位名）、右侧是取值的行。 */
  const labeled = await page.evaluate(() => {
    const out = []
    for (const row of document.querySelectorAll('.row')) {
      const metas = [...row.querySelectorAll(':scope > .meta')]
      const sample = [...row.children].find((c) => !c.classList.contains('meta'))
      if (!sample || metas.length < 2) continue
      const declared = metas[1].textContent.replace(/\s/g, '')
      const m = declared.match(/^([\d.]+)\/(\d+)$/)
      if (!m) continue
      const cs = getComputedStyle(sample)
      const actual = `${parseFloat(cs.fontSize)}/${cs.fontWeight}`
      if (`${m[1]}/${m[2]}` !== actual) out.push(`标注「${declared}」与实际「${actual}」不一致（${sample.className}）`)
    }
    return out
  })
  for (const item of [...new Set(labeled)]) problems.push(`${file} ${item}`)

  for (const width of [1100, 900, 760]) {
    await page.setViewportSize({ width, height: 900 })
    const found = await page.evaluate(
      ({ oneLine, allowed, exempt }) => {
        const out = { overflow: [], wrapped: [], weight: [] }
        const lineCount = (el) => {
          const range = document.createRange()
          range.selectNodeContents(el)
          return range.getClientRects().length
        }
        for (const el of document.querySelectorAll('*')) {
          if (!el.textContent.trim()) continue
          const cls = typeof el.className === 'string' ? el.className : ''
          if (el.scrollWidth > el.clientWidth + 1 && !exempt.includes(cls)) {
            out.overflow.push(`${cls || el.tagName} 溢出 ${el.scrollWidth - el.clientWidth}px`)
          }
          if (!el.children.length && oneLine.some((sel) => el.matches(sel)) && lineCount(el) > 1) {
            out.wrapped.push(`${cls || el.tagName}「${el.textContent.trim().slice(0, 18)}」折行`)
          }
        }
        for (const el of document.querySelectorAll('*')) {
          const w = getComputedStyle(el).fontWeight
          if (!allowed.includes(w)) out.weight.push(`${typeof el.className === 'string' ? el.className || el.tagName : el.tagName} font-weight:${w}`)
        }
        return out
      },
      { oneLine: ONE_LINE, allowed: [...ALLOWED_WEIGHTS], exempt: [...OVERFLOW_EXEMPT] },
    )
    for (const kind of ['overflow', 'wrapped', 'weight']) {
      for (const item of [...new Set(found[kind])]) problems.push(`${file} 宽${width} ${kind}：${item}`)
    }
  }
  await page.close()
}
await browser.close()
server.close()

if (problems.length) {
  console.log(`✗ design pages have ${problems.length} problem(s):`)
  for (const p of problems.slice(0, 30)) console.log('    ' + p)
  if (problems.length > 30) console.log(`    … 其余 ${problems.length - 30} 条省略`)
  process.exit(1)
}
console.log(
  `✓ design pages: ${files.length} page(s) × 3 widths — no overflow, no bad wrap, no out-of-range font-weight, ` +
    `and no CJK left over in the english view`,
)
