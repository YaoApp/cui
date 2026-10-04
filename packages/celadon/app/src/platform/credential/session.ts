/* **会话凭据的持有**（`15 §4.5` · §4.2）：出口每个请求都要**同步**拿到 `Authorization`，
 * 而 OS 凭据库是异步读 —— 所以这里存一份内存镜像（惰性读一次，写时同步）。
 *
 * **不判宿主**：载体是 Cookie 时（Web）这里全是空操作（Cookie 由浏览器与服务端管）；
 * 载体是 OS 凭据库时（桌面）才真读真写。键按服务 origin 分账（`scope.ts`）→ `<origin>#session`。 */

import { fail, ok, type BridgeResult } from '../bridge/result'
import { credential } from './index'
import { credentialKey } from './scope'

/** 用途名：一个服务下"登录态"这条凭据。 */
export const SESSION_PURPOSE = 'session'

let cached: string | undefined
let loaded = false
let refresher: (() => Promise<BridgeResult<string>>) | undefined
let refreshing: Promise<BridgeResult<string>> | undefined

const keyOfSession = (): string | undefined => credentialKey(SESSION_PURPOSE)

/** 读一次会话凭据（惰性 + 内存镜像）。Web 与"没选服务"都回"没有"，不是错误。 */
export async function loadSession(): Promise<BridgeResult<string | undefined>> {
  if (loaded) return ok(cached)
  loaded = true
  const name = keyOfSession()
  if (!name || !credential.managedByApp()) return ok(undefined)
  const result = await credential.read(name)
  if (!result.ok) return /no_entry/i.test(result.code) ? ok(undefined) : result
  cached = result.value
  return ok(cached)
}

/** 出口用：`Authorization` 的值（没登录回 `undefined` —— 就不带这个头）。 */
export function sessionAuthorization(): string | undefined {
  return cached ? `Bearer ${cached}` : undefined
}

/** 登录成功后记下令牌。Web 是空操作（服务端已下发 Cookie，不归应用存）。 */
export async function signIn(secret: string): Promise<BridgeResult<boolean>> {
  cached = secret
  loaded = true
  const name = keyOfSession()
  if (!name) return fail('credential.service_empty', 'no service address to key a credential', {})
  if (!credential.managedByApp()) return ok(true)
  const written = await credential.write(name, secret)
  if (!written.ok) cached = undefined
  return written
}

/** 退出：清内存 + 删这条凭据。**服务端的吊销由调用方先做**（`data/user` 的 `logout`）。 */
export async function signOut(): Promise<BridgeResult<boolean>> {
  cached = undefined
  loaded = true
  const name = keyOfSession()
  if (!name || !credential.managedByApp()) return ok(true)
  return credential.remove(name)
}

/** 忘记这台服务：把这个 origin 下的凭据**逐条删掉**（`<origin>#…`）。 */
export async function forgetService(): Promise<BridgeResult<number>> {
  cached = undefined
  const origin = credentialKey(SESSION_PURPOSE)?.split('#')[0]
  if (!origin || !credential.managedByApp()) return ok(0)
  const listed = await credential.list()
  if (!listed.ok) return listed
  let removed = 0
  for (const meta of listed.value) {
    if (!meta.service.startsWith(`${origin}#`)) continue
    const gone = await credential.remove(meta.service)
    if (gone.ok && gone.value) removed += 1
  }
  return ok(removed)
}

/** 出口用它做 401 续期重放：注入"怎么刷新"（刷新请求本身由数据层声明，平台不认 URL）。 */
export function setSessionRefresher(fn: (() => Promise<BridgeResult<string>>) | undefined): void {
  refresher = fn
}

/** 刷新一次（并发只发一次）；没有 refresher、或没登录，就回一条可读失败。 */
export function refreshSession(): Promise<BridgeResult<string>> {
  if (!refresher || !cached) return Promise.resolve(fail('credential.service_empty', 'no session to refresh', {}))
  refreshing ??= refresher().finally(() => {
    refreshing = undefined
  })
  return refreshing
}

/** 测试用：清内存镜像与注入的 refresher。 */
export function resetSession(): void {
  cached = undefined
  loaded = false
  refresher = undefined
  refreshing = undefined
}
