#!/usr/bin/env node
/* 拟人测试的采集脚本 —— 只做机器能做的部分：开真浏览器、按剧本走一遍、截图、报客观测量。
   判定（看图 · OCR · 决策模型 · 是否转人）不在这里，写在同目录的 <场景>.agent.md 里。

   为什么住这里：拟人测试只属于 feature，剧本与它的采集脚本都放在该 feature 的 tests/ 下。
   后缀即分工 —— *.test.ts(x) 给 vitest · *.browser.ts 给 Playwright · *.agent.mjs 给 pnpm test:persona。
   命名按场景：一个场景一份剧本（*.agent.md）与一份采集脚本（*.agent.mjs）。

   截图一律走固化的截图资产 scripts/shots.mjs，落在 app/logs/<日期>/shots/<场景>/（git 忽略）。
   用法：pnpm test:persona（会跑 tests/ 下所有 *.agent.mjs）*/
import { chromium } from '@playwright/test'   // 直接依赖；playwright-core 是它的传递依赖，解析不到
import { readdirSync, statSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { capturePage, captureScreen, shotDir } from '../../../../../../scripts/shots.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const PACKAGE = resolve(HERE, '../../../../../..')
const BASE_URL = process.env.CUI_BASE_URL ?? 'http://localhost:5200'

// 截图一律走固化的截图资产（scripts/shots.mjs），不在这里自己调 page.screenshot。
const SCENARIO = basename(fileURLToPath(import.meta.url)).replace('.agent.mjs', '')
const SHOTS = shotDir(SCENARIO)

const problems = []
const say = (s) => console.log(s)

// 拟人层测的是**构建产物**，不是 dev 源码。产物比源码旧就说明在测过期的东西 —— 明确失败，别假绿。
function newestMtime(dir) {
  let newest = 0
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue
    // 只算**影响构建**的文件：测试、剧本、采集脚本、测试支持都不进产物，
    // 编辑它们不该被判成"产物过期"。
    if (e.name === 'tests' || e.name === 'test-support') continue
    if (/\.(test|spec|browser|agent)\.(?:[cm]?[jt]sx?|md)$/.test(e.name)) continue
    const full = join(dir, e.name)
    if (e.isDirectory()) newest = Math.max(newest, newestMtime(full))
    else newest = Math.max(newest, statSync(full).mtimeMs)
  }
  return newest
}
{
  const distIndex = join(PACKAGE, 'dist', 'index.html')
  let built = 0
  try {
    built = statSync(distIndex).mtimeMs
  } catch (e) {
    // 只把"文件不存在"当缺失；其它错误（比如我把 statSync 忘了 import）必须原样报出来，
    // 否则会得到一个听起来合理、其实是假的诊断。
    if (e.code === 'ENOENT') problems.push('dist 不存在 —— 拟人层测构建产物，先 pnpm build')
    else throw e
  }
  if (built) {
    const newestSource = Math.max(newestMtime(join(PACKAGE, 'app', 'src')), newestMtime(join(PACKAGE, 'design')))
    if (newestSource > built) problems.push('dist 比源码旧 —— 先 pnpm build 再跑拟人，否则测的是过期产物')
  }
}
const box = async (l) => { const b = await l.boundingBox(); return b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } : null }
const shot = (page, name) => capturePage(page, join(SHOTS, name))

// 系统级整屏：只有 macOS 实现了；其它平台不假装成功，记一句就继续。
// CUI_HEADED=1 时开真窗口，这一屏才包含浏览器；否则它只是"机器当时的一屏"。
const headed = process.env.CUI_HEADED === '1'
try {
  const r = captureScreen(join(SHOTS, 'screen.jpg'), { format: 'jpg' })
  say(`screen       : ${r.platform} · ${r.region} · ${r.format}${headed ? '' : '（headless，画面里没有浏览器）'}`)
} catch (e) {
  say(`screen       : skipped — ${e.message}`)
}

const b = await chromium.launch({ channel: 'chrome', headless: !headed })
// 浏览器环境显式钉住：语言固定基准 zh-CN，配色固定浅色 —— 两者都跟随系统，
// 不钉的话剧本断言的界面文案与观感会因跑测机器而异（见 architecture/14-testing.md §1）
const p = await b.newPage({ viewport: { width: 760, height: 300 }, deviceScaleFactor: 2, locale: 'zh-CN', colorScheme: 'light' })
p.on('response', (r) => { if (r.status() >= 400) problems.push(`${r.status()} ${r.url()}`) })
p.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))

const trial = p.locator('.foo-bar')
// 页面上不止一个按钮，按可访问名取 —— 只用 button.button 会撞进严格模式
const button = p.getByRole('button', { name: '刷新' })
const title = p.locator('.header__title')

