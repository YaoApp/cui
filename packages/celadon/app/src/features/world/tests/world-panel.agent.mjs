#!/usr/bin/env node
/* 拟人测试的采集脚本 —— 只做机器能做的部分：开真浏览器、按剧本走一遍、截图、报客观测量。
   判定（看图 · OCR · 决策模型 · 是否转人）写在同目录的 world-panel.agent.md 里。

   验证的是**公共状态**这条路：侧边面板 → 公共 store（stores/side-panel.ts）
   → 由路由层绑到地址栏（?sideEntity=），所以"能分享 · 能刷新 · 后退能关"。
   用法：pnpm test:persona */
import { chromium } from '@playwright/test'
import { readdirSync, statSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { capturePage, captureScreen, shotDir } from '../../../../../scripts/shots.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const PACKAGE = resolve(HERE, '../../../../..')
const BASE_URL = process.env.CUI_BASE_URL ?? 'http://localhost:5200'

const SCENARIO = basename(fileURLToPath(import.meta.url)).replace('.agent.mjs', '')
const SHOTS = shotDir(SCENARIO)

const problems = []
const say = (s) => console.log(s)

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

// 拟人层测的是**构建产物**：产物比源码旧就是过期，明确失败，别假绿。
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

const headed = process.env.CUI_HEADED === '1'
try {
  const r = captureScreen(join(SHOTS, 'screen.jpg'), { format: 'jpg' })
  say(`screen       : ${r.platform} · ${r.region} · ${r.format}${headed ? '' : '（headless，画面里没有浏览器）'}`)
} catch (e) {
  say(`screen       : skipped — ${e.message}`)
}

const b = await chromium.launch({ channel: 'chrome', headless: !headed })
const p = await b.newPage({ viewport: { width: 900, height: 500 }, deviceScaleFactor: 2 })
p.on('response', (r) => { if (r.status() >= 400) problems.push(`${r.status()} ${r.url()}`) })
p.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))

const panel = p.locator('.entity-panel')
const search = () => p.evaluate(() => location.search)
const panelText = async () => ((await panel.count()) ? (await panel.innerText()).replace(/\s+/g, ' ') : '')
const present = async () => (await panel.count()) > 0

// ── S1 别人发我的地址：带参进来，面板该是开的
await p.goto(`${BASE_URL}/main/world/w1?sideEntity=e2`, { waitUntil: 'networkidle' })
await p.waitForTimeout(300)
await shot(p, 's1-deeplink.png')
const s1 = await search()
say(`S1 panel     : ${(await present()) ? 'present' : 'MISSING'}`)
say(`S1 search    : ${JSON.stringify(s1)}`)
say(`S1 text      : ${JSON.stringify(await panelText())}`)
if (!(await present())) problems.push('S1: 带参地址没有打开面板')
if (!(await panelText()).includes('守门人')) problems.push('S1: 面板里不是「守门人」')
if (s1 !== '?sideEntity=e2') problems.push('S1: 地址被改了（读进来不该回写）')

// ── S2 从详情点开：地址要能复制给别人
await p.goto(`${BASE_URL}/main/world/w1`, { waitUntil: 'networkidle' })
await p.getByRole('button', { name: '守门人' }).click()
await p.waitForTimeout(400)
await shot(p, 's2-after-click.png')
const s2 = await search()
say(`S2 panel     : ${(await present()) ? 'present' : 'MISSING'}`)
say(`S2 search    : ${JSON.stringify(s2)}`)
if (!(await present())) problems.push('S2: 点开条目后面板没出现')
if (!s2.includes('sideEntity=e2')) problems.push('S2: 点开条目后地址里没有 sideEntity=e2（分享不出去）')

// ── S3 后退：应当把面板关掉
await p.goBack()
await p.waitForTimeout(400)
await shot(p, 's3-after-back.png')
const s3 = await search()
say(`S3 panel     : ${(await present()) ? 'present' : 'absent'}`)
say(`S3 search    : ${JSON.stringify(s3)}`)
if (await present()) problems.push('S3: 后退之后面板还开着')
if (s3.includes('sideEntity')) problems.push('S3: 后退之后地址里还留着面板参数')

// ── S4 刷新：地址是真相，面板该还在
await p.goto(`${BASE_URL}/main/world/w1?sideEntity=e2`, { waitUntil: 'networkidle' })
await p.reload({ waitUntil: 'networkidle' })
await p.waitForTimeout(300)
await shot(p, 's4-after-reload.png')
say(`S4 panel     : ${(await present()) ? 'present' : 'MISSING'}`)
say(`S4 search    : ${JSON.stringify(await search())}`)
if (!(await present())) problems.push('S4: 刷新后面板没了')

// ── S5 过滤与面板并存：私有（?q=）与公共（?sideEntity=）两处绑定不能互相覆盖
await p.getByLabel('过滤').fill('alpha')
await p.waitForTimeout(500)
await shot(p, 's5-filter-kept-panel.png')
const s5 = await search()
say(`S5 panel     : ${(await present()) ? 'present' : 'MISSING'}`)
say(`S5 search    : ${JSON.stringify(s5)}`)
if (!s5.includes('q=alpha')) problems.push('S5: 过滤没进地址')
if (!s5.includes('sideEntity=e2')) problems.push('S5: 打字把面板参数挤掉了（两处绑定互相覆盖）')
if (!(await present())) problems.push('S5: 打字之后被面板关掉了')

await b.close()
say(`shots        : ${SHOTS.replace(PACKAGE + '/', '')}`)
if (problems.length) {
  say(`problems     : ${problems.length}`)
  problems.forEach((x) => say(`  - ${x}`))
  process.exit(1)
}
say('objective    : all measurements pass (the verdict lives in the sibling .agent.md)')
