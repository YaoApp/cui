import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

/* 首页是占位页：版本事实 + 两个开关 + 通往脚手架的入口。事实来自 `client`（装填一次），
   语言/主题是会变的，走偏好 hook —— 这里把两边都换成固定的桩。 */
vi.mock('@/platform/client', () => ({
  client: {
    info: { client: 'desktop', os: 'macos', ua: { browser: { name: 'safari', version: '18' } }, client_id: 'desk-12345678' },
    host: { ready: true, version: '2.0.0' },
    manifest: { version: '2.0.0' },
  },
  useLocalePreference: () => ({ locale: 'zh-CN', setLocale: vi.fn() }),
  useThemePreference: () => ({ theme: 'dark', setTheme: vi.fn() }),
}))
vi.mock('@/platform/router/basename', () => ({ routerBasename: () => '' }))

import { HomePage } from './home'

function renderPage() {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  it('states the current version facts', () => {
    renderPage()
    expect(screen.getByText(/应用版本/)).toBeInTheDocument()
    expect(screen.getAllByText(/2\.0\.0/).length).toBeGreaterThan(0)
    expect(screen.getByText(/桌面/)).toBeInTheDocument()
    expect(screen.getByText(/macos/)).toBeInTheDocument()
  })

  it('keeps the language and theme switches on the page', () => {
    renderPage()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '暗色' })).toBeInTheDocument()
  })

  it('offers a way into all four scaffold pages', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: '脚手架' })).toBeInTheDocument()
    for (const [name, href] of [
      ['总览', '/scaffold'],
      ['路由', '/scaffold/routing'],
      ['桥', '/scaffold/bridge'],
      ['请求', '/scaffold/requests'],
    ] as const) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href)
    }
  })
})