// S1 第一次打开
await p.goto(`${BASE_URL}/app/scaffold`, { waitUntil: 'networkidle' })
await shot(p, 's1-open.png')
say(`S1 text      : ${JSON.stringify((await p.locator('body').innerText()).replace(/\n/g, ' | '))}`)
say(`S1 boxes     : title=${JSON.stringify(await box(title))} button=${JSON.stringify(await box(button))} `)
const fullWidthButtonHeight = (await box(button))?.h ?? 0
say(`S1 overflow  : scrollWidth=${await p.evaluate(() => document.documentElement.scrollWidth)} clientWidth=${await p.evaluate(() => document.documentElement.clientWidth)}`)
const tabTitle = await p.title()
say(`S1 title     : ${JSON.stringify(tabTitle)}`)
if (tabTitle !== '总览 · CUI 2.0') problems.push('S1: 标签页标题没有跟路由走')

// 刷新按钮上的图标要真的渲染出来：`<use>` 指得到符号，尺寸是产品默认档
// 注意：要**指到具体那个按钮**。写 "header 里第一个 .icon" 会被后加进来的导航图标抢先
// （2026-10-02 就这样误报过一次）。
const icon = await p.evaluate(() => {
  const svg = document.querySelector('header.header .header__actions button svg.icon')
  const href = svg?.querySelector('use')?.getAttribute('href')
  const box = svg?.getBoundingClientRect()
  return { href, symbol: href ? !!document.querySelector(href) : false, w: Math.round(box?.width || 0), h: Math.round(box?.height || 0) }
})
say(`S1 icon      : ${JSON.stringify(icon)}`)
if (!icon.symbol) problems.push('S1: 刷新按钮的图标没渲染（雪碧图里找不到对应符号）')
if (icon.w !== 14 || icon.h !== 14) problems.push(`S1: 图标尺寸不是 14（实测 ${icon.w}x${icon.h}）`)

// 导航项也要有图标：每项一个 `<use>`，符号都指得到
const navIcons = await p.evaluate(() =>
  [...document.querySelectorAll('nav.nav a.nav__link')].map((a) => {
    const href = a.querySelector('use')?.getAttribute('href')
    return { text: a.textContent?.trim(), href, symbol: href ? !!document.querySelector(href) : false }
  }),
)
say(`S1 navIcons  : ${JSON.stringify(navIcons)}`)
if (navIcons.length < 2) problems.push('S1: 导航项少于两个（取不到导航）')
if (navIcons.some((x) => !x.symbol)) problems.push('S1: 有导航项没有图标，或符号指不到')

// 图标要与文字同一条中线，而且是描边不是实心块（实心块在深色下会是黑的）
const iconFit = await p.evaluate(() => {
  const cy = (el) => { const b = el?.getBoundingClientRect(); return b ? (b.top + b.bottom) / 2 : null }
  const btn = document.querySelector('header.header .header__actions button')
  const svg = btn?.querySelector('svg.icon')
  const link = document.querySelector('nav.nav a.nav__link')
  return {
    btnIcon: cy(svg), btnSpan: cy(btn?.querySelector('span')),
    navIcon: cy(link?.querySelector('svg.icon')), navLink: cy(link),
    fill: svg ? getComputedStyle(svg).fill : null,
    stroke: svg ? getComputedStyle(svg).stroke : null,
  }
})
say(`S1 iconFit   : ${JSON.stringify(iconFit)}`)
if (Math.abs((iconFit.btnIcon ?? 0) - (iconFit.btnSpan ?? 99)) > 0.5) problems.push('S1: 按钮图标与文字没有居中对齐')
if (Math.abs((iconFit.navIcon ?? 0) - (iconFit.navLink ?? 99)) > 0.5) problems.push('S1: 导航图标与文字没有居中对齐')
if (iconFit.fill !== 'none') problems.push('S1: 图标是实心填充（深色下会变黑块）')
if (!iconFit.stroke || iconFit.stroke === 'none') problems.push('S1: 图标没有描边颜色（不随文字/主题）')

// 图标一览：一个品牌标识 + 一批界面图标，符号都指得到；品牌标识不套界面图标的描边
const gallery = await p.evaluate(() =>
  [...document.querySelectorAll('.overview__row .overview__cell')].map((cell) => {
    const svg = cell.querySelector('svg')
    const href = svg?.querySelector('use')?.getAttribute('href')
    return { name: cell.querySelector('code')?.textContent, href, symbol: href ? !!document.querySelector(href) : false,
             stroke: svg ? getComputedStyle(svg).stroke : null }
  }),
)
say(`S1 gallery   : ${JSON.stringify(gallery)}`)
if (gallery.length < 40) problems.push(`S1: 演示项太少（实测 ${gallery.length}，应为自有品牌 4 + 其他品牌 12 + 图标 26）`)
if (gallery.some((x) => !x.symbol)) problems.push('S1: 一览里有图标指不到符号')
const brand = gallery.find((x) => x.name?.startsWith('brand-'))
if (!brand) problems.push('S1: 一览里没有品牌标识')
if (brand && brand.stroke !== 'none') problems.push('S1: 品牌标识被套上了界面图标的描边规则')

