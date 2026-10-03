/* **客户端自述**（`platform/client/` 的第一个切片，见 plan/02-platform.md §2.1）。
   一件事：**回答"我是谁、宿主在不在"** —— Web 与桌面共用同一份答案形状，
   所以同一个界面在两边都能显示，差别只在宿主那一格。

   规则：
   · 宿主调用**不在这里**：一律经 `platform/bridge/`（15 §6：桌面能力只在 bridge 实现）
   · 宿主调用失败 = **值**，不抛：`host.available = false`
   · 只回"版本"这类**非敏感**信息；凭据永不经过这里 */

import { bridge, hasHost } from '@/platform/bridge'
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


/** 问一次"我是谁"。**永不抛**：问不到就如实说问不到。 */
export async function ping(): Promise<ClientInfo> {
  // 三件事各有**唯一来源**：命名空间问 router（铁律 1）、宿主状态问 bridge（15 §6）、客户端类型由桥的在否决定。
  const namespace = routerBasename()
  const client: ClientKind = hasHost() ? 'desktop' : 'web'
  const result = await bridge.ping()
  return {
    client,
    namespace,
    host: result.ok
      ? { available: result.value.available === true, version: result.value.version ?? '' }
      : { available: false, version: '' },
  }
}
