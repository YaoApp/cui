/* **凭据的键**（`15-platform.md` §4.2/§4.5）：一个服务一份账，服务按 **origin** 认 ——
 * 协议 + 域 + 端口，路径不计。所以 `https://a:5099` 与 `http://a:5099` 是两份账（改协议要重登一次），
 * 而 `https://a` 与 `https://a:443` 是同一份（默认端口不写出来）。
 *
 * 键 = `<origin>#<用途>`，**只在这里拼** —— 调用点不许自己拼（键不一致 = 静默读不到）。
 * 宿主侧不动凭据：`celadon_service_set` 换地址不删账（见 `15 §4.2`）。 */

import { serviceBase } from '../service'

/** 地址 → origin。空、或解析不了，回 `undefined`（不是空串 —— 没地址和"地址是空的"要分开）。 */
export function serviceOrigin(url?: string): string | undefined {
  const raw = (url ?? serviceBase()).trim()
  if (!raw) return undefined
  // 手输可能不带协议（`a:5099`）：不补的话 `new URL` 会把 `a` 当协议
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `http://${raw}`
  try {
    return new URL(withScheme).origin
  } catch {
    return undefined
  }
}

/** 当前服务下某个用途的凭据键；还没地址（Web，或桌面还没选服务）回 `undefined`。 */
export function credentialKey(purpose: string): string | undefined {
  const origin = serviceOrigin()
  return origin ? `${origin}#${purpose}` : undefined
}
