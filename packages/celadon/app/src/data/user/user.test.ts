import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/service', () => ({
  serviceBase: () => '',
  endpoint: (path: string) => `/v1${path}`,
  loadServiceInfo: async () => ({ ok: true, value: { name: 'y', version: '1', openapi: '/v1' } }),
}))

/** `send` 与 `signOut` 在这里只作为**边界**被观察：断言"传了什么"，不重跑传输层（它有自己的测试）。 */
const sendMock = vi.fn()
const signOutMock = vi.fn()
vi.mock('../request/send', () => ({ send: (...args: unknown[]) => sendMock(...args) }))
vi.mock('@/platform/credential', () => ({ signOut: () => signOutMock() }))
vi.mock('@/platform/client', () => ({
  client: { id: 'web-test', metadata: { client: 'web', accept: 'cui-web' }, preferences: { locale: 'zh-CN', theme: 'light' } },
}))

import * as api from './api'
import * as domain from './index'
import { userKeys } from './keys'
import {
  deviceAuthorizeQuery,
  deviceFlowStartQuery,
  deviceFlowTokenQuery,
  entryCaptchaQuery,
  entryConfigQuery,
  entryInviteQuery,
  entryLoginQuery,
  entryOtpQuery,
  entryRegisterQuery,
  entryVerifyQuery,
  logoutQuery,
  oauthAuthorizeQuery,
  oauthCallbackQuery,
  oidcKeysQuery,
} from './queries'

beforeEach(() => {
  sendMock.mockReset()
  signOutMock.mockReset()
})

describe('the user domain declarations', () => {
  it('declares the entry line with its methods and paths', () => {
    // 方言：本接口读 query；值由查询层从 ctx 取，调用点不传
    expect(api.entryConfig({ locale: 'zh-CN' })).toEqual({ method: 'GET', path: '/user/entry?locale=zh-CN' })
    expect(api.entryConfig()).toEqual({ method: 'GET', path: '/user/entry' })
        expect(api.entryVerify).toEqual({ method: 'POST', path: '/user/entry/verify' })
    expect(api.entryRegister).toEqual({ method: 'POST', path: '/user/entry/register' })
    expect(api.entryLogin).toEqual({ method: 'POST', path: '/user/entry/login' })
    expect(api.entryOtp({ locale: 'ja' })).toEqual({ method: 'POST', path: '/user/entry/otp?locale=ja' })
    expect(api.entryOtp()).toEqual({ method: 'POST', path: '/user/entry/otp' })
        expect(api.entryInvite).toEqual({ method: 'POST', path: '/user/entry/invite/verify' })
    expect(api.entryCaptcha()).toEqual({ method: 'GET', path: '/user/entry/captcha' })
    expect(api.entryCaptcha({ captcha_id: 'c1' })).toEqual({ method: 'GET', path: '/user/entry/captcha?captcha_id=c1' })
    expect(api.logout).toEqual({ method: 'POST', path: '/user/logout' })
  })

  it('declares the third-party and device flows with their parameterised paths', () => {
    expect(api.oauthAuthorize('google')).toEqual({ method: 'GET', path: '/user/oauth/google/authorize' })
    expect(api.oauthAuthorize('google', { redirect_uri: 'https://x/back' })).toEqual({
      method: 'GET',
      path: '/user/oauth/google/authorize?redirect_uri=https%3A%2F%2Fx%2Fback',
    })
    expect(api.oauthCallback('github')).toEqual({ method: 'POST', path: '/user/oauth/github/callback' })
    expect(api.deviceAuthorize).toEqual({ method: 'POST', path: '/oauth/device/authorize' })
    expect(api.deviceFlowStart('apple')).toEqual({ method: 'POST', path: '/user/oauth/apple/device/authorize' })
    expect(api.deviceFlowToken('apple')).toEqual({ method: 'POST', path: '/user/oauth/apple/device/token' })
    expect(api.oidcKeys).toEqual({ method: 'GET', path: '/oauth/jwks' })
  })
})

