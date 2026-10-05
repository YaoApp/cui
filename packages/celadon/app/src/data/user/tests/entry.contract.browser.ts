/* **对着真实服务**验入口一线 —— 走 dev server 的**同域代理**（`vite.config.ts` 的 `server.proxy` 读
 * `YAO_SERVER_HOST`，转发 `.well-known` 与 `v1`），所以浏览器层不跨源，平台的 `transport.cross_origin` 不会拦。
 *
 * 跑法：
 * ```bash
 * YAO_SERVER_HOST=http://<dev-backend-host>:5099 pnpm exec playwright test \
 *   app/src/data/user/tests/entry.contract.browser.ts
 * ```
 * 没给 `YAO_SERVER_HOST` 时**跳过**（本机没有代理目标，不该假装验过）。
 */

import { expect, test } from '@playwright/test'

const target = process.env.YAO_SERVER_HOST ?? ''

test.describe('the entry line against the real service', () => {
  test.skip(target === '', 'YAO_SERVER_HOST not set: the dev proxy has nowhere to forward to')

  test('serves the entry configuration with the shape the types declare', async ({ page }) => {
    await page.goto('/')
    const result = await page.evaluate(async () => {
      const response = await fetch('/v1/user/entry?locale=zh-CN', { headers: { accept: 'application/json' } })
      return { status: response.status, body: (await response.json()) as Record<string, unknown> }
    })
    expect(result.status).toBe(200)
    expect(typeof result.body.title).toBe('string')
    expect(JSON.stringify(result.body.form)).toContain('placeholder')
  })

  test('hands out a live captcha whose answer the test endpoint confirms', async ({ page }) => {
    await page.goto('/')
    const flow = await page.evaluate(async () => {
      const captcha = (await (await fetch('/v1/user/entry/captcha')).json()) as { captcha_id: string; captcha_image: string }
      const answer = (await (await fetch(`/v1/test/captcha?id=${captcha.captcha_id}`)).json()) as { answer: string }
      return { captcha, answer }
    })
    expect(flow.captcha.captcha_id).toBeTruthy()
    expect(flow.captcha.captcha_image.startsWith('data:image/')).toBe(true)
    expect(flow.answer.answer.length).toBeGreaterThan(0)

    const verified = await page.evaluate(async (input) => {
      const response = await fetch('/v1/user/entry/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      })
      return { status: response.status, body: (await response.json()) as Record<string, unknown> }
    }, { username: `cui-contract-${Date.now()}@example.com`, captcha_id: flow.captcha.captcha_id, captcha: flow.answer.answer, locale: 'zh-CN' })

    expect(verified.status).toBe(200)
    expect(['login', 'register']).toContain(verified.body.status)
    expect(typeof verified.body.access_token).toBe('string')
  })

  test('publishes the keys used to verify the ID token', async ({ page }) => {
    await page.goto('/')
    const keys = await page.evaluate(async () => (await (await fetch('/v1/oauth/jwks')).json()) as { keys: { kty: string }[] })
    expect(keys.keys.length).toBeGreaterThan(0)
    expect(keys.keys[0].kty).toBe('RSA')
  })
})
