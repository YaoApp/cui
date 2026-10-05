/* **对着真实后端**验一遍入口一线（契约测试，不是替身测试）。
 *
 * 默认**跳过** —— 只有显式给 `CUI_REAL_SERVICE=1` 且指明 `VITE_SERVICE_BASE` 时才跑：
 *
 * ```bash
 * CUI_REAL_SERVICE=1 VITE_SERVICE_BASE=http://<dev-backend-host>:5099 \
 *   pnpm exec vitest run app/src/data/user/user.contract.test.ts
 * ```
 *
 * 这里**不造假**：走真实 `send()`（真实出口 · 真实地址 · 真实包裹），验的是"服务端确实这么答"。
 * 验证码与一次性口令用 `test` 域的接口取真值（`readCaptcha` · `readOtp`），不猜、不跳过。
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { send } from '../request'
import { readCaptcha, readOtp } from '../test'
import { entryCaptcha, entryConfig, entryOtp, entryVerify } from './api'

const enabled = process.env.CUI_REAL_SERVICE === '1' && (process.env.VITE_SERVICE_BASE ?? '') !== ''
const describeReal = enabled ? describe : describe.skip

describeReal('the entry line against the real service', () => {
  let username = ''
  let captchaId = ''
  let captchaAnswer = ''
  let temporaryToken = ''
  let otpId = ''

  beforeAll(() => {
    // 每次跑用一个新用户名，避免与历史数据耦合
    username = `cui-entry-${Date.now()}@example.com`
  })

  it('reads the entry configuration with its form shape', async () => {
    const result = await send(entryConfig({ locale: 'zh-CN' }))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(typeof result.value.title).toBe('string')
    expect(result.value.title.length).toBeGreaterThan(0)
    expect(result.value.form?.captcha?.type === 'image' || result.value.form?.captcha?.type === 'turnstile').toBe(true)
  })

  it('gets a live captcha and its answer from the test endpoint', async () => {
    const captcha = await send(entryCaptcha())
    expect(captcha.ok).toBe(true)
    if (!captcha.ok) return
    expect(captcha.value.captcha_id).toBeTruthy()
    expect(captcha.value.captcha_image.length).toBeGreaterThan(0)
    captchaId = captcha.value.captcha_id

    const answer = await send(readCaptcha({ id: captchaId }))
    expect(answer.ok).toBe(true)
    if (!answer.ok) return
    expect(answer.value.answer.length).toBeGreaterThan(0)
    captchaAnswer = answer.value.answer
  })

  it('verifies a fresh account: the service says register and hands back a temporary token', async () => {
    const result = await send(entryVerify, {
      body: { username, captcha_id: captchaId, captcha: captchaAnswer, locale: 'zh-CN' },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(['login', 'register']).toContain(result.value.status)
    expect(result.value.user_exists).toBe(false)
    expect(result.value.access_token.length).toBeGreaterThan(0)
    expect(result.value.token_type.toLowerCase()).toBe('bearer')
    temporaryToken = result.value.access_token

    // 注册路径会在这一步把验证码发出去，返回 otp_id
    if (result.value.status === 'register') {
      expect(result.value.verification_sent).toBe(true)
      expect(result.value.otp_id).toBeTruthy()
      otpId = result.value.otp_id ?? ''
    }
  })

  it('resends the otp with that temporary token and the code can be read back', async () => {
    if (!temporaryToken) return
    const resent = await send(entryOtp({ locale: 'zh-CN' }), {
      headers: { Authorization: `Bearer ${temporaryToken}` },
    })
    expect(resent.ok).toBe(true)
    if (!resent.ok) return
    expect(resent.value.otp_id).toBeTruthy()
    otpId = resent.value.otp_id

    const code = await send(readOtp({ code: otpId }))
    expect(code.ok).toBe(true)
    if (!code.ok) return
    expect((code.value.code ?? code.value.otp ?? '').length).toBeGreaterThan(0)
  })
})
