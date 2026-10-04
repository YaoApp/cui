/* **服务地址**：桌面由用户填或选，**宿主持有**（跨重启还在）—— 地址不进产物（`15-platform.md` §4.2）。
 * 命令名与 Rust 的 `pub fn` 一字不差（见桌面仓 `plan/01-bridge-commands.md` §2）。
 *
 * `set` 是**先验证再写入**：宿主取一次 `<url>/.well-known/yao`，成功才落盘并清旧凭据；
 * **服务文档本身由应用自己读**（`platform/service/info.ts`，两宿主同一条路），这里那次只是校验。 */

import { invoke } from './invoke'

/** 命令名：与 `src-tauri/src/bridge/service.rs` 的 `pub fn` 同名。 */
export const SERVICE_COMMANDS = {
  get: 'celadon_service_get',
  set: 'celadon_service_set',
} as const

/** 当前服务地址；`url` 为空表示还没选过（不是错误）。 */
export type ServiceState = {
  url: string
}

export const service = {
  /** 读回当前地址（没选过是空串）。 */
  get: () => invoke<ServiceState>(SERVICE_COMMANDS.get),

  /** 写入地址：宿主先校验再落盘，换地址会清旧凭据。 */
  set: (url: string) => invoke<ServiceState>(SERVICE_COMMANDS.set, { url }),
}
