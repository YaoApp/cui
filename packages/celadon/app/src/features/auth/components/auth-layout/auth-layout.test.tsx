/* 外壳：标题是页面唯一的 h1 且与卡片关联；顶行有品牌与产品名；客户端内收起品牌并显示返回栏与服务器名。
   版式取值对照 design/prototype/login.html。 */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AuthLayout } from './auth-layout'

vi.mock('@/platform/service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/platform/service')>()
  return { ...actual, serviceInfo: () => ({ name: 'Yao Dev', version: '1.0.0', openapi: '/v1' }) }
})

function renderLayout(entry: string, props: Record<string, unknown> = {}) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthLayout titleLines={['欢迎使用 Yao Agents']} {...props}>
        <p>表单</p>
      </AuthLayout>
    </MemoryRouter>,
  )
}

describe('the auth layout', () => {
  it('labels the card with the title it renders', () => {
    const { container } = renderLayout('/login')
    const title = screen.getByRole('heading', { level: 1, name: '欢迎使用 Yao Agents' })
    const card = container.querySelector('.auth__card')
    expect(title.id).toBeTruthy()
    expect(card?.getAttribute('aria-labelledby')).toBe(title.id)
    expect(screen.getByText('表单')).toBeTruthy()
  })

  it('shows the brand with its product name on an independent visit', () => {
    const { container } = renderLayout('/login')
    expect(container.querySelector('.auth__brand')).toBeTruthy()
    expect(screen.getByText('Yao Agents')).toBeTruthy()
  })

  it('shows the footer links with a separator', () => {
    const { container } = renderLayout('/login', { serviceHref: '/terms', privacyHref: '/privacy' })
    expect(screen.getByRole('link', { name: '使用协议' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '隐私政策' })).toBeTruthy()
    expect(container.querySelector('.auth__bottom')?.textContent).toContain('·')
  })

  it('hides the brand and the footer and shows the back bar inside the client', () => {
    const { container } = renderLayout('/login?from=connect', { serviceHref: '/terms', onBack: () => undefined })
    /* 品牌与页脚仍在 DOM 里，由 `.auth--in-app` 的样式收起；这里核的是那一层类与新增的两块 */
    expect(container.querySelector('.auth--in-app')).toBeTruthy()
    expect(container.querySelector('.auth__brand')).toBeTruthy()
    expect(container.querySelector('.auth__bottom')).toBeNull()
    expect(container.querySelector('.auth__ctrl-wrap')).toBeTruthy()
    expect(screen.getByRole('button', { name: '返回服务器选择' })).toBeTruthy()
    expect(screen.getByText('Yao Dev')).toBeTruthy()
  })
})
