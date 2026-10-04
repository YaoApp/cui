import { credentialCarrier } from '@/platform/credential'
import type { Request } from '@/data/request/send'
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

/** **统一的登录动作**：怎么登录由数据层决定 —— 凭据由本机持有时走回令牌的那条端点，
 *  否则走服务端写 Cookie 的那条。业务层只认识"登录"，不认识端点与令牌。 */
export const loginQuery = (): { key: readonly unknown[]; request: Request<LoginAttempt, LoginResult> } =>
  credentialCarrier() === 'os-store'
    ? { key: testKeys.loginToken(), request: loginToken }
    : { key: testKeys.loginWeb(), request: loginWeb }
