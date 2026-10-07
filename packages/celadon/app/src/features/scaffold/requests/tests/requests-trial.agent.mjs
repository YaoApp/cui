#!/usr/bin/env node
/* 拟人测试的采集脚本 —— 只做机器能做的部分：开真浏览器、按剧本走一遍、截图、报客观测量。
   判定（看图 · OCR · 决策模型 · 是否转人）写在同目录的 requests-trial.agent.md 里。

   验证的是**接口验证页**这条路：`/app/scaffold/requests` 上的四格接口（公开/受保护 × GET/POST）
   与「取数状态」那节。接口用**冻结的桩数据**应答（与剧本「判定数据（冻结）」逐字一致）——
   拟人层判的是画面与文案，不是后端；桩住才可复现、可断言的测量才有意义。

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

const SCENARIO = basename(fileURLToPath(import.meta.url)).replace('.agent.mjs', '')
const SHOTS = shotDir(SCENARIO)

const problems = []
const say = (s) => console.log(s)

// 拟人层测的是**构建产物**，不是 dev 源码。产物比源码旧就说明在测过期的东西 —— 明确失败，别假绿。
function newestMtime(dir) {
  let newest = 0
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue
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
    if (e.code === 'ENOENT') problems.push('dist 不存在 —— 拟人层测构建产物，先 pnpm build')
    else throw e
  }
  if (built) {
    const newestSource = Math.max(newestMtime(join(PACKAGE, 'app', 'src')), newestMtime(join(PACKAGE, 'design')))
    if (newestSource > built) problems.push('dist 比源码旧 —— 先 pnpm build 再跑拟人，否则测的是过期产物')
  }
}

const shot = (page, name) => capturePage(page, join(SHOTS, name))

// 系统级整屏：只有 macOS 实现了；其它平台不假装成功，记一句就继续。
const headed = process.env.CUI_HEADED === '1'
try {
  const r = captureScreen(join(SHOTS, 'screen.jpg'), { format: 'jpg' })
  say(`screen       : ${r.platform} · ${r.region} · ${r.format}${headed ? '' : '（headless，画面里没有浏览器）'}`)
} catch (e) {
  say(`screen       : skipped — ${e.message}`)
}

/* ── 冻结的桩数据（与 requests-trial.agent.md 的「判定数据（冻结）」逐字一致）
   服务信息给 openapi 前缀；公开 GET/POST 各回各的值；受保护两条回 401（未登录 → 页面按码翻成「未登录或登录已过期」，并标「未登录（缺凭据）」）。*/
const SERVICE = { name: 'Yao Agents', version: '1.0.0', openapi: '/v1' }
const GET_VALUE = { MESSAGE: 'data-check-persona-get', SERVER_TIME: '2020-01-01T00:00:00Z' }
const POST_VALUE = { MESSAGE: 'data-check-persona-post', SERVER_TIME: '2020-01-01T00:00:00Z' }
const DENIED = { error: 'unauthorized', error_description: 'no credential was sent' }

const b = await chromium.launch({ channel: 'chrome', headless: !headed })
// 浏览器环境显式钉住：语言固定基准 zh-CN，配色固定浅色 —— 两者都跟随系统，
// 不钉的话剧本断言的界面文案与观感会因跑测机器而异（见 architecture/14-testing.md §1）
const p = await b.newPage({ viewport: { width: 900, height: 520 }, deviceScaleFactor: 2, locale: 'zh-CN', colorScheme: 'light' })
p.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))

await p.route('**/.well-known/yao', (route) => route.fulfill({ json: SERVICE }))
await p.route('**/v1/**', (route) => {
  const url = route.request().url()
  if (url.includes('/helloworld/protected')) return route.fulfill({ status: 401, json: DENIED })
  return route.fulfill({ json: route.request().method() === 'POST' ? POST_VALUE : GET_VALUE })
})

/** 结果排（四格接口）里某一格的可见文字。 */
const cellText = (label) =>
  p.evaluate((name) => {
    const cell = [...document.querySelectorAll('.requests__cell')].find(
      (el) => el.querySelector('.requests__label')?.textContent?.trim() === name,
    )
    return cell ? (cell.textContent ?? '').replace(/\s+/g, ' ').trim() : null
  }, label)

/** 四态那节当前高亮的是哪一态。 */
const activeState = () =>
  p.evaluate(() => document.querySelector('.requests__state[data-active="true"]')?.textContent?.trim() ?? null)

/** 结果排四格的几何：盒子 + 内容（值）的实际范围。 */
const measureRow = () =>
  p.evaluate(() => {
    const row = [...document.querySelectorAll('.requests__row')].find(
      (el) => el.querySelectorAll('.requests__cell').length === 4,
    )
    const cells = [...row.querySelectorAll('.requests__cell')].map((el) => {
      const rect = el.getBoundingClientRect()
      const value = el.querySelector('code').getBoundingClientRect()
      return {
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        contentLeft: Math.round(value.left),
        contentRight: Math.round(value.right),
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }
    })
    return { rowWidth: Math.round(row.getBoundingClientRect().width), rowScrollWidth: row.scrollWidth, rowClientWidth: row.clientWidth, cells }
  })

