/* **守卫**：框架内部（`__TAURI__` / `__TAURI_INTERNALS__`）只允许出现在 `platform/bridge/`。
 *
 * 依据 `15-platform.md` §5：宿主差异**只在这一层消化，不许渗到 feature**；调用方先问 `client/`。
 * 漏一次就会有人照着抄（本页曾经就有一处：feature 直接读框架内部）。 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const APP_SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../../')
const PATTERN = /__TAURI_INTERNALS__|__TAURI__/

function walk(dir: string, found: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, found)
    else if (/\.tsx?$/.test(name)) found.push(full)
  }
  return found
}

describe('the host internals stay in one place', () => {
  it('only platform/bridge mentions the framework globals', () => {
    const offenders = walk(APP_SRC)
      .filter((file) => !file.includes('/platform/bridge/'))       // 唯一允许的地方
      .filter((file) => !file.endsWith('.test.ts'))                 // 测试里可以桩宿主
      .filter((file) => PATTERN.test(readFileSync(file, 'utf8')))
      .map((file) => file.slice(APP_SRC.length + 1))
    expect(offenders).toEqual([])
  })
})
