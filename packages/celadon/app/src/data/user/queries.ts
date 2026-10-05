/* **`user` 域的取数对**：把 key 与声明配成一对给调用方（`useRequest(query.request, { key: query.key })`）。
 *
 * 分两类：
 * - **读**（配置 · 验证码 · 公钥 · 跳转地址）：`{ key, request }`；
 * - **写/带临时令牌**（判定 · 注册 · 登录 · 重发验证码 · 邀请兑换 · 回调 · 设备码）：`{ key, operation }` ——
 *   与既有的 `logoutQuery` 同形。**临时令牌走 `headers`**（`request/send.ts` 的 `RequestOptions.headers`），
 *   它不进凭据库、不留在任何长期存储里（`15-platform.md` §4）。
 */

import { signOut } from '@/platform/credential'
import { send } from '../request/send'
import type { Result } from '../types'
import {
  deviceAuthorize,
  deviceFlowStart,
  deviceFlowToken,
  entryCaptcha,
  entryConfig,
  entryInvite,
  entryLogin,
  entryOtp,
  entryRegister,
  entryVerify,
  logout,
  oauthAuthorize,
  oauthCallback,
  oidcKeys,
} from './api'
import { userKeys } from './keys'
import type {
  DeviceAuthorizeRequest,
  DeviceAuthorizeResult,
  DeviceFlowTokenRequest,
  DeviceFlowTokenResult,
  EntryAuthResponse,
  EntryInviteRequest,
  EntryLoginRequest,
  EntryRegisterRequest,
  EntrySendOTPResponse,
  EntryVerifyRequest,
  EntryVerifyResponse,
  LogoutResult,
  OAuthCallbackRequest,
} from './types'

/** 临时令牌的请求头（下一步调用的凭据；调用完即弃，**不落任何存储**）。 */
function temporaryToken(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

/* ===== 读 ===== */

/** 入口配置。 */
export const entryConfigQuery = (locale?: string) => ({ key: userKeys.entryConfig(locale), request: entryConfig({ locale }) })

/** 图形/人机验证。 */
export const entryCaptchaQuery = (captchaId?: string) => ({ key: userKeys.entryCaptcha(captchaId), request: entryCaptcha({ captcha_id: captchaId }) })

/** 验签公钥集（ID Token）。 */
export const oidcKeysQuery = () => ({ key: userKeys.oidcKeys(), request: oidcKeys })

/** 第三方登录跳转地址。 */
export const oauthAuthorizeQuery = (id: string, redirectUri?: string) => ({
  key: userKeys.oauthAuthorize(id),
  request: oauthAuthorize(id, { redirect_uri: redirectUri }),
})

/* ===== 写 ===== */

/** 判定"登录还是注册"：返回临时令牌与下一步。 */
export const entryVerifyQuery = (input: EntryVerifyRequest): { key: readonly unknown[]; operation: () => Promise<Result<EntryVerifyResponse>> } => ({
  key: userKeys.entryVerify(),
  operation: () => send(entryVerify, { body: input }),
})

/** 注册（带临时令牌）。 */
export const entryRegisterQuery = (token: string, input: EntryRegisterRequest): { key: readonly unknown[]; operation: () => Promise<Result<EntryAuthResponse>> } => ({
  key: userKeys.entryRegister(),
  operation: () => send(entryRegister, { body: input, headers: temporaryToken(token) }),
})

/** 登录（带临时令牌）。 */
export const entryLoginQuery = (token: string, input: EntryLoginRequest): { key: readonly unknown[]; operation: () => Promise<Result<EntryAuthResponse>> } => ({
  key: userKeys.entryLogin(),
  operation: () => send(entryLogin, { body: input, headers: temporaryToken(token) }),
})

/** 重发验证码（带临时令牌）。 */
export const entryOtpQuery = (token: string, locale?: string): { key: readonly unknown[]; operation: () => Promise<Result<EntrySendOTPResponse>> } => ({
  key: userKeys.entryOtp(locale),
  operation: () => send(entryOtp({ locale }), { headers: temporaryToken(token) }),
})

/** 邀请码兑换（带 `invite_verification` 作用域的临时令牌）。 */
export const entryInviteQuery = (token: string, input: EntryInviteRequest): { key: readonly unknown[]; operation: () => Promise<Result<EntryAuthResponse>> } => ({
  key: userKeys.entryInvite(),
  operation: () => send(entryInvite, { body: input, headers: temporaryToken(token) }),
})

/** 第三方登录回调换取令牌族。 */
export const oauthCallbackQuery = (id: string, input: OAuthCallbackRequest): { key: readonly unknown[]; operation: () => Promise<Result<EntryAuthResponse>> } => ({
  key: userKeys.oauthCallback(id),
  operation: () => send(oauthCallback(id), { body: input }),
})

/** 设备授权页：确认用户码。 */
export const deviceAuthorizeQuery = (input: DeviceAuthorizeRequest): { key: readonly unknown[]; operation: () => Promise<Result<DeviceAuthorizeResult>> } => ({
  key: userKeys.deviceAuthorize(),
  operation: () => send(deviceAuthorize, { body: input }),
})

/** 发起设备码流。 */
export const deviceFlowStartQuery = (providerId: string) => ({
  key: userKeys.deviceFlowStart(providerId),
  request: deviceFlowStart(providerId),
})

/** 轮询设备码。 */
export const deviceFlowTokenQuery = (providerId: string, input: DeviceFlowTokenRequest): { key: readonly unknown[]; operation: () => Promise<Result<DeviceFlowTokenResult>> } => ({
  key: userKeys.deviceFlowToken(providerId),
  operation: () => send(deviceFlowToken(providerId), { body: input }),
})

/** 退出登录：服务端吊销 + 本机凭据按载体清理（沿用既有实现）。 */
export const logoutQuery = (): { key: readonly unknown[]; operation: () => Promise<Result<LogoutResult>> } => ({
  key: userKeys.logout(),
  operation: async () => {
    const result = await send(logout)
    if (!result.ok) return result
    const cleared = await signOut()
    return cleared.ok ? result : cleared
  },
})

