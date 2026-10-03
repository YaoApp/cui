/* **`ping`：桥的第一个命令（验证函数）** —— 对应 Rust 的 `src/bridge/ping.rs`。
 *
 * 它回答："宿主在吗、是什么版本、哪些命令注册了"。前端**只凭它判断桥通不通**，
 * 其余命令都应当能在它不可用时降级，所以它必须是桥里最简单、最不可能失败的一条。 */

import { invoke } from './invoke'
import type { BridgeResult } from './result'

/** 宿主自述（`celadon_ping` 的返回值）。 */
export type HostStatus = {
  available: boolean
  version: string
  commands: Record<string, boolean>
}

/** 命令名与 Rust 侧一字不差（`#[tauri::command] pub fn celadon_ping`）。 */
export const PING_COMMAND = 'celadon_ping'

export function ping(): Promise<BridgeResult<HostStatus>> {
  return invoke<HostStatus>(PING_COMMAND)
}
