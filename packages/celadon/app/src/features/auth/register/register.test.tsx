/* 注册页（通道版）：只证明从登录页带过来的账号显示出来、条款勾选在这一页，且能回到登录。 */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '@/platform/i18n'

vi.mock('@/platform/transport/fetch', () => ({ transportFetch: vi.fn() }))

import { transportFetch } from '@/platform/transport/fetch'
import { AuthProvider } from '@/features/auth/components/auth-provider'
import { useAuthStore } from '../auth.store'
import { RegisterPage } from './register'

const t = (key: string) => i18n.t(key as never) as unknown as string

function json(value: unknown, status = 200) {
  return { ok: true as const, value: new Response(JSON.stringify(value), { status }) }
}

/** 入口配置：给条款与隐私政策两个地址，条款行才会渲染。 */
const ENTRY_CONFIG = {
  title: '欢迎使用 Yao Agents',
  description: '请输入邮箱以继续',
  success_url: '/done',
  secure_cookie: false,
  form: {
    username: { placeholder: '请输入邮箱' },
    password: { placeholder: '登录密码' },
    terms_of_service_link: 'https://example.com/terms',
    privacy_policy_link: 'https://example.com/privacy',
  },
  third_party: { providers: [] },
}

function renderPage(url = '/register?username=max%40example.com') {
  window.history.pushState({}, '', url)
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(transportFetch).mockReset()
  /* 域状态在 store 里，模块级单例，用例之间要复位 */
  useAuthStore.getState().reset()
  vi.mocked(transportFetch).mockImplementation(async (url) => {
    const target = String(url)
    if (target.includes('/.well-known/yao')) {
      return json({ name: 'Yao Dev', version: '1.0.0', openapi: '/v1' })
    }
    if (target.includes('/oauth/jwks')) return json({ keys: [] })
    if (target.includes('/user/entry')) return json(ENTRY_CONFIG)
    return json({})
  })
})

describe('the register page', () => {
  it('shows the account carried over from the sign-in page', async () => {
    renderPage()
    expect(await screen.findByText('max@example.com')).toBeTruthy()
    expect(screen.getByText(t('auth.register.pending'))).toBeTruthy()
  })

  it('links back to the sign-in page', async () => {
    renderPage()
    const back = await screen.findByRole('link', { name: t('auth.register.backToLogin') })
    expect(back.getAttribute('href')).toContain('/login')
  })

  it('renders without an account in the address', async () => {
    renderPage('/register')
    expect(await screen.findByText(t('auth.register.pending'))).toBeTruthy()
    expect(screen.queryByText('max@example.com')).toBeNull()
  })

  it('carries the terms row, which belongs to registration rather than sign-in', async () => {
    renderPage()
    expect(await screen.findByRole('checkbox')).toBeTruthy()
    /* 勾选框的 id 落在隐藏的原生控件上（基础件的既有约定），因此按 id 找元素而不是按可见方框 */
    expect(document.querySelector('#register-terms')).not.toBeNull()
    /* 两个链接都在这一行里，地址取自入口配置 */
    const links = screen.getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toContain('https://example.com/terms')
    expect(links.map((link) => link.getAttribute('href'))).toContain('https://example.com/privacy')
  })
})
