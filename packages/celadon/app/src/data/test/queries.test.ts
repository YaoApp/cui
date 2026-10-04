import { afterEach, describe, expect, it, vi } from 'vitest'

/* 登录动作：怎么登录由数据层按凭据载体决定；成功后把响应交给平台收令牌。 */
const send = vi.hoisted(() => vi.fn())
const signIn = vi.hoisted(() => vi.fn(async () => ({ ok: true as const, value: true })))
const credentialCarrier = vi.hoisted(() => vi.fn(() => 'cookie'))

vi.mock('@/data/request/send', () => ({ send }))
vi.mock('@/platform/credential', () => ({ signIn, credentialCarrier }))

import { loginQuery } from './queries'

afterEach(() => vi.clearAllMocks())

describe('the login action', () => {
  it('signs in through the cookie endpoint in a browser, and adopts the response', async () => {
    send.mockResolvedValue({ ok: true, value: { access_token: 'tok' } })

    const query = loginQuery()
    const result = await query.operation({ user: 'ada@example.com' })

    expect(query.key).toEqual(['POST', '/test/login/web'])
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ path: '/test/login/web' }), { body: { user: 'ada@example.com' } })
    expect(signIn).toHaveBeenCalledWith({ access_token: 'tok' })
    expect(result).toMatchObject({ ok: true })
  })

  it('uses the token endpoint where the client holds the credential itself', async () => {
    credentialCarrier.mockReturnValue('os-store')
    send.mockResolvedValue({ ok: true, value: { access_token: 'tok' } })

    await loginQuery().operation({ user: 'ada@example.com' })

    expect(send).toHaveBeenCalledWith(expect.objectContaining({ path: '/test/login/token' }), { body: { user: 'ada@example.com' } })
  })

  it('does not adopt a failed sign-in', async () => {
    send.mockResolvedValue({ ok: false, code: 'test.login_failed', params: {}, message: 'no' })

    const result = await loginQuery().operation({ user: 'ada@example.com' })

    expect(signIn).not.toHaveBeenCalled()
    expect(result).toMatchObject({ ok: false })
  })
})
