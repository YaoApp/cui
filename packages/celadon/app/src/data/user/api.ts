/* **`user` 域**：引擎的登录态接口（登录/注册入口一线 · 第三方登录 · 设备码 · 验签公钥）。
 *
 * 这里**只有声明**（方法 · 路径 · 进出类型）：基址 · 鉴权 · 错误归一都在 `platform/transport/`（`05 §1`）。
 * 两步登录的**临时令牌**由调用方经 `RequestOptions.headers` 传（`request/send.ts` 已为此留位）——
 * 它是每次调用才有的值，**不进声明**。
 */

import type { Request } from '../request'
import type {
  CaptchaResponse,
  DeviceAuthorizeRequest,
  DeviceAuthorizeResult,
  DeviceFlowStart,
  DeviceFlowTokenRequest,
  DeviceFlowTokenResult,
  EntryAuthResponse,
  EntryConfig,
  EntryInviteRequest,
  EntryLoginRequest,
  EntryRegisterRequest,
  EntrySendOTPResponse,
  EntryVerifyRequest,
  EntryVerifyResponse,
  Jwks,
  LogoutResult,
  OAuthAuthorizationUrl,
  OAuthAuthorizeQuery,
  OAuthCallbackRequest,
} from './types'

/** 把域查询并进路径（`useRequest` 的选项里没有 `query`，参数化在域层收口 —— 与 `test` 域同一做法）。 */
function withQuery(path: string, query: Record<string, string | undefined>): string {
  const search = new URLSearchParams()
  for (const [name, value] of Object.entries(query)) if (value !== undefined && value !== '') search.set(name, value)
  const text = search.toString()
  return text ? `${path}?${text}` : path
}

/** `GET /user/entry`：入口配置（标题 · 表单 · 验证码 · 第三方 · 邀请）。
 *  **语言不在这里传**：`send()` 按 ctx 自动带 query `locale`/`accept` 与头 `Accept-Language`/`X-Locale`
 *  （登录相关接口只认头，不读 query —— `request/context.ts` 有出处）。 */
export const entryConfig: Request<void, EntryConfig> = { method: 'GET', path: '/user/entry' }

/** `POST /user/entry/verify`：判定登录还是注册，返回**临时令牌**。 */
export const entryVerify: Request<EntryVerifyRequest, EntryVerifyResponse> = {
  method: 'POST',
  path: '/user/entry/verify',
}

/** `POST /user/entry/register`：注册（需临时令牌，调用时经 `headers` 传）。 */
export const entryRegister: Request<EntryRegisterRequest, EntryAuthResponse> = {
  method: 'POST',
  path: '/user/entry/register',
}

/** `POST /user/entry/login`：登录（需临时令牌）。 */
export const entryLogin: Request<EntryLoginRequest, EntryAuthResponse> = {
  method: 'POST',
  path: '/user/entry/login',
}

/** `POST /user/entry/otp`：重发验证码（需临时令牌）。语言同上，由 ctx 带。 */
export const entryOtp: Request<void, EntrySendOTPResponse> = { method: 'POST', path: '/user/entry/otp' }

/** `GET /user/entry/captcha`：图形或人机验证；带 `captcha_id` 时取同一张的下一态。 */
export const entryCaptcha = (query: { captcha_id?: string } = {}): Request<void, CaptchaResponse> => ({
  method: 'GET',
  path: withQuery('/user/entry/captcha', { captcha_id: query.captcha_id }),
})

/** `POST /user/entry/invite/verify`：邀请码校验与兑换（需带 `invite_verification` 作用域的临时令牌）。 */
export const entryInvite: Request<EntryInviteRequest, EntryAuthResponse> = {
  method: 'POST',
  path: '/user/entry/invite/verify',
}

/** `GET /user/oauth/:id/authorize`：拿第三方登录的跳转地址。 */
export const oauthAuthorize = (id: string, query: OAuthAuthorizeQuery = {}): Request<void, OAuthAuthorizationUrl> => ({
  method: 'GET',
  path: withQuery(`/user/oauth/${id}/authorize`, { redirect_uri: query.redirect_uri }),
})

/** `POST /user/oauth/:id/callback`：用回调带回的 `code`/`state` 换取令牌族。 */
export const oauthCallback = (id: string): Request<OAuthCallbackRequest, EntryAuthResponse> => ({
  method: 'POST',
  path: `/user/oauth/${id}/callback`,
})

/** `POST /oauth/device/authorize`：**已登录**用户在设备授权页确认用户码。 */
export const deviceAuthorize: Request<DeviceAuthorizeRequest, DeviceAuthorizeResult> = {
  method: 'POST',
  path: '/oauth/device/authorize',
}

/** `POST /user/oauth/:providerId/device/authorize`：发起设备码流（桌面端没有回调地址时用）。 */
export const deviceFlowStart = (providerId: string): Request<void, DeviceFlowStart> => ({
  method: 'POST',
  path: `/user/oauth/${providerId}/device/authorize`,
})

/** `POST /user/oauth/:providerId/device/token`：轮询设备码；`pending` 继续等，`success` 拿令牌族。 */
export const deviceFlowToken = (providerId: string): Request<DeviceFlowTokenRequest, DeviceFlowTokenResult> => ({
  method: 'POST',
  path: `/user/oauth/${providerId}/device/token`,
})

/** `GET /oauth/jwks`：**验 ID Token 用的公钥集**（§5 已定：客户端验签）。 */
export const oidcKeys: Request<void, Jwks> = { method: 'GET', path: '/oauth/jwks' }

/** `POST /user/logout`：服务端吊销令牌并清认证 Cookie（本机凭据的清理见 `queries.ts`）。 */
export const logout: Request<void, LogoutResult> = { method: 'POST', path: '/user/logout' }
