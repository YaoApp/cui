#!/usr/bin/env node
/* 拟人测试的采集脚本 —— 只做机器能做的部分：开真浏览器、按剧本走一遍、截图、报客观测量。
   判定（看图 · OCR · 决策模型 · 是否转人）不在这里，写在同目录的 persona.md 里。

   为什么住这里：拟人测试只属于 feature，剧本与它的采集脚本都放在该 feature 的 tests/ 下。
   后缀即分工 —— *.test.ts(x) 给 vitest · *.spec.ts 给 Playwright · persona.mjs 给 pnpm test:persona。

   证据落在 app/logs/<日期>/persona-<HHMM>/（与同一次运行的日志同目录，git 忽略）。
   用法：pnpm test:persona */
import { chromium } from '@playwright/test'   // 直接依赖；playwright-core 是它的传递依赖，解析不到
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PACKAGE = resolve(HERE, '../../../../..')
const BASE_URL = process.env.CUI_BASE_URL ?? 'http://localhost:5200'

const pad = (n) => String(n).padStart(2, '0')
const now = new Date()
const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
const stamp = `${pad(now.getHours())}${pad(now.getMinutes())}`
const EVIDENCE = resolve(PACKAGE, 'app', 'logs', day, `persona-${stamp}`)

const problems = []
const say = (s) => console.log(s)
const box = async (l) => { const b = await l.boundingBox(); return b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } : null }

mkdirSync(EVIDENCE, { recursive: true })
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: 760, height: 300 }, deviceScaleFactor: 2 })
p.on('response', (r) => { if (r.status() >= 400) problems.push(`${r.status()} ${r.url()}`) })
p.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))

const counter = p.locator('.foo-bar__count')
const button = p.locator('button.button')
const title = p.locator('.header__title')

// S1 第一次打开
await p.goto(BASE_URL, { waitUntil: 'networkidle' })
await p.screenshot({ path: `${EVIDENCE}/s1-open.png` })
say(`S1 text      : ${JSON.stringify((await p.locator('body').innerText()).replace(/\n/g, ' | '))}`)
say(`S1 boxes     : title=${JSON.stringify(await box(title))} button=${JSON.stringify(await box(button))} counter=${JSON.stringify(await box(counter))}`)
say(`S1 overflow  : scrollWidth=${await p.evaluate(() => document.documentElement.scrollWidth)} clientWidth=${await p.evaluate(() => document.documentElement.clientWidth)}`)

// S2 快速连点 12 下
const before = await box(button)
for (let i = 0; i < 12; i++) await button.click({ delay: 0 })
await p.waitForTimeout(250)
await p.screenshot({ path: `${EVIDENCE}/s2-after-12-clicks.png` })
const twelve = (await counter.innerText()).includes('12')
say(`S2 counter   : ${await counter.innerText()}`)
const after = await box(button)
say(`S2 button box: before=${JSON.stringify(before)} after=${JSON.stringify(after)} moved=${before.x !== after.x || before.y !== after.y || before.w !== after.w}`)
if (!twelve) problems.push('S2: 连点 12 下后计数不是 12')

// S3 只用键盘
await p.goto(BASE_URL, { waitUntil: 'networkidle' })
await p.keyboard.press('Tab')
const focused = await p.evaluate(() => ({ tag: document.activeElement?.tagName, text: document.activeElement?.innerText?.trim(), shadow: getComputedStyle(document.activeElement).boxShadow }))
await p.screenshot({ path: `${EVIDENCE}/s3-focus.png` })
say(`S3 focus     : ${JSON.stringify(focused)}`)
if (focused.tag !== 'BUTTON') problems.push('S3: Tab 没有落在按钮上')
if (!focused.shadow || focused.shadow === 'none') problems.push('S3: 焦点环不可见')
await p.keyboard.press('Enter'); await p.keyboard.press('Space'); await p.waitForTimeout(150)
await p.screenshot({ path: `${EVIDENCE}/s3-after-keys.png` })
const two = (await counter.innerText()).includes('2')
say(`S3 counter   : ${await counter.innerText()}`)
if (!two) problems.push('S3: 回车+空格后计数不是 2')

// S4 深色
await p.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
await p.waitForTimeout(250)
await p.screenshot({ path: `${EVIDENCE}/s4-dark.png` })
const dark = await p.evaluate(() => ({ body: getComputedStyle(document.body).backgroundColor, title: getComputedStyle(document.querySelector('.header__title')).color, card: getComputedStyle(document.querySelector('.foo-bar')).backgroundColor }))
say(`S4 dark      : ${JSON.stringify(dark)}`)
if (dark.body === 'rgb(255, 255, 255)' || dark.body === 'rgba(0, 0, 0, 0)') problems.push('S4: 深色下页面底色还是白的/透明的')

// S5 窄窗 375
await p.setViewportSize({ width: 375, height: 400 })
await p.waitForTimeout(200)
await p.screenshot({ path: `${EVIDENCE}/s5-narrow.png` })
const tb = await box(title), bb = await box(button)
const overlap = tb && bb ? !(tb.x + tb.w <= bb.x || bb.x + bb.w <= tb.x || tb.y + tb.h <= bb.y || bb.y + bb.h <= tb.y) : null
say(`S5 boxes     : title=${JSON.stringify(tb)} button=${JSON.stringify(bb)} overlap=${overlap}`)
if (overlap) problems.push('S5: 标题与按钮重叠')
if (await p.evaluate(() => document.documentElement.scrollWidth) > 375) problems.push('S5: 窄窗下横向溢出')

// S6 刷新
await p.setViewportSize({ width: 760, height: 300 })
await p.reload({ waitUntil: 'networkidle' })
await p.screenshot({ path: `${EVIDENCE}/s6-after-reload.png` })
const zero = (await counter.innerText()).includes('0')
say(`S6 counter   : ${await counter.innerText()}`)
if (!zero) problems.push('S6: 刷新后计数没有归零')

await b.close()
say(`evidence     : ${EVIDENCE.replace(PACKAGE + '/', '')}`)
if (problems.length) { say(`problems     : ${problems.length}`); problems.forEach((x) => say(`  - ${x}`)); process.exit(1) }
say('objective    : 全部通过（判定见同目录 persona.md）')
