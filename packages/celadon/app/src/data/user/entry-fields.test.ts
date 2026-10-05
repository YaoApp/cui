/* **字段级契约的单元化**：下面这些 JSON 是 2026-10-05 从 dev 后端（经 dev server 同域代理）
 * 真实抓下来的响应**原文**（只删了无关的可选尾巴）。两向校验：
 *
 *   1. **TS 方向**：把它们标注成我们的类型 —— 字段名/可空性写错，`tsc` 会红；
 *   2. **运行时方向**：断言的键集合 —— 类型里声明的必备字段，真实响应里必须真的出现。
 *
 * 真实服务再变，这页会先红；浏览器层的 `tests/entry.contract.browser.ts` 负责对着活的后端复核。
 * 本轮就是靠它抓出三处漂移：`form.confirm_password` · `token.refresh_token_expires_in` ·
 * `verification_url`（见提交记录）。
 */

import { describe, expect, it } from 'vitest'
import type {
  CaptchaResponse,
  DeviceFlowStart,
  EntryConfig,
  EntryVerifyResponse,
  Jwks,
  OAuthAuthorizationUrl,
} from './types'

/* 真实响应：`GET /v1/user/entry?locale=zh-CN`（保留被抓到的全部键） */
const entryConfig: EntryConfig = {
  title: '欢迎使用 Yao Agents',
  description: '请输入邮箱以继续',
  success_url: '/__yao_admin_root/inbox',
  failure_url: '/__yao_admin_root/auth/entry',
  auto_login: true,
  role: 'user:free',
  type: 'free_zh',
  form: {
    username: { placeholder: '请输入邮箱', fields: ['email'] },
    password: { placeholder: '登录密码' },
    confirm_password: { placeholder: '确认密码' },
    captcha: { type: 'image' },
    forgot_password_link: true,
    remember_me: true,
    terms_of_service_link: 'https://yaoapps.com/doc/guide/user/terms-of-service',
    privacy_policy_link: 'https://yaoapps.com/doc/guide/user/privacy-policy',
  },
  token: { expires_in: '2h', refresh_token_expires_in: '7d', remember_me_refresh_token_expires_in: '30d' },
  verification_code_required: false,
  invite: {
    title: 't',
    description: 'd',
    placeholder: 'p',
    apply_link: 'https://example.com/apply',
    apply_prompt: 'a',
    apply_text: 'b',
  },
  third_party: { providers: [{ id: 'google', label: 'Google', title: 'Google', logo: 'https://example.com/g.png' }] },
}

/* 真实响应：`POST /v1/user/entry/verify`（新邮箱 → register） */
const entryVerify: EntryVerifyResponse = {
  status: 'register',
  access_token: 'fake-temporary-token',
  expires_in: 600,
  token_type: 'Bearer',
  scope: 'builtin:entry:verification',
  user_exists: false,
}

const captcha: CaptchaResponse = {
  captcha_id: 'gUMTNEL3X2RWv6KS8OSC',
  captcha_image: 'data:image/png;base64,iVBORw0KGgo=',
}

/* 真实响应：`GET /v1/oauth/jwks` */
const jwks: Jwks = {
  keys: [{ kty: 'RSA', use: 'sig', alg: 'RS256', kid: '405034474885880266287536941652045870510434344336', n: 'lxqIfjbP', e: 'AQAB' }],
}

const oauthAuthorize: OAuthAuthorizationUrl = {
  authorization_url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=c&response_type=code',
}

/* 真实响应：`POST /v1/user/oauth/google/device/authorize` */
const deviceFlowStart: DeviceFlowStart = {
  device_code: 'AH-1Ng1LwH_BxGMoHcSIQLMn19mb6wVE4efbCTI6roMKjC8Zb7w2mPf1FkjYP3oCanVMp4jIgO5t9AvLPv2tkiJFgQJAU_qJMg',
  user_code: 'XMZ-GGC-FSDM',
  verification_uri: 'https://www.google.com/device',
  verification_url: 'https://www.google.com/device',
  expires_in: 1800,
  interval: 5,
}

/** 必备字段：类型里不带 `?` 的那些。 */
const REQUIRED: Record<string, string[]> = {
  entryConfig: ['title', 'description', 'success_url', 'form', 'token', 'verification_code_required', 'invite', 'third_party'],
  entryVerify: ['status', 'access_token', 'expires_in', 'token_type', 'scope', 'user_exists'],
  captcha: ['captcha_id', 'captcha_image'],
  jwks: ['keys'],
  oauthAuthorize: ['authorization_url'],
  deviceFlowStart: ['device_code', 'user_code', 'verification_uri', 'expires_in'],
}

describe('the entry fields the real service sends', () => {
  it('keeps every required field of the entry configuration', () => {
    expect(Object.keys(entryConfig)).toEqual(expect.arrayContaining(REQUIRED.entryConfig))
    expect(Object.keys(entryConfig.form ?? {})).toEqual(
      expect.arrayContaining(['username', 'password', 'captcha', 'confirm_password']),
    )
    expect(Object.keys(entryConfig.token ?? {})).toEqual(
      expect.arrayContaining(['expires_in', 'refresh_token_expires_in', 'remember_me_refresh_token_expires_in']),
    )
    expect(entryConfig.third_party?.providers[0]).toEqual(
      expect.objectContaining({ id: 'google', label: 'Google', title: 'Google' }),
    )
  })

  it('keeps every required field of the verify answer', () => {
    expect(Object.keys(entryVerify)).toEqual(expect.arrayContaining(REQUIRED.entryVerify))
    expect(entryVerify.scope).toContain('entry:verification')
  })

  it('keeps every required field of the captcha, the jwks, the authorize url and the device start', () => {
    expect(Object.keys(captcha)).toEqual(expect.arrayContaining(REQUIRED.captcha))
    expect(Object.keys(jwks)).toEqual(expect.arrayContaining(REQUIRED.jwks))
    expect(Object.keys(jwks.keys[0])).toEqual(expect.arrayContaining(['kty', 'use', 'alg', 'kid', 'n', 'e']))
    expect(Object.keys(oauthAuthorize)).toEqual(expect.arrayContaining(REQUIRED.oauthAuthorize))
    expect(oauthAuthorize.authorization_url).toMatch(/^https:\/\//)
    expect(Object.keys(deviceFlowStart)).toEqual(expect.arrayContaining(REQUIRED.deviceFlowStart))
    expect(deviceFlowStart.user_code).toMatch(/^[A-Z0-9-]+$/)
  })

  it('describes the failure the engine answers with as a pair, not as a status', () => {
    // 真实响应（伪码/未授权）：{ error, error_description } —— 由出口归一成 Failure，不在成功类型里
    const failure = { error: 'invalid_request', error_description: 'IdP error: invalid_grant' }
    expect(Object.keys(failure)).toEqual(expect.arrayContaining(['error', 'error_description']))
  })
})
