/* 引擎「测试模式」的七条接口声明（源码调研，不再自挖）。
 *
 * **这里只有声明**（方法 · 路径 · 进出类型）；key 在 `keys.ts`，把两者配成一对在 `queries.ts`。
 * 全部免鉴权，只在开发实例上注册；响应头带 `X-Test-Mode: true`。
 *
 * GET 的四条是**函数**而不是常量：查询参数（分页 · user_id · code · id）只能并进路径 ——
 * `useRequest` 的选项里没有 `query`，参数化由域层在这里收口，调用方不必自己拼地址。
 */

import type { Request } from '../request'
import type {
  CaptchaAnswer,
  CaptchaLookup,
  LoginAttempt,
  LoginResult,
  OtpLookup,
  OtpPayload,
  ServerKey,
  ServerKeyRequest,
  TeamListQuery,
  TestTeam,
  TestUserPage,
  UserListQuery,
} from './types'

/** 把域查询并进路径，`undefined` 的项不出现（地址前缀与请求元数据由 `send()` 拼）。 */
function withQuery(path: string, query: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [name, value] of Object.entries(query)) if (value !== undefined) search.set(name, String(value))
  const text = search.toString()
  return text ? `${path}?${text}` : path
}

/** 测试登录（下发 3 个 HttpOnly Cookie）。 */
export const loginWeb: Request<LoginAttempt, LoginResult> = { method: 'POST', path: '/test/login/web', session: 'adopt' }
/** 测试登录（回同样的形状，但**不下发 Cookie**）。 */
export const loginToken: Request<LoginAttempt, LoginResult> = { method: 'POST', path: '/test/login/token', session: 'adopt' }
/** 建服务端密钥（`key` 只显示一次）。 */
export const createServerKey: Request<ServerKeyRequest, ServerKey> = { method: 'POST', path: '/test/server-key' }

/** 用户分页列表。 */
export const listUsers = (query: UserListQuery = {}): Request<void, TestUserPage> => ({
  method: 'GET',
  path: withQuery('/test/users', { page: query.page, pagesize: query.pagesize, status: query.status }),
})

/** 团队列表（可按 `user_id` 过滤）。 */
export const listTeams = (query: TeamListQuery = {}): Request<void, TestTeam[]> => ({
  method: 'GET',
  path: withQuery('/test/teams', { user_id: query.user_id }),
})

/** 读一次性口令（**不消费**它）。 */
export const readOtp = (query: OtpLookup): Request<void, OtpPayload> => ({
  method: 'GET',
  path: withQuery('/test/otp', { code: query.code }),
})

/** 读图形验证码的答案。 */
export const readCaptcha = (query: CaptchaLookup): Request<void, CaptchaAnswer> => ({
  method: 'GET',
  path: withQuery('/test/captcha', { id: query.id }),
})
