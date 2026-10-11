/* 窗口动作：无标题栏窗口的最小化、最大化与关闭。命令名按桥的约定 `celadon_<域>_<动词>`
   （见 architecture/15-platform.md §6）；宿主不在（Web）时 `invoke` 自己返回 `bridge.unavailable`，
   调用方不判环境。桌面壳侧的命令由 `celadon-desktop` 实现，窗口装饰与平台差异只在那边一处决定。 */
import { invoke } from './invoke'
import type { BridgeResult } from './result'

export const WINDOW_COMMANDS = {
  minimize: 'celadon_window_minimize',
  toggleMaximize: 'celadon_window_toggle_maximize',
  close: 'celadon_window_close',
  maximized: 'celadon_window_maximized',
} as const

export const windowChrome = {
  minimize: (): Promise<BridgeResult<null>> => invoke<null>(WINDOW_COMMANDS.minimize),
  /** 最大化与还原来回切，返回切换后的状态，用来换窗口键的图形 */
  toggleMaximize: (): Promise<BridgeResult<boolean>> =>
    invoke<boolean>(WINDOW_COMMANDS.toggleMaximize),
  close: (): Promise<BridgeResult<null>> => invoke<null>(WINDOW_COMMANDS.close),
  /** 当前是否最大化，窗口尺寸变化后读一次 */
  maximized: (): Promise<BridgeResult<boolean>> => invoke<boolean>(WINDOW_COMMANDS.maximized),
}