// ── S1 打开页面：四态那节用公开 GET（挂载即跑），落定后「成功」该高亮
await p.goto(`${BASE_URL}/app/scaffold/requests`, { waitUntil: 'networkidle' })
await p.waitForFunction(() => document.querySelector('.requests__state[data-active="true"]')?.textContent?.trim() === '成功')
await shot(p, 's1-open.png')
const s1 = await activeState()
const title = await p.title()
say(`S1 active    : ${JSON.stringify(s1)}`)
say(`S1 title     : ${JSON.stringify(title)}`)
if (s1 !== '成功') problems.push(`S1: 四态当前态不是「成功」（实测 ${JSON.stringify(s1)}）`)
if (title !== '接口验证 · CUI 2.0') problems.push('S1: 标签页标题没有跟路由走')

// ── S2 点「公开 GET」：结果格印出冻结的返回值
await p.getByRole('button', { name: '公开 GET' }).click()
await p.waitForFunction(() => document.body.innerText.includes('data-check-persona-get'))
await shot(p, 's2-public-get.png')
const s2 = await cellText('公开 GET')
say(`S2 publicGet : ${JSON.stringify(s2)}`)
if (!s2?.includes('成功')) problems.push('S2: 公开 GET 的结果格不是「成功」')
if (!s2?.includes('"MESSAGE":"data-check-persona-get"')) problems.push('S2: 公开 GET 的结果值不是冻结的那份')

// ── S3 点「公开 POST」：同上，值是 POST 那一份
await p.getByRole('button', { name: '公开 POST' }).click()
await p.waitForFunction(() => document.body.innerText.includes('data-check-persona-post'))
await shot(p, 's3-public-post.png')
const s3 = await cellText('公开 POST')
say(`S3 publicPost: ${JSON.stringify(s3)}`)
if (!s3?.includes('成功')) problems.push('S3: 公开 POST 的结果格不是「成功」')
if (!s3?.includes('"MESSAGE":"data-check-persona-post"')) problems.push('S3: 公开 POST 的结果值不是冻结的那份')

// ── S4 点两条受保护的：都该失败，按码翻成「未登录或登录已过期」，并标出「未登录（缺凭据）」
await p.getByRole('button', { name: '受保护 GET' }).click()
await p.getByRole('button', { name: '受保护 POST' }).click()
await p.waitForFunction(() => document.body.innerText.includes('未登录（缺凭据）'))
await shot(p, 's4-protected.png')
const s4get = await cellText('受保护 GET')
const s4post = await cellText('受保护 POST')
say(`S4 protGet   : ${JSON.stringify(s4get)}`)
say(`S4 protPost  : ${JSON.stringify(s4post)}`)
for (const [step, text] of [['S4: 受保护 GET', s4get], ['S4: 受保护 POST', s4post]]) {
  if (!text?.includes('未登录或登录已过期')) problems.push(`${step} 的结果格没有按码翻成「未登录或登录已过期」`)
  if (!text?.includes('未登录（缺凭据）')) problems.push(`${step} 没有标出「未登录（缺凭据）」`)
}

// ── S5 看四态格当前态，并量结果排的几何：长值不许压到邻居
const s5 = await activeState()
await shot(p, 's5-final.png')
say(`S5 active    : ${JSON.stringify(s5)}`)
if (s5 !== '成功') problems.push(`S5: 四态当前态被后面的调用带跑了（实测 ${JSON.stringify(s5)}）`)

const geometry = await measureRow()
say(`S5 geometry  : ${JSON.stringify(geometry)}`)
const sorted = [...geometry.cells].sort((a, b) => a.left - b.left)
for (let i = 1; i < sorted.length; i++) {
  if (sorted[i].left < sorted[i - 1].right) problems.push(`S5: 第 ${i} 格与第 ${i + 1} 格横向重叠`)
}
for (const cell of geometry.cells) if (cell.width > geometry.rowWidth) problems.push('S5: 有格子比容器还宽')
for (const cell of geometry.cells) {
  if (cell.scrollWidth > cell.clientWidth + 1) problems.push('S5: 有格子的值溢出到格子外')
  if (cell.contentLeft < cell.left - 1 || cell.contentRight > cell.right + 1) problems.push('S5: 有格子的值画到了邻居身上')
}
if (geometry.rowScrollWidth > geometry.rowClientWidth + 1) problems.push('S5: 结果排横向溢出')

await b.close()
say(`shots        : ${SHOTS.replace(PACKAGE + '/', '')}`)
if (problems.length) {
  say(`problems     : ${problems.length}`)
  problems.forEach((x) => say(`  - ${x}`))
  process.exit(1)
}
say('objective    : all measurements pass (the verdict lives in the sibling .agent.md)')
