/* **本机登录标记**：入口判定用的一句「这台服务器上登录过」，**不是授权依据**。
 *
 * 按**服务 origin 分账**（桌面可以记过几台服务器，各记各的），值是一笔时间戳；读不出、坏数据、
 * 没有存储都当没有。真正的会话凭据在 `platform/credential`（桌面是系统凭据库，Web 是 Cookie），
 * 两者互不代替：标记只决定首屏往哪跳，过期与否由接口的 401 裁决（见 `plan/06-login.md` §5）。 */

import { serviceBase } from '@/platform/service'

const STORAGE_KEY = 'celadon.session'

/** 分账用的键：桌面用宿主给的服务地址，Web 用站点自身的来源。 */
export function sessionScope(): string {
  const base = serviceBase()
  if (base) {
    try {
      return new URL(base).origin
    } catch {
      return base
    }
  }
  return globalThis.location?.origin ?? ''
}

type Marker = Record<string, number>

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

function readAll(): Marker {
  try {
    const raw = storage()?.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
    const bag = parsed as Record<string, unknown>
    const out: Marker = {}
    for (const [scope, value] of Object.entries(bag)) {
      if (scope && typeof value === 'number' && Number.isFinite(value)) out[scope] = value
    }
    return out
  } catch {
    return {}
  }
}

/** 写一次全部标记；写不进去回 `false`（调用方据此决定要不要留内存兜底）。 */
function writeAll(all: Marker): boolean {
  try {
    const store = storage()
    if (!store) return false
    store.setItem(STORAGE_KEY, JSON.stringify(all))
    return true
  } catch {
    return false
  }
}

/** 存储写不进去时的本次打开内兜底：这一次打开里仍按「已登录」走，
 *  否则登录成功那一刻就会被自己的守卫弹回登录页。刷新后没有持久标记，按未登录处理。 */
const volatile = new Set<string>()

/** 这台服务有没有登录标记。 */
export function signedIn(): boolean {
  const scope = sessionScope()
  if (scope === '') return false
  return volatile.has(scope) || readAll()[scope] !== undefined
}

/** 登录成功（含第三方回跳）：记一笔。 */
export function rememberSession(at = Date.now()): void {
  const scope = sessionScope()
  if (!scope) return
  if (writeAll({ ...readAll(), [scope]: at })) volatile.delete(scope)
  else volatile.add(scope)
}

/** 退出或会话失效：只清这台服务的标记，别的服务器各记各的。 */
export function forgetSession(): void {
  const scope = sessionScope()
  if (!scope) return
  volatile.delete(scope)
  const all = readAll()
  delete all[scope]
  writeAll(all)
}
