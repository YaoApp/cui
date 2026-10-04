import { credentialCarrier } from '@/platform/credential'
import { signIn } from '@/platform/credential'
import { send } from '@/data/request/send'
import { keyOf } from '@/data/request/invalidate'
import type { Result } from '@/data/types'
import type { LoginAttempt, LoginResult } from './types'
/* **`test` 的 query 收口**：一行一个接口，把 key 与声明配成一对给调用方。
 *
 * 只在需要策略 / 参数时写，`api.ts` 仍只负责声明（不含 key）。取数时把这一对交给 `useRequest`：
 * `useRequest(query.request, { key: query.key, ... })`；失效时用同一个 `query.key`。
 * 带参数的接口在这里收参数 —— feature 只管调工厂，不碰地址。 */

import {
  createServerKey,
  listTeams,
  listUsers,
  loginToken,
  loginWeb,
  readCaptcha,
  readOtp,
} from './api'
import { testKeys } from './keys'
import type { CaptchaLookup, OtpLookup, TeamListQuery, UserListQuery } from './types'

export const loginWebQuery = () => ({ key: testKeys.loginWeb(), request: loginWeb })
export const loginTokenQuery = () => ({ key: testKeys.loginToken(), request: loginToken })
export const createServerKeyQuery = () => ({ key: testKeys.createServerKey(), request: createServerKey })
export const listUsersQuery = (query?: UserListQuery) => ({
  key: testKeys.listUsers(query),
  request: listUsers(query),
})
export const listTeamsQuery = (query?: TeamListQuery) => ({
  key: testKeys.listTeams(query),
  request: listTeams(query),
})
export const readOtpQuery = (query: OtpLookup) => ({ key: testKeys.readOtp(query), request: readOtp(query) })
export const readCaptchaQuery = (query: CaptchaLookup) => ({
  key: testKeys.readCaptcha(query),
  request: readCaptcha(query),
})

/** **应用的登录**：怎么登录由数据层决定 —— 按凭据载体选端点；成功后把响应体交给平台收令牌
 *  （平台按载体判：本机存凭据就存，Cookie 载体什么都不做）。业务层只认识"登录"这一个动作。 */
export const loginQuery = (): { key: readonly unknown[]; operation: (input?: LoginAttempt) => Promise<Result<LoginResult>> } => {
  const request = credentialCarrier() === 'os-store' ? loginToken : loginWeb
  return {
    key: keyOf(request),
    operation: async (input) => {
      const result = await send(request, input === undefined ? {} : { body: input })
      if (result.ok) await signIn(result.value)
      return result
    },
  }
}
