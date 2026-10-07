/* 链接：站内地址落路由链接（不整页加载）、外部地址补 target 与 rel、render 换元素、类名与属性按上游规则合并。 */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { Link } from './link'

/* 站内地址由路由组件渲染，因此这些用例要放在路由之内（应用里这个组件也只出现在路由之内）。 */
function renderInRouter(node: React.ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>)
}

describe('the link', () => {
  it('renders an anchor with its href and the link class', () => {
    renderInRouter(
      <Link href="/app/login" className="terms-note__link">
        sign in
      </Link>,
    )
    const link = screen.getByRole('link', { name: 'sign in' }) as HTMLAnchorElement
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('/app/login')
    /* 组件自己的类与调用方的类并存，调用方的不会被覆盖 */
    expect(link.classList.contains('link')).toBe(true)
    expect(link.classList.contains('terms-note__link')).toBe(true)
    /* 站内链接不开新窗口 */
    expect(link.getAttribute('target')).toBeNull()
    expect(link.getAttribute('rel')).toBeNull()
  })

  it('opens an external address in a new window and cuts the opener link', () => {
    /* 外部地址不经路由，因此不必放在路由之内 */
    render(
      <Link href="https://example.com/terms" external>
        terms
      </Link>,
    )
    const link = screen.getByRole('link', { name: 'terms' })
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('routes an in-app address through the router, not a full page load', () => {
    renderInRouter(
      <Link href="/app/login" data-probe="in-app">
        sign in
      </Link>,
    )
    const link = screen.getByRole('link', { name: 'sign in' })
    /* 路由链接同样落 <a href>（中键新开、复制地址照旧），但它是路由渲染的，点击不整页加载 */
    expect(link.getAttribute('href')).toBe('/app/login')
    expect(link.getAttribute('data-probe')).toBe('in-app')
  })

  it('renders the element the caller passes through render', () => {
    const Stub = ({ className, children, ...rest }: { className?: string; children?: React.ReactNode }) => (
      <span className={className} data-stub {...rest}>
        {children}
      </span>
    )
    renderInRouter(
      <Link href="/app/login" render={<Stub />}>
        sign in
      </Link>,
    )
    const stub = screen.getByText('sign in')
    expect(stub.tagName).toBe('SPAN')
    expect(stub.getAttribute('data-stub')).not.toBeNull()
    expect(stub.classList.contains('link')).toBe(true)
  })

  it('keeps the caller handlers and the anchor semantics together', async () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault())
    renderInRouter(
      <Link href="/app/register" onClick={onClick}>
        register
      </Link>,
    )
    const link = screen.getByRole('link', { name: 'register' })
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders without an href when the caller gives none', () => {
    renderInRouter(<Link>placeholder</Link>)
    const element = screen.getByText('placeholder')
    expect(element.tagName).toBe('A')
    expect(element.getAttribute('href')).toBeNull()
  })
})
