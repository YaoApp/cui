import { useAuthStore } from './auth.store'
import { forgetLanding } from './landing-record'
import { forgetNext } from './next'
import { forgetSession } from './session-marker'

/**
 * 退出登录时本机要忘掉的东西：登录标记 · 最后落点 · 待去的地址 · 内存里的用户信息。
 *
 * 只收拾本机记录；服务端的吊销与平台凭据的清理在 `logoutQuery()` 里（两条合起来才是一次退出）。
 * **不动服务器历史**（`celadon.servers`）：那是这台机器连过哪些服务器，与谁登录无关。
 * 退出的产品动作（`useSignOut()`）与会话失效的清理（`SessionExpiryGuard`）都走这里。
 * 开发面的验证页只探接口，它自己按 `logoutQuery()` 退，不动登录域的本机记录。
 */
export function clearLocalSession(): void {
  forgetSession()
  forgetLanding()
  forgetNext()
  useAuthStore.getState().reset()
}
