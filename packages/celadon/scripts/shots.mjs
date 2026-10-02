#!/usr/bin/env node
/* shots.mjs —— 固化的截图资产。拟人采集脚本统一调它，不各自 page.screenshot()。

   目录约定（与日志同一套）：
     app/logs/<系统日期>/shots/<场景>/<名>.png

   两种截图，用途不同：
     · page  —— 页面视口（Playwright）。跨平台，判定用它的像素。
     · screen —— 系统级整屏（含浏览器外框 · 系统缩放 · 真实窗口尺寸）。**拟人测试要的"人看到的那一屏"**。

   平台适配：系统级截图由 PLATFORMS 分派，**目前只实现 macOS**（screencapture）。
   其它平台抛清晰错误，不假装成功 —— 要加就在 PLATFORMS 里加一条。

   CLI：
     node scripts/shots.mjs dir <场景>                    # 打印并创建该场景当天的截图目录
     node scripts/shots.mjs screen <out.png|jpg> [--region x,y,w,h] [--format png|jpg] */
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const pad = (n) => String(n).padStart(2, '0')
const dayOf = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** 系统级截图：每个平台一条实现；没有实现就明确说没有。 */
const PLATFORMS = {
  darwin: {
    label: 'macOS',
    command: 'screencapture',
    args: (out, { region, format }) => {
      const args = ['-x']
      if (format) args.push('-t', format)          // 整屏 png 有 10M 量级，jpg 小一个数量级
      if (region) args.push('-R', region)
      return [...args, out]
    },
  },
}

/** 该场景当天的截图目录（存在则直接用，不存在就建）。 */
export function shotDir(scenario, { date = dayOf(), packageRoot = PACKAGE } = {}) {
  if (!scenario) throw new Error('shotDir: scenario is required')
  const dir = resolve(packageRoot, 'app', 'logs', date, 'shots', scenario)
  mkdirSync(dir, { recursive: true })
  return dir
}

/** 页面视口截图 —— 跨平台，判定用这一份。 */
export async function capturePage(page, outPath) {
  await page.screenshot({ path: outPath })
  return outPath
}

/** 系统级整屏截图 —— 只实现了 macOS。 */
export function captureScreen(outPath, { region, format, platform = process.platform } = {}) {
  const impl = PLATFORMS[platform]
  if (!impl) {
    throw new Error(
      `captureScreen: no implementation for platform "${platform}" ` +
        `(implemented: ${Object.keys(PLATFORMS).join(', ')}). ` +
        `Page shots via capturePage() work everywhere.`
    )
  }
  execFileSync(impl.command, impl.args(outPath, { region, format }), { stdio: 'pipe' })
  return { path: outPath, platform: impl.label, region: region ?? 'full screen', format: format ?? 'png' }
}

// ── CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, ...rest] = process.argv.slice(2)
  const regionArg = rest.indexOf('--region')
  const formatArg = rest.indexOf('--format')
  const region = regionArg >= 0 ? rest[regionArg + 1] : undefined
  const format = formatArg >= 0 ? rest[formatArg + 1] : undefined
  const skip = new Set([regionArg, regionArg + 1, formatArg, formatArg + 1].filter((i) => i >= 0))
  const positional = rest.filter((_, i) => !skip.has(i))

  if (cmd === 'dir') {
    console.log(shotDir(positional[0]))
  } else if (cmd === 'screen') {
    const out = positional[0]
    if (!out) { console.error('usage: node scripts/shots.mjs screen <out.png> [--region x,y,w,h]'); process.exit(2) }
    mkdirSync(dirname(resolve(out)), { recursive: true })
    const r = captureScreen(resolve(out), { region, format })
    console.log(`✓ ${r.path} (${r.platform} · ${r.region} · ${r.format})`)
  } else {
    console.error('usage: node scripts/shots.mjs <dir <scenario> | screen <out.png> [--region x,y,w,h]>')
    process.exit(2)
  }
}
