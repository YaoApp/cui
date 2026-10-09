/* **最后一次落点**：用户在应用里待过的最后一个地址，入口判定在「已登录且没有明确地址」时用它。
 *
 * 与登录标记同一个分账口径（按服务 origin），值只记一条，不是历史。只收应用内路径（含查询串）；
 * 读不出、坏数据、非应用内路径都当没有。写入点是产品外壳（`surface-layout`），入口页自己不记。 */

import { sessionScope } from './session-marker'

const STORAGE_KEY = 'celadon.landing'

export type LandingRecord = {
  /** 应用内路径，含查询串，例如 `/scaffold/base?q=alpha`。 */
  path: string
  /** 记下的时刻（Unix 毫秒）。 */
  at: number
}

type Bag = Record<string, LandingRecord>

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

/** 只收应用内路径：以单个 `/` 开头，且是路径加查询串（没有协议、没有主机）。
 *  **根地址不是落点**：它就是入口判定所在的那一页，记下来会在「根 ⇄ 入口判定」之间空转。 */
export function validLanding(value: string): boolean {
  if (!value.startsWith('/') || value.startsWith('//')) return false
  const path = value.split('?')[0] ?? ''
  if (path === '/') return false
  return !path.includes(':') && !path.includes('\\')
}

function readAll(): Bag {
  try {
    const raw = storage()?.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
    const bag = parsed as Record<string, unknown>
    const out: Bag = {}
    for (const [scope, value] of Object.entries(bag)) {
      if (!scope || typeof value !== 'object' || value === null) continue
      const record = value as Record<string, unknown>
      if (typeof record.path === 'string' && validLanding(record.path) && typeof record.at === 'number') {
        out[scope] = { path: record.path, at: record.at }
      }
    }
    return out
  } catch {
    return {}
  }
}

function writeAll(all: Bag): void {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    /* 记不住不算错：入口判定退回「没有落点」 */
  }
}

/** 这台服务的最后落点（应用内路径）；没有或坏数据回 `undefined`。 */
export function readLanding(): string | undefined {
  const scope = sessionScope()
  if (!scope) return undefined
  return readAll()[scope]?.path
}

/** 记下当前地址：只有应用内路径会记，其余（绝对地址、坏数据）丢掉。 */
export function rememberLanding(path: string, at = Date.now()): void {
  const scope = sessionScope()
  if (!scope || !validLanding(path)) return
  writeAll({ ...readAll(), [scope]: { path, at } })
}

/** 忘掉这台服务的最后落点：退出登录时清，下一位使用者不该被送到上一位的页面。 */
export function forgetLanding(): void {
  const scope = sessionScope()
  if (!scope) return
  const all = readAll()
  delete all[scope]
  writeAll(all)
}