describe('the user key family', () => {
  it('derives every key from its declaration, under one family root', () => {
    expect(userKeys.all).toEqual(['user'])
    expect(userKeys.logout()).toEqual(['user', 'logout', 'POST', '/user/logout'])
    expect(userKeys.entryConfig('zh-CN')).toEqual(['user', 'entry', 'config', 'zh-CN', 'GET', '/user/entry?locale=zh-CN'])
    expect(userKeys.entryCaptcha('c1')).toEqual(['user', 'entry', 'captcha', 'c1', 'GET', '/user/entry/captcha?captcha_id=c1'])
    expect(userKeys.entryVerify()).toEqual(['user', 'entry', 'verify', 'POST', '/user/entry/verify'])
    expect(userKeys.entryRegister()).toEqual(['user', 'entry', 'register', 'POST', '/user/entry/register'])
    expect(userKeys.entryLogin()).toEqual(['user', 'entry', 'login', 'POST', '/user/entry/login'])
    expect(userKeys.entryOtp('ja')).toEqual(['user', 'entry', 'otp', 'ja', 'POST', '/user/entry/otp?locale=ja'])
    expect(userKeys.entryOtp()).toEqual(['user', 'entry', 'otp', '', 'POST', '/user/entry/otp'])
    expect(userKeys.entryInvite()).toEqual(['user', 'entry', 'invite', 'POST', '/user/entry/invite/verify'])
    expect(userKeys.oauthAuthorize('google')).toEqual(['user', 'oauth', 'google', 'authorize', 'GET', '/user/oauth/google/authorize'])
    expect(userKeys.oauthCallback('github')).toEqual(['user', 'oauth', 'github', 'callback', 'POST', '/user/oauth/github/callback'])
    expect(userKeys.deviceAuthorize()).toEqual(['user', 'device', 'authorize', 'POST', '/oauth/device/authorize'])
    expect(userKeys.deviceFlowStart('apple')).toEqual(['user', 'device', 'apple', 'start', 'POST', '/user/oauth/apple/device/authorize'])
    expect(userKeys.deviceFlowToken('apple')).toEqual(['user', 'device', 'apple', 'token', 'POST', '/user/oauth/apple/device/token'])
    expect(userKeys.oidcKeys()).toEqual(['user', 'oidc', 'keys', 'GET', '/oauth/jwks'])
  })


  it('covers the no-argument defaults of the parameterised keys', () => {
    expect(userKeys.entryConfig()).toEqual(['user', 'entry', 'config', '', 'GET', '/user/entry'])
    expect(userKeys.entryCaptcha()).toEqual(['user', 'entry', 'captcha', '', 'GET', '/user/entry/captcha'])
    expect(userKeys.oauthAuthorize('github')).toEqual(['user', 'oauth', 'github', 'authorize', 'GET', '/user/oauth/github/authorize'])
  })

  it('gives different parameters different keys', () => {
    expect(userKeys.oauthAuthorize('google')).not.toEqual(userKeys.oauthAuthorize('github'))
  })
})

describe('the user read queries pair a key with a declaration', () => {
  it('pairs the reads as-is', () => {
    const configPair = entryConfigQuery()
    expect(configPair.key).toEqual(userKeys.entryConfig('zh-CN'))
    // 请求由 hook 在运行时用 ctx 构建：断言"ctx → 请求"这一步
    expect(configPair.build({ locale: 'ja' } as never)).toEqual(api.entryConfig({ locale: 'ja' }))
    expect(entryCaptchaQuery('c1')).toEqual({ key: userKeys.entryCaptcha('c1'), request: api.entryCaptcha({ captcha_id: 'c1' }) })
    expect(oidcKeysQuery()).toEqual({ key: userKeys.oidcKeys(), request: api.oidcKeys })
    expect(oauthAuthorizeQuery('google', 'https://x/back')).toEqual({
      key: userKeys.oauthAuthorize('google'),
      request: api.oauthAuthorize('google', { redirect_uri: 'https://x/back' }),
    })
    expect(deviceFlowStartQuery('apple')).toEqual({
      key: userKeys.deviceFlowStart('apple'),
      request: api.deviceFlowStart('apple'),
    })
  })
})

