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
import { capturePage, captureScreen, shotDir } from '../../../../../scripts/shots.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const PACKAGE = resolve(HERE, '../../../../..')
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
const p = await b.newPage({ viewport: { width: 760, height: 300 }, deviceScaleFactor: 2 })
p.on('response', (r) => { if (r.status() >= 400) problems.push(`${r.status()} ${r.url()}`) })
p.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))

const counter = p.locator('.foo-bar__count')
// 页面上不止一个按钮，按可访问名取 —— 只用 button.button 会撞进严格模式
const button = p.getByRole('button', { name: '刷新' })
const title = p.locator('.header__title')

// S1 第一次打开
await p.goto(BASE_URL, { waitUntil: 'networkidle' })
await shot(p, 's1-open.png')
say(`S1 text      : ${JSON.stringify((await p.locator('body').innerText()).replace(/\n/g, ' | '))}`)
say(`S1 boxes     : title=${JSON.stringify(await box(title))} button=${JSON.stringify(await box(button))} counter=${JSON.stringify(await box(counter))}`)
say(`S1 overflow  : scrollWidth=${await p.evaluate(() => document.documentElement.scrollWidth)} clientWidth=${await p.evaluate(() => document.documentElement.clientWidth)}`)

// S2 快速连点 12 下
const before = await box(button)
for (let i = 0; i < 12; i++) await button.click({ delay: 0 })
await p.waitForTimeout(250)
await shot(p, 's2-after-12-clicks.png')
const twelve = (await counter.innerText()).includes('12')
say(`S2 counter   : ${await counter.innerText()}`)
const after = await box(button)
say(`S2 button box: before=${JSON.stringify(before)} after=${JSON.stringify(after)} moved=${before.x !== after.x || before.y !== after.y || before.w !== after.w}`)
if (!twelve) problems.push('S2: 连点 12 下后计数不是 12')

// S3 只用键盘
await p.goto(BASE_URL, { waitUntil: 'networkidle' })
await p.keyboard.press('Tab')
const focused = await p.evaluate(() => ({ tag: document.activeElement?.tagName, text: document.activeElement?.innerText?.trim(), shadow: getComputedStyle(document.activeElement).boxShadow }))
await shot(p, 's3-focus.png')
say(`S3 focus     : ${JSON.stringify(focused)}`)
if (focused.tag !== 'BUTTON' || focused.text !== '刷新') problems.push('S3: Tab 没有落在「刷新」按钮上')
if (!focused.shadow || focused.shadow === 'none') problems.push('S3: 焦点环不可见')
await p.keyboard.press('Enter'); await p.keyboard.press('Space'); await p.waitForTimeout(150)
await shot(p, 's3-after-keys.png')
const two = (await counter.innerText()).includes('2')
say(`S3 counter   : ${await counter.innerText()}`)
if (!two) problems.push('S3: 回车+空格后计数不是 2')

// S4 切主题 —— 用**页面上的按钮**（主题现在归平台层 store 管，直接戳 DOM 已不是真实路径）
await p.getByRole('button', { name: '切到深色' }).click()
await p.waitForTimeout(250)
await shot(p, 's4-dark.png')
const dark = await p.evaluate(() => ({
  body: getComputedStyle(document.body).backgroundColor,
  title: getComputedStyle(document.querySelector('.header__title')).color,
  card: getComputedStyle(document.querySelector('.foo-bar')).backgroundColor,
  root: document.documentElement.dataset.theme,
  label: document.querySelector('.hello__actions button')?.textContent?.trim(),
}))
say(`S4 dark      : ${JSON.stringify(dark)}`)
if (dark.body === 'rgb(255, 255, 255)' || dark.body === 'rgba(0, 0, 0, 0)') problems.push('S4: 深色下页面底色还是白的/透明的')
if (dark.root !== 'dark') problems.push('S4: 点了按钮但根元素 data-theme 不是 dark')
if (dark.label !== '切到浅色') problems.push('S4: 按钮没有翻成"切到浅色"')
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

// S6 刷新
await p.setViewportSize({ width: 760, height: 300 })
await p.reload({ waitUntil: 'networkidle' })
await shot(p, 's6-after-reload.png')
const zero = (await counter.innerText()).includes('0')
say(`S6 counter   : ${await counter.innerText()}`)
if (!zero) problems.push('S6: 刷新后计数没有归零')

await b.close()
say(`shots        : ${SHOTS.replace(PACKAGE + '/', '')}`)
if (problems.length) { say(`problems     : ${problems.length}`); problems.forEach((x) => say(`  - ${x}`)); process.exit(1) }
say('objective    : all measurements pass (the verdict lives in the sibling .agent.md)')
