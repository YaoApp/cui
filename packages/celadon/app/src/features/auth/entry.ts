/* **入口判定**：打开应用时去哪，一处纯函数（`plan/06-login.md` §5）。
 *
 * 只看本机信号，因此首屏不产生接口请求：宿主有没有服务地址、本机登录标记、最后落点，
 * 外加一个留给后续逻辑的 `ready`（将来判「这个人该不该先去别处」用，现在恒真）。 */

import type { AuthMode } from './components/auth-layout'
import { withMode } from './use-auth-mode'

export type EntrySignals = {
  /** 桌面且宿主还没给服务地址：先去选服务器页。Web 恒为 `false`。 */
  needsServer: boolean
  /** 形态：客户端内一律 `in-app`，Web 只看地址上的标记。 */
  mode: AuthMode
  /** 本机登录标记。 */
  signedIn: boolean
  /** 最后落点（应用内路径），没有就是 `undefined`。 */
  landing?: string
  /** 后续逻辑的接缝：为假时先去 `/welcome`（现在恒真）。 */
  ready: boolean
}

/** 判定结果是一条应用内路径；`/login` 与 `/welcome` 会带上当前形态。 */
export function resolveEntry(signals: EntrySignals): string {
  if (signals.needsServer) return '/servers'
  if (!signals.signedIn) return withMode('/login', signals.mode)
  if (!signals.ready) return withMode('/welcome', signals.mode)
  return signals.landing ?? withMode('/welcome', signals.mode)
}