describe('the user write queries hand the temporary token to the egress as a header', () => {
  it('verifies the first step with the body only (no token yet)', async () => {
    sendMock.mockResolvedValue({ ok: true, value: { status: 'login' } })
    const query = entryVerifyQuery({ username: 'ada@example.com' })
    expect(query.key).toEqual(userKeys.entryVerify())
    await query.operation()
    expect(sendMock).toHaveBeenCalledWith(api.entryVerify, { body: { username: 'ada@example.com', locale: 'zh-CN' } })
  })

  it('turns a rejected judgement into its own code, and only for this interface', async () => {
    /* 这条接口把「某一项不合法」统一报成 `invalid_request`，真正的原因在描述原文里。
       细分只在这里做：通用映射不认识任何接口的细节，别的接口也不受影响。 */
    sendMock.mockResolvedValue({
      ok: false,
      code: 'invalid_request',
      params: {},
      message: 'invalid: request',
      rawMessage: 'Captcha verification failed: invalid captcha',
    })
    const refused = await entryVerifyQuery({ username: 'ada@example.com' }).operation()
    expect(refused.ok).toBe(false)
    expect(refused.ok ? '' : refused.code).toBe('user.invalid_captcha')

    /* 同一码下没有这条描述时不动它 */
    sendMock.mockResolvedValue({
      ok: false,
      code: 'invalid_request',
      params: {},
      message: 'invalid: request',
      rawMessage: 'the request body is not acceptable',
    })
    const other = await entryVerifyQuery({ username: 'ada@example.com' }).operation()
    expect(other.ok ? '' : other.code).toBe('invalid_request')
  })

  it('registers and logs in with the temporary token in the Authorization header', async () => {
    sendMock.mockResolvedValue({ ok: true, value: { status: 'ok' } })
    await entryRegisterQuery('temp-1', { password: 'x' }).operation()
    expect(sendMock).toHaveBeenCalledWith(api.entryRegister, {
      body: { password: 'x', locale: 'zh-CN' },
      headers: { Authorization: 'Bearer temp-1' },
    })
    await entryLoginQuery('temp-2', { password: 'y', remember_me: true }).operation()
    expect(sendMock).toHaveBeenCalledWith(api.entryLogin, {
      body: { password: 'y', remember_me: true },
      headers: { Authorization: 'Bearer temp-2' },
    })
  })

  it('resends the otp and redeems the invite with the temporary token', async () => {
    sendMock.mockResolvedValue({ ok: true, value: { otp_id: 'o1' } })
    await entryOtpQuery('temp-3').operation()
    expect(sendMock).toHaveBeenCalledWith(api.entryOtp({ locale: 'zh-CN' }), {
      headers: { Authorization: 'Bearer temp-3' },
    })
    await entryInviteQuery('temp-4', { code: 'INV' }).operation()
    expect(sendMock).toHaveBeenCalledWith(api.entryInvite, {
      body: { code: 'INV' },
      headers: { Authorization: 'Bearer temp-4' },
    })
  })

  it('completes the oauth callback, confirms the device code and polls it', async () => {
    sendMock.mockResolvedValue({ ok: true, value: { status: 'ok' } })
    await oauthCallbackQuery('google', { code: 'c', state: 's' }).operation()
    expect(sendMock).toHaveBeenCalledWith(api.oauthCallback('google'), { body: { code: 'c', state: 's' } })
    await deviceAuthorizeQuery({ user_code: 'ABCD' }).operation()
    expect(sendMock).toHaveBeenCalledWith(api.deviceAuthorize, { body: { user_code: 'ABCD' } })
    const poll = deviceFlowTokenQuery('apple', { device_code: 'd1' })
    expect(poll.key).toEqual(userKeys.deviceFlowToken('apple'))
    await poll.operation()
    expect(sendMock).toHaveBeenCalledWith(api.deviceFlowToken('apple'), { body: { device_code: 'd1' } })
  })
})

describe('logout clears the server side first, then the local credential', () => {
  it('returns the server result when the local credential is cleared too', async () => {
    sendMock.mockResolvedValue({ ok: true, value: { message: 'bye' } })
    signOutMock.mockResolvedValue({ ok: true })
    const result = await logoutQuery().operation()
    expect(result).toEqual({ ok: true, value: { message: 'bye' } })
  })

  it('reports the server failure without touching the local credential', async () => {
    const failure = { ok: false, code: 'unauthorized', params: {}, message: 'no' }
    sendMock.mockResolvedValue(failure)
    const result = await logoutQuery().operation()
    expect(result).toBe(failure)
    expect(signOutMock).not.toHaveBeenCalled()
  })

  it('reports the local failure when the credential cannot be cleared', async () => {
    sendMock.mockResolvedValue({ ok: true, value: { message: 'bye' } })
    const failure = { ok: false, code: 'credential.clear_failed', params: {}, message: 'no' }
    signOutMock.mockResolvedValue(failure)
    expect(await logoutQuery().operation()).toBe(failure)
  })
})

describe('the domain index re-exports the surface', () => {
  it('exposes the declarations, the keys and the query pairs', () => {
    expect(domain.entryVerify).toEqual(api.entryVerify)
    expect(domain.userKeys.all).toEqual(['user'])
    expect(typeof domain.entryConfigQuery).toBe('function')
    expect(typeof domain.logoutQuery).toBe('function')
  })
})
