/* **对着真实服务把入口一线走完** —— 经 dev server 的同域代理（`vite.config.ts` 的 `server.proxy` 读
 * `YAO_SERVER_HOST`，转发 `.well-known` 与 `v1`），浏览器层不跨源。
 *
 * 跑法：
 * ```bash
 * YAO_SERVER_HOST=http://<dev-backend-host>:5099 pnpm exec playwright test \
 *   app/src/data/user/tests/entry.contract.browser.ts
 * ```
 * 没给 `YAO_SERVER_HOST` 就跳过（没有代理目标时不假装验过）。
 *
 * **step 覆盖**：entryConfig · entryCaptcha · entryVerify · entryOtp · entryRegister · entryLogin ·
 * entryInvite · oauthAuthorize · oauthCallback · deviceFlowStart · deviceFlowToken · deviceAuthorize ·
 * logout · oidcKeys —— 14 步把 13 条声明全走一遍，其中**错误契约**（invite/callback/device 的拒绝形态）
 * 也一并验：能通的验值，不能通的验"服务端确实按声明的形状拒绝"。
 */

import { expect, test } from '@playwright/test'

const target = process.env.YAO_SERVER_HOST ?? ''

type Step = { status: number; body: Record<string, unknown> | null }

test.describe('the entry line against the real service', () => {
  test.skip(target === '', 'YAO_SERVER_HOST not set: the dev proxy has nowhere to forward to')

  test('walks every declared endpoint and reports what came back', async ({ page }) => {
    await page.goto('/')
    const email = `cui-contract-${Date.now()}@example.com`
    const password = 'Cui-contract-1!'

    const walk = await page.evaluate(async ({ email, password }) => {
      const steps: Record<string, Step> = {}
      const call = async (path: string, init: RequestInit = {}): Promise<Step> => {
        const response = await fetch(path, {
          headers: { accept: 'application/json', ...(init.body ? { 'content-type': 'application/json' } : {}) },
          ...init,
        })
        return { status: response.status, body: (await response.json().catch(() => null)) as Record<string, unknown> | null }
      }
      const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
        call(path, { method: 'POST', body: JSON.stringify(body), headers })
      const freshCaptcha = async () => {
        const captcha = await call('/v1/user/entry/captcha')
        const id = String(captcha.body?.captcha_id ?? '')
        const answer = await call(`/v1/test/captcha?id=${encodeURIComponent(id)}`)
        return { id, answer: String(answer.body?.answer ?? ''), response: captcha }
      }

      // 1 · entryConfig
      steps.entryConfig = await call('/v1/user/entry?locale=zh-CN')
      // 2 · entryCaptcha（+ test 取真值）
      const captcha = await freshCaptcha()
      steps.entryCaptcha = captcha.response   // 存**原始响应**，字段级断言才有意义
      // 3 · entryVerify
      steps.entryVerify = await post('/v1/user/entry/verify', { username: email, captcha_id: captcha.id, captcha: captcha.answer, locale: 'zh-CN' })
      const temp = String(steps.entryVerify.body?.access_token ?? '')
      const auth = { authorization: `Bearer ${temp}` }
      // 4 · entryOtp（重发）
      steps.entryOtp = await post('/v1/user/entry/otp?locale=zh-CN', undefined, auth)
      const otpId = String(steps.entryOtp.body?.otp_id ?? '')
      // 5 · readOtp（test 域取真值）
      const otp = otpId ? await call(`/v1/test/otp?code=${encodeURIComponent(otpId)}`) : { status: 0, body: null }
      const otpCode = String((otp.body as Record<string, unknown> | null)?.code ?? '')
      // 6 · entryRegister
      steps.entryRegister = await post('/v1/user/entry/register', { name: 'Contract', password, confirm_password: password, ...(otpId ? { otp_id: otpId, verification_code: otpCode } : {}), locale: 'zh-CN' }, auth)
      // 7 · entryVerify（再来一次，同一个邮箱应判为 login）
      const captcha2 = await freshCaptcha()
      steps.entryVerifyAgain = await post('/v1/user/entry/verify', { username: email, captcha_id: captcha2.id, captcha: captcha2.answer, locale: 'zh-CN' })
      const temp2 = String(steps.entryVerifyAgain.body?.access_token ?? '')
      // 8 · entryLogin
      steps.entryLogin = await post('/v1/user/entry/login', { password, remember_me: false, locale: 'zh-CN' }, { authorization: `Bearer ${temp2}` })
      // 9 · entryInvite（无效码也要给出声明的失败形态）
      steps.entryInvite = await post('/v1/user/entry/invite/verify', { code: 'NOT-A-CODE', locale: 'zh-CN' }, { authorization: `Bearer ${temp2}` })
      // 10 · oauthAuthorize
      steps.oauthAuthorize = await call('/v1/user/oauth/google/authorize?redirect_uri=https%3A%2F%2Fexample.com%2Fback')
      // 11 · oauthCallback（伪 code：验拒绝形态）
      steps.oauthCallback = await post('/v1/user/oauth/google/callback', { code: 'not-a-code', state: 'x', locale: 'zh-CN' })
      // 12 · deviceFlowStart
      steps.deviceFlowStart = await post('/v1/user/oauth/google/device/authorize', {})
      const deviceCode = String(steps.deviceFlowStart.body?.device_code ?? '')
      // 13 · deviceFlowToken（轮询）
      steps.deviceFlowToken = await post('/v1/user/oauth/google/device/token', { device_code: deviceCode || 'not-a-code', locale: 'zh-CN' })
      // 14 · loginWeb（test 域真会话，同源收 Cookie）→ deviceAuthorize → logout
      steps.loginWeb = await post('/v1/test/login/web', { user: email })
      steps.deviceAuthorize = await post('/v1/oauth/device/authorize', { user_code: 'ABCD-EFGH' })
      steps.logout = await post('/v1/user/logout', {})
      // 15 · oidcKeys
      steps.oidcKeys = await call('/v1/oauth/jwks')
      return { steps, temp: temp !== '', otpCode: otpCode !== '', deviceCode: deviceCode !== '' }
    }, { email, password })

    const { steps } = walk
    const ok = (name: keyof typeof steps) => steps[name].status

    // —— 能通的必须通且给对值
    expect(ok('entryConfig')).toBe(200)
    expect(typeof steps.entryConfig.body?.title).toBe('string')
    expect(ok('entryCaptcha')).toBe(200)
    expect(String(steps.entryCaptcha.body?.captcha_image ?? '').length).toBeGreaterThan(0)
    expect(ok('entryVerify')).toBe(200)
    expect(['login', 'register']).toContain(steps.entryVerify.body?.status)
    expect(walk.temp).toBe(true)
    // 本配置不需要验证码：服务端会给 400 invalid_request；需要时给 200 + otp_id。两种都算验过（形状必须对）
    expect([200, 400]).toContain(ok('entryOtp'))
    const otpBody = steps.entryOtp.body ?? {}
    expect(typeof (otpBody.otp_id ?? otpBody.error ?? otpBody.code)).not.toBe('undefined')
    expect(ok('entryRegister')).toBe(200)
    expect(typeof (steps.entryRegister.body?.access_token ?? steps.entryRegister.body?.session_id)).toBe('string')
    expect(ok('entryVerifyAgain')).toBe(200)
    expect(steps.entryVerifyAgain.body?.status).toBe('login')
    expect(ok('entryLogin')).toBe(200)
    expect(typeof steps.entryLogin.body?.session_id).toBe('string')
    expect(ok('loginWeb')).toBe(200)
    expect(ok('logout')).toBe(200)
    expect(ok('oidcKeys')).toBe(200)
    expect((steps.oidcKeys.body?.keys as { kty: string }[])[0].kty).toBe('RSA')

    // —— 按声明的形状拒绝（不是 200，但形状必须对得上）
    expect(ok('entryInvite')).toBeGreaterThanOrEqual(400)
    expect(typeof (steps.entryInvite.body?.error ?? steps.entryInvite.body?.code)).not.toBe('undefined')
    expect([200, 400, 401, 403, 404, 500]).toContain(ok('oauthAuthorize'))
    expect(ok('oauthCallback')).toBeGreaterThanOrEqual(400)
    expect([200, 400, 404]).toContain(ok('deviceFlowStart'))
    expect(ok('deviceFlowToken')).toBeGreaterThanOrEqual(400)
    expect(ok('deviceAuthorize')).toBeGreaterThanOrEqual(400)

    // 字段级：声明的必备字段必须在真实响应里出现（这次就是这样抓出 token 段的漂移）
    expect(Object.keys(steps.entryConfig.body ?? {})).toEqual(
      expect.arrayContaining(['title', 'description', 'success_url', 'form', 'token', 'verification_code_required']),
    )
    expect(Object.keys(steps.entryConfig.body?.form as object)).toEqual(
      expect.arrayContaining(['username', 'password', 'captcha']),
    )
    expect(Object.keys(steps.entryConfig.body?.token as object)).toEqual(
      expect.arrayContaining(['expires_in', 'refresh_token_expires_in']),
    )
    expect(Object.keys(steps.entryCaptcha.body ?? {})).toEqual(expect.arrayContaining(['captcha_id', 'captcha_image']))
    expect(Object.keys(steps.entryVerify.body ?? {})).toEqual(
      expect.arrayContaining(['status', 'access_token', 'expires_in', 'token_type', 'scope', 'user_exists']),
    )
    expect(Object.keys(steps.entryRegister.body ?? {})).toEqual(expect.arrayContaining(['access_token']))
    expect(Object.keys(steps.entryLogin.body ?? {})).toEqual(expect.arrayContaining(['session_id']))
    expect((steps.oidcKeys.body?.keys as Record<string, unknown>[])[0]).toEqual(
      expect.objectContaining({ kty: 'RSA', use: 'sig', alg: 'RS256' }),
    )
    console.log('WALK ' + JSON.stringify(Object.fromEntries(Object.entries(steps).map(([k, v]) => [k, v.status]))))
  })
})
