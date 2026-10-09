/* **登录后的明确去向**（`next`）：分享链接、深链这类「本来想去哪」的地址。
 *
 * 只有守卫会写它；取值**只收应用内路径**（防开放重定向），流程页自己不能当去向，超长串丢掉。
 * 第三方登录时提供方只回到登记过的回跳地址，带不回我们的参数，所以发起之前把它暂存到
 * `sessionStorage`（按服务 origin 分账），回跳页读回、用掉、删掉（见 `plan/06-login.md` §5）。 */

import { sessionScope } from './session-marker'

/** 不能当去向的路径：入口流程页自己。 */
const PROCESS_PREFIXES = ['/login', '/register', '/auth/back', '/servers', '/welcome']
/** 去向的长度上限：正常地址远小于它，超长的按坏数据丢。 */
const MAX_LENGTH = 512
const STORAGE_KEY = 'celadon.next'

/** 校验并归一化一条 `next`：合法回应用内路径，否则 `undefined`。 */
export function validateNext(value: string | null | undefined): string | undefined {
  if (!value || value.length > MAX_LENGTH) return undefined
  if (!value.startsWith('/') || value.startsWith('//')) return undefined
  const path = value.split('?')[0]?.split('#')[0] ?? ''
  if (path.includes(':') || path.includes('\\')) return undefined
  /* 根地址不是去向：默认打开就是它，登录后按落点与欢迎页自己决定（见 `plan/06-login.md` §5） */
  if (path === '/') return undefined
  if (PROCESS_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return undefined
  return value
}

/** 从一段查询串里读 `next`（登录页、注册页与回跳页都可能带着它）。 */
export function readNext(search: string): string | undefined {
  try {
    return validateNext(new URLSearchParams(search).get('next'))
  } catch {
    return undefined
  }
}

/** 把 `next` 挂到一条路径上（登录 ↔ 注册 ↔ 第三方之间带着走）。 */
export function withNext(path: string, next: string | undefined): string {
  const target = validateNext(next)
  if (!target) return path
  return `${path}${path.includes('?') ? '&' : '?'}${new URLSearchParams({ next: target }).toString()}`
}

function storage(): Storage | undefined {
  try {
    return globalThis.sessionStorage
  } catch {
    return undefined
  }
}

/** 发起第三方登录之前暂存：回来时地址上不会带它。
 *  **没有明确去向也要写**（清掉上一次留下的），否则被中断的那次往返会把旧去向留给下一次登录。 */
export function stashNext(next: string | undefined): void {
  const scope = sessionScope()
  if (!scope) return
  const target = validateNext(next)
  try {
    const bag = JSON.parse(storage()?.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>
    if (!target) {
      delete bag[scope]
      storage()?.setItem(STORAGE_KEY, JSON.stringify(bag))
      return
    }
    storage()?.setItem(STORAGE_KEY, JSON.stringify({ ...bag, [scope]: target }))
  } catch {
    /* 存不住只是回来后没有明确去向，不打断登录 */
  }
}

/** 取回暂存的 `next` 并删掉（用一次就够）。 */
export function takeNext(): string | undefined {
  const scope = sessionScope()
  if (!scope) return undefined
  try {
    const bag = JSON.parse(storage()?.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>
    const target = validateNext(typeof bag[scope] === 'string' ? (bag[scope] as string) : undefined)
    delete bag[scope]
    storage()?.setItem(STORAGE_KEY, JSON.stringify(bag))
    return target
  } catch {
    return undefined
  }
}

/** 丢掉暂存（登录收尾已经用了别的去向，别再留着）。 */
export function forgetNext(): void {
  const scope = sessionScope()
  if (!scope) return
  try {
    const bag = JSON.parse(storage()?.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>
    delete bag[scope]
    storage()?.setItem(STORAGE_KEY, JSON.stringify(bag))
  } catch {
    /* 删不掉不影响流程 */
  }
}
