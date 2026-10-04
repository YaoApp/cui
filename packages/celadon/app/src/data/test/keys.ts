/* **`test` 的 key 族**：一个域根 + 每接口一条，全部经 `keyOf` 算 —— 订阅与失效同一算法。
 *
 * 域根在前，所以 `invalidate(testKeys.all)` 命中本域全部接口；带查询参数的四条把参数并进路径，
 * 于是 key 也随参数变（同一接口不同页是两份数据）。 */

import { keyOf } from '../request'
import {
  createServerKey,
  listTeams,
  listUsers,
  loginToken,
  loginWeb,
  readCaptcha,
  readOtp,
} from './api'
import type { CaptchaLookup, OtpLookup, TeamListQuery, UserListQuery } from './types'

export const testKeys = {
  /** 族根：`invalidate(testKeys.all)` 命中本域每一条 */
  all: ['test'] as const,
  loginWeb: () => keyOf(loginWeb, [...testKeys.all, 'login-web']),
  loginToken: () => keyOf(loginToken, [...testKeys.all, 'login-token']),
  createServerKey: () => keyOf(createServerKey, [...testKeys.all, 'server-key']),
  listUsers: (query?: UserListQuery) => keyOf(listUsers(query), [...testKeys.all, 'users']),
  listTeams: (query?: TeamListQuery) => keyOf(listTeams(query), [...testKeys.all, 'teams']),
  readOtp: (query: OtpLookup) => keyOf(readOtp(query), [...testKeys.all, 'otp']),
  readCaptcha: (query: CaptchaLookup) => keyOf(readCaptcha(query), [...testKeys.all, 'captcha']),
}