// 底座必须是 body 的直接子 svg（包一层就不画品牌身体）
const sprite = await p.evaluate(() => {
  const svg = document.querySelector('body > svg[width="0"]')
  return svg ? { direct: true, display: getComputedStyle(svg).display } : { direct: false, display: null }
})
say(`S1 sprite    : ${JSON.stringify(sprite)}`)
if (!sprite.direct) problems.push('S1: 图标底座不是 body 的直接子 svg（会掉品牌身体）')
if (sprite.display === 'none') problems.push('S1: 图标底座被 display:none')

// 描边与缩放必须与设计页 icon() 一致：viewBox 在、界面图标描边固定 2（缩放由 viewBox 做）
const scale = await p.evaluate(() => {
  const read = (sel) => {
    const s = document.querySelector(sel)
    if (!s) return null
    const st = getComputedStyle(s)
    return { viewBox: s.getAttribute('viewBox'), strokeWidth: st.strokeWidth, stroke: st.stroke, fill: st.fill }
  }
  return { button: read('header.header .header__actions button svg.icon'), gallery: read('.overview__row svg.icon'), brand: read('.overview__row svg.brand-mark') }
})
say(`S1 scale     : ${JSON.stringify(scale)}`)
for (const k of ['button', 'gallery']) {
  if (scale[k]?.viewBox !== '0 0 24 24') problems.push(`S1: ${k} 图标没有 viewBox（缩放无从发生）`)
  if (scale[k]?.strokeWidth !== '2px') problems.push(`S1: ${k} 图标描边不是固定的 2（双缩放会让它比设计页细）`)
}
if (scale.brand?.viewBox !== '0 0 24 24') problems.push('S1: 品牌标识没有 viewBox')
if (scale.brand?.strokeWidth === '2px') problems.push('S1: 品牌标识被套上了界面图标的描边')
// S2 快速连点 12 下
const before = await box(button)
await button.click({ delay: 0 })

// 刷新是**路由重载**（不再自增计数）：点完之后页面还在、那行「结构试跑」还在
await p.waitForLoadState('domcontentloaded')
if (!(await trial.innerText()).includes('结构试跑')) problems.push('S2: 刷新之后页面没有回到原样')
say(`S2 button box: before=${JSON.stringify(before)}`)

// S3 只用键盘
await p.goto(`${BASE_URL}/app/scaffold`, { waitUntil: 'networkidle' })
// 头部有导航链接在前：用 Tab 走到「刷新」（脚本实现细节，剧本里用户的动作没变）
for (let i = 0; i < 12; i++) {
  if (await p.evaluate(() => document.activeElement?.innerText?.trim() === '刷新')) break
  await p.keyboard.press('Tab')
}
const focused = await p.evaluate(() => ({ tag: document.activeElement?.tagName, text: document.activeElement?.innerText?.trim(), shadow: getComputedStyle(document.activeElement).boxShadow }))
await shot(p, 's3-focus.png')
say(`S3 focus     : ${JSON.stringify(focused)}`)
if (focused.tag !== 'BUTTON' || focused.text !== '刷新') problems.push('S3: Tab 没有落在「刷新」按钮上')
if (!focused.shadow || focused.shadow === 'none') problems.push('S3: 焦点环不可见')
await p.keyboard.press('Enter'); await p.keyboard.press('Space'); await p.waitForTimeout(150)
await shot(p, 's3-after-keys.png')

// S4 切主题 —— 用**页面上的分段控件**（设计里的主题切换件：浅色 / 暗色）
await p.getByRole('button', { name: '暗色' }).click()
await p.waitForTimeout(250)
await shot(p, 's4-dark.png')
const dark = await p.evaluate(() => ({
  body: getComputedStyle(document.body).backgroundColor,
  title: getComputedStyle(document.querySelector('.header__title')).color,
  card: getComputedStyle(document.querySelector('.foo-bar')).backgroundColor,
  root: document.documentElement.dataset.theme,
  label: document.querySelector('.theme-toggle button.is-on')?.textContent?.trim(),
}))
say(`S4 dark      : ${JSON.stringify(dark)}`)
if (dark.body === 'rgb(255, 255, 255)' || dark.body === 'rgba(0, 0, 0, 0)') problems.push('S4: 深色下页面底色还是白的/透明的')
if (dark.root !== 'dark') problems.push('S4: 点了按钮但根元素 data-theme 不是 dark')
if (dark.label !== '暗色') problems.push('S4: 分段控件没有把「暗色」标为选中')
// 内容面必须铺满视口，否则页面底部会露出另一层的分界（这是本轮抓到并修掉的缺陷）
const surface = await p.evaluate(() => ({
  h: Math.round(document.querySelector('#app > *').getBoundingClientRect().height),
  vh: window.innerHeight,
}))
say(`S4 surface   : ${JSON.stringify(surface)}`)
if (surface.h < surface.vh) problems.push('S4: 内容面没有铺满视口，底部会露出分界')

