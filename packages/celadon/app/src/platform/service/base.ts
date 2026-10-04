/* **服务地址的唯一来源**（见 `17-transport.md` §2）：`transport/` 只负责拼，不负责定。
 *
 * 基址两处来源，按宿主选：
 *   · 构建期 `VITE_SERVICE_BASE`（同源部署/开发期，通常为空 → 相对路径）
 *   · **桌面：宿主持有**（`celadon_service_get`，见 `plan/01-bridge-commands.md` §2）——
 *     惰性取一次、存内存；Web 没有宿主，也就没有这一步。 */

import { bridge, hasHost } from '../bridge'

let hostedBase: string | undefined
let loaded = false

/** 桌面：问宿主要一次地址（惰性 + 内存缓存）；Web：什么都不做。取数前调一次即可。 */
export async function loadServiceBase(): Promise<string> {
  if (loaded) return serviceBase()
  loaded = true
  if (!hasHost()) return serviceBase()
  const result = await bridge.service.get()
  if (result.ok) hostedBase = result.value.url.replace(/\/+$/, '')
  return serviceBase()
}

/** 换了服务地址（`celadon_service_set` 之后）要丢掉缓存、重新取。 */
export function resetServiceBase(): void {
  hostedBase = undefined
  loaded = false
}

/** 基址：桌面用宿主给的（取回前为空 —— 与"同源"同一个意思），否则用构建期那个。 */
export function serviceBase(): string {
  if (hostedBase !== undefined) return hostedBase
  const raw = (import.meta.env?.VITE_SERVICE_BASE as string | undefined) ?? ''
  return raw.replace(/\/+$/, '')
}

/** 把路径拼成完整地址（基址为空时保持相对路径）。 */
export function serviceUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`
  const base = serviceBase()
  /* 有宿主基址（桌面）→ 基址 + 路径；否则**根相对** —— 引擎的根是站点根，
     与应用的命名空间无关（dev 由 dev server 代转，见 16-development.md §1）。 */
  return base ? `${base}${suffix}` : suffix
}
