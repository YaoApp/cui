/* **桥**：应用触碰宿主能力的**唯一入口**（与桌面壳的 `src/bridge/`、Rust 的 `src/bridge/` 一一对等）。
 *
 * 结构：
 *   result.ts   返回值形状（成功/失败 + 构造与判别）—— 上层不摸字段
 *   invoke.ts   调宿主的机制 —— 只有它碰宿主对象
 *   ping.ts     第一个命令（验证函数）
 *   service.ts  服务地址（宿主给地址，应用自己读服务文档）
 *   index.ts    公共面（其它层只从这里进）
 *
 * 规则（见 15-platform.md §6）：命令名 `celadon_<域>_<动词>` · Web 下不存在 · 失败是值 · 秘密不回前端。
 */

export * from './result'
export { bridgeErrorText, failureText } from './translate'
export { hasHost } from './invoke'
export { ping, PING_COMMAND, type HostStatus } from './ping'
export { credential, CREDENTIAL_COMMANDS, type CredentialMeta } from './credential'
export { system, SYSTEM_COMMANDS, type AppInfo } from './system'
export { service, SERVICE_COMMANDS, type ServiceState } from './service'
export { useHostStatus } from './use-host-status'

import { credential } from './credential'
import { system } from './system'
import { service } from './service'
import { ping } from './ping'

/** 公共面聚合：其它层写 `bridge.ping()`，不直接 import 命令文件。 */
export const bridge = { ping, credential, system, service }