// S5 窄窗 375
await p.setViewportSize({ width: 375, height: 400 })
await p.waitForTimeout(200)
await shot(p, 's5-narrow.png')
const tb = await box(title), bb = await box(button)
const overlap = tb && bb ? !(tb.x + tb.w <= bb.x || bb.x + bb.w <= tb.x || tb.y + tb.h <= bb.y || bb.y + bb.h <= tb.y) : null
say(`S5 boxes     : title=${JSON.stringify(tb)} button=${JSON.stringify(bb)} overlap=${overlap}`)
if (overlap) problems.push('S5: 标题与按钮重叠')
if (await p.evaluate(() => document.documentElement.scrollWidth) > 375) problems.push('S5: 窄窗下横向溢出')

// 按钮文字**不许折行**：剧本判据里"换行错乱"就是不通过，但上一条只测重叠与横向溢出，
// 判据比剧本窄 —— 2026-10-03 复核者据此抓到「刷新」被折成两行却全链绿。
// 按钮文字**不许折行**：折了高度近乎翻倍（2026-10-03 复核者抓到「刷新」被折成两行却全链绿）。
// 用高度对比，不用矩形个数/行顶：按钮里的图标会让那两种数法都失真。
say(`S5 button h  : full=${fullWidthButtonHeight} narrow=${bb?.h}`)
if (bb && fullWidthButtonHeight && bb.h > fullWidthButtonHeight + 4) problems.push('S5: 按钮文字折行')

// S6 刷新
await p.setViewportSize({ width: 760, height: 300 })
await p.reload({ waitUntil: 'networkidle' })
await shot(p, 's6-after-reload.png')
if (!(await trial.innerText()).includes('结构试跑')) problems.push('S6: 刷新之后那行「结构试跑」不见了')
  // S7 深色的系统上第一次打开 —— 首屏就该是暗的，不先闪一下浅色。
  // 用**独立上下文**：S4 已经写过显式偏好，同一上下文会把它带过来，就测不出"跟随系统"了。
  const darkCtx = await b.newContext({ viewport: { width: 760, height: 300 }, deviceScaleFactor: 2, locale: 'zh-CN', colorScheme: 'dark' })
  const dp = await darkCtx.newPage()
  dp.on('pageerror', (e) => problems.push(`S7 pageerror: ${e.message}`))
  // 把主包延迟住：这期间根元素上就该已经是暗的，否则说明主题是等 JS 跑完才写的（会先闪浅色）
  await dp.route('**/src/main.tsx*', async (route) => { await new Promise((r) => setTimeout(r, 1500)); await route.continue() })
  await dp.goto(`${BASE_URL}/app/scaffold`, { waitUntil: 'commit' })
  let firstPaint
  try {
    await dp.waitForFunction(() => document.documentElement.dataset.theme === 'dark', null, { timeout: 1200 })
    firstPaint = 'dark'
  } catch { firstPaint = await dp.evaluate(() => document.documentElement.dataset.theme || '(none)') }
  say(`S7 firstPaint: ${JSON.stringify(firstPaint)}（主包仍在路上）`)
  if (firstPaint !== 'dark') problems.push('S7: 深色系统下首屏不是暗色（会先闪浅色）')
  await dp.unroute('**/src/main.tsx*')
  await dp.goto(`${BASE_URL}/app/scaffold`, { waitUntil: 'networkidle' })
  await dp.waitForTimeout(250)
  await shot(dp, 's7-system-dark.png')
  const sysDark = await dp.evaluate(() => ({
    root: document.documentElement.dataset.theme,
    body: getComputedStyle(document.body).backgroundColor,
    on: document.querySelector('.theme-toggle button.is-on')?.textContent?.trim(),
  }))
  say(`S7 systemDark: ${JSON.stringify(sysDark)}`)
  if (sysDark.root !== 'dark') problems.push('S7: 深色系统下页面不是暗的')
  if (sysDark.body === 'rgb(255, 255, 255)') problems.push('S7: 深色系统下页面底色还是白的')
  await darkCtx.close()

  await b.close()
say(`shots        : ${SHOTS.replace(PACKAGE + '/', '')}`)
if (problems.length) { say(`problems     : ${problems.length}`); problems.forEach((x) => say(`  - ${x}`)); process.exit(1) }
say('objective    : all measurements pass (the verdict lives in the sibling .agent.md)')
