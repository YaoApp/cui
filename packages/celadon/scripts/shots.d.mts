/**
 * `scripts/shots.mjs` 的类型声明。
 *
 * 浏览器用例是 TypeScript，需要 import 这个 `.mjs` 里的截图函数；被拟人采集脚本（`.mjs`）使用时
 * 不需要声明，但类型检查挡不住未声明的模块，所以在脚本旁放一份声明。
 */

import type { Page } from '@playwright/test'

/** 当天的截图目录：`app/logs/<日期>/shots/<场景>/`，必要时创建。 */
export function shotDir(scenario: string, options?: { date?: string; packageRoot?: string }): string

/** 视口截图（页面级），跨平台，判定用它。 */
export function capturePage(page: Page, outPath: string): Promise<void>

/** 系统级整屏截图（含浏览器外框），目前只实现 macOS。 */
export function captureScreen(
  outPath: string,
  options?: { region?: string; format?: 'png' | 'jpg'; platform?: string },
): void
