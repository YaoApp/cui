import { keyOf } from '../request'
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

/** `user` 域的 key（订阅与失效共用同一算法，见 `request/invalidate.ts`）。
 *  key 由**声明 + 参数**算出来：同一接口不同参数是不同 key —— 调用点不必自己拼。 */
export const userKeys = {
  all: ['user'] as const,
  logout: () => keyOf(logout, [...userKeys.all, 'logout']),
  entryConfig: () => keyOf(entryConfig, [...userKeys.all, 'entry', 'config']),
  entryCaptcha: (captchaId?: string) => keyOf(entryCaptcha({ captcha_id: captchaId }), [...userKeys.all, 'entry', 'captcha', captchaId ?? '']),
  entryVerify: () => keyOf(entryVerify, [...userKeys.all, 'entry', 'verify']),
  entryRegister: () => keyOf(entryRegister, [...userKeys.all, 'entry', 'register']),
  entryLogin: () => keyOf(entryLogin, [...userKeys.all, 'entry', 'login']),
  entryOtp: () => keyOf(entryOtp, [...userKeys.all, 'entry', 'otp']),
  entryInvite: () => keyOf(entryInvite, [...userKeys.all, 'entry', 'invite']),
  oauthAuthorize: (id: string) => keyOf(oauthAuthorize(id), [...userKeys.all, 'oauth', id, 'authorize']),
  oauthCallback: (id: string) => keyOf(oauthCallback(id), [...userKeys.all, 'oauth', id, 'callback']),
  deviceAuthorize: () => keyOf(deviceAuthorize, [...userKeys.all, 'device', 'authorize']),
  deviceFlowStart: (providerId: string) => keyOf(deviceFlowStart(providerId), [...userKeys.all, 'device', providerId, 'start']),
  deviceFlowToken: (providerId: string) => keyOf(deviceFlowToken(providerId), [...userKeys.all, 'device', providerId, 'token']),
  oidcKeys: () => keyOf(oidcKeys, [...userKeys.all, 'oidc', 'keys']),
}
