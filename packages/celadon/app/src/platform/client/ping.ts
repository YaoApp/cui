/* **客户端自述**（`platform/client/` 的第一个切片，见 plan/02-platform.md §2.1）。
   一件事：**回答"我是谁、宿主在不在"** —— Web 与桌面共用同一份答案形状，
   所以同一个界面在两边都能显示，差别只在宿主那一格。

   规则：
   · 宿主**存在性**先判（`__TAURI_INTERNALS__` / `__TAURI__`），不去猜命令是否可用
   · 宿主调用失败 = **值**，不抛：`host.available = false`
   · 只回"版本"这类**非敏感**信息；凭据永不经过这里 */

import { routerBasename } from '@/platform/router/basename'

export type ClientKind = 'web' | 'desktop'

export type HostInfo = {
  /** 宿主在不在（浏览器里恒为 false） */
  available: boolean
  /** 宿主版本；拿不到就是空串 */
  version: string
}

export type ClientInfo = {
  client: ClientKind
  /** 构建决定的命名空间（**原样取自 `routerBasename()`**，如 `/app`；根构建为空串） */
  namespace: string
  host: HostInfo
}

type TauriGlobal = {
  core?: { invoke?: (command: string, args?: Record<string, unknown>) => Promise<unknown> }
}

/** 宿主在不在。Tauri 2 把内部接口挂在 `__TAURI_INTERNALS__`；`withGlobalTauri` 时另有 `__TAURI__`。 */
function hasHost(): boolean {
  const scope = globalThis as { __TAURI_INTERNALS__?: unknown; __TAURI__?: unknown }
  return '__TAURI_INTERNALS__' in scope || '__TAURI__' in scope
}

const NO_HOST: HostInfo = { available: false, version: '' }

/** 问一次"我是谁"。**永不抛**：问不到就如实说问不到。 */
export async function ping(): Promise<ClientInfo> {
  // **命名空间只有一处来源**：`platform/router/basename.ts`（SPEC §4：Vite 的 base 与路由 basename 同值）。
  // 各层自己读环境就会造出第二个来源，两个值能不一致（见 00-principles 铁律 1）。
  const ns = routerBasename()
  if (!hasHost()) return { client: 'web', namespace: ns, host: NO_HOST }

  const invoke = (globalThis as { __TAURI__?: TauriGlobal }).__TAURI__?.core?.invoke
  if (!invoke) return { client: 'desktop', namespace: ns, host: NO_HOST }

  try {
    const status = (await invoke('celadon_host_status')) as { available?: unknown; version?: unknown } | undefined
    return {
      client: 'desktop',
      namespace: ns,
      host: { available: status?.available === true, version: typeof status?.version === 'string' ? status.version : '' },
    }
  } catch {
    // 宿主在，但命令没起来 / 被拒 —— 一样如实回"不可用"
    return { client: 'desktop', namespace: ns, host: NO_HOST }
  }
}
