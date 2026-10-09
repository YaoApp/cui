/* **会话失效事件**：出口在带身份的请求上收到 401 时发一条，由上层（登录域）决定清状态与跳登录页。
 *
 * 平台层只发事件，不认识领域代码（`03-boundaries.md`）。**入口类接口的 401 不发**：
 * 登录、注册、判定、验证码、公钥与第三方授权这几类本来就在未登录状态下发出，
 * 它们在传输层被排除，免得把用户正在填的登录页打断（见 `plan/06-login.md` §5）。 */

type Listener = () => void

const listeners = new Set<Listener>()

/** 入口类接口的路径**结尾**（不带基址，接口根由部署的 well-known 决定）。
 *  **设备授权页的 `/oauth/device/authorize` 不在内**：它是已登录的人批准设备时调的。 */
const ENTRY_SUFFIXES = ['/user/entry', '/user/oauth', '/oauth/jwks']

/** 这条请求是不是「未登录时本来就会发」的入口类接口。 */
export function isEntryRequest(input: RequestInfo | URL | string): boolean {
  const raw = typeof input === 'string' ? input : String(input)
  try {
    const path = new URL(raw, 'http://entry.local/').pathname
    return ENTRY_SUFFIXES.some((suffix) => path === suffix || path.endsWith(suffix) || path.includes(`${suffix}/`))
  } catch {
    return false
  }
}

/** 订一条；返回退订函数。 */
export function onUnauthorized(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 发一条（出口收到 401 时调）。 */
export function emitUnauthorized(): void {
  for (const listener of [...listeners]) listener()
}
