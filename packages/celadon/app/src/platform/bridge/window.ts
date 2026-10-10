/* 窗口动作：无标题栏窗口的最小化与关闭。命令名按桥的约定 `celadon_<域>_<动词>`
   （见 architecture/15-platform.md §6）；宿主不在（Web）时 `invoke` 自己返回 `bridge.unavailable`，
   调用方不判环境。桌面壳侧的命令由 `celadon-desktop` 实现。 */
import { invoke } from './invoke'
import type { BridgeResult } from './result'

export const WINDOW_COMMANDS = {
  minimize: 'celadon_window_minimize',
  close: 'celadon_window_close',
} as const

export const windowChrome = {
  minimize: (): Promise<BridgeResult<null>> => invoke<null>(WINDOW_COMMANDS.minimize),
  close: (): Promise<BridgeResult<null>> => invoke<null>(WINDOW_COMMANDS.close),
}
