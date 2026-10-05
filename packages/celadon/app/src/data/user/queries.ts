/* **`user` 域的取数对**：把 key 与声明配成一对给调用方（`useRequest(query.request, { key: query.key })`）。
 *
 * 分两类：
 * - **读**（配置 · 验证码 · 公钥 · 跳转地址）：`{ key, request }`；
 * - **写/带临时令牌**（判定 · 注册 · 登录 · 重发验证码 · 邀请兑换 · 回调 · 设备码）：`{ key, operation }` ——
 *   与既有的 `logoutQuery` 同形。**临时令牌走 `headers`**（`request/send.ts` 的 `RequestOptions.headers`），
 *   它不进凭据库、不留在任何长期存储里（`15-platform.md` §4）。
 */

import { client } from '@/platform/client'
import { context } from '../request/context'
import type { Context } from '../request/context'
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

/* **具体接口的对接都在这层**：按业务的**参数组合**（语言只是其中一例，比如"中文 foo=123、日语 foo=678、
 *  其他 foo=cnm"这种按上下文算值的映射）与**返回值标准化**都在这里做；`send` 只负责把组合好的东西发出去。
 *
 *  语言：**只有 ctx 一个来源**（`localeOf()`），调用点无感。四个真读线上字段的接口才带它：
 *  `entryConfig`/`entryOtp` 的方言是 query（构造器参数），`entryVerify`/`entryRegister` 是 body（写进字段）；
 *  其余接口不读线上 locale，只认请求头，出口已统一带。罕见场景要指定语言，给 `send`/hook 传 `preferences`。 */
/** 上层传 ctx 时用它；直接调用（测试/脚本）没传才自建。 */
function localeOf(ctx?: Context): string {
  return ctx?.locale ?? context({ ...client.preferences }).locale
}

/** 临时令牌的请求头（下一步调用的凭据；调用完即弃，**不落任何存储**）。 */
function temporaryToken(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

/* ===== 读 ===== */

/** 入口配置。 */
export const entryConfigQuery = (ctx?: Context) => {
  /* 这条接口的方言是 **query**：下面一行就是"ctx → 请求"的转换，调用点看不到也不需要知道。 */
  const locale = localeOf(ctx)
  return { key: userKeys.entryConfig(locale), request: entryConfig({ locale }) }
}

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
export const entryVerifyQuery = (input: Omit<EntryVerifyRequest, 'locale'>): { key: readonly unknown[]; operation: () => Promise<Result<EntryVerifyResponse>> } => {
  /* 这条接口的方言是 **body**：ctx 的语言进 body.locale（服务端读它）*/
  return {
    key: userKeys.entryVerify(),
    operation: (_input?: void, passed?: Context) => send(entryVerify, { body: { ...input, locale: localeOf(passed) } }),
  }
}

/** 注册（带临时令牌）。 */
export const entryRegisterQuery = (token: string, input: Omit<EntryRegisterRequest, 'locale'>): { key: readonly unknown[]; operation: () => Promise<Result<EntryAuthResponse>> } => {
  /* 这条接口的方言是 **body**：ctx 的语言进 body.locale（服务端读它）*/
  const locale = localeOf()
  return {
  /* 方言是 **body**：ctx 的语言进 body.locale（服务端读它）*/
  key: userKeys.entryRegister(),
  operation: () => send(entryRegister, { body: { ...input, locale }, headers: temporaryToken(token) }),   // 服务端读 body.locale   // 方言：body
  }
}

/** 登录（带临时令牌）。 */
export const entryLoginQuery = (token: string, input: Omit<EntryLoginRequest, 'locale'>): { key: readonly unknown[]; operation: () => Promise<Result<EntryAuthResponse>> } => ({
  key: userKeys.entryLogin(),
  operation: () => send(entryLogin, { body: input, headers: temporaryToken(token) }),   // 方言：body
})

/** 重发验证码（带临时令牌）。 */
export const entryOtpQuery = (token: string): { key: readonly unknown[]; operation: () => Promise<Result<EntrySendOTPResponse>> } => ({
  key: userKeys.entryOtp(localeOf()),
  /* 方言同样是 query */
  operation: (_input?: void, passed?: Context) => send(entryOtp({ locale: localeOf(passed) }), { headers: temporaryToken(token) }),
})

/** 邀请码兑换（带 `invite_verification` 作用域的临时令牌）。 */
export const entryInviteQuery = (token: string, input: Omit<EntryInviteRequest, 'locale'>): { key: readonly unknown[]; operation: () => Promise<Result<EntryAuthResponse>> } => ({
  key: userKeys.entryInvite(),
  operation: () => send(entryInvite, { body: input, headers: temporaryToken(token) }),   // 方言：body
})

/** 第三方登录回调换取令牌族。 */
export const oauthCallbackQuery = (id: string, input: Omit<OAuthCallbackRequest, 'locale'>): { key: readonly unknown[]; operation: () => Promise<Result<EntryAuthResponse>> } => ({
  key: userKeys.oauthCallback(id),
  operation: () => send(oauthCallback(id), { body: input }),   // 方言：body
})

/** 设备授权页：确认用户码。 */
export const deviceAuthorizeQuery = (input: DeviceAuthorizeRequest): { key: readonly unknown[]; operation: () => Promise<Result<DeviceAuthorizeResult>> } => ({
  key: userKeys.deviceAuthorize(),
  operation: () => send(deviceAuthorize, { body: input }),   // 该接口只认 user_code，不塞 locale
})

/** 发起设备码流。 */
export const deviceFlowStartQuery = (providerId: string) => ({
  key: userKeys.deviceFlowStart(providerId),
  request: deviceFlowStart(providerId),
})

/** 轮询设备码。 */
export const deviceFlowTokenQuery = (providerId: string, input: Omit<DeviceFlowTokenRequest, 'locale'>): { key: readonly unknown[]; operation: () => Promise<Result<DeviceFlowTokenResult>> } => ({
  key: userKeys.deviceFlowToken(providerId),
  operation: () => send(deviceFlowToken(providerId), { body: input }),   // 方言：body
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

