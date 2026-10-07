/* 链接：默认落锚元素、外部地址补 target 与 rel、render 换元素、类名与属性按上游规则合并。 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Link } from './link'

describe('the link', () => {
  it('renders an anchor with its href and the link class', () => {
    render(
      <Link href="https://example.com/docs" className="terms-note__link">
        docs
      </Link>,
    )
    const link = screen.getByRole('link', { name: 'docs' }) as HTMLAnchorElement
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('https://example.com/docs')
    /* 组件自己的类与调用方的类并存，调用方的不会被覆盖 */
    expect(link.classList.contains('link')).toBe(true)
    expect(link.classList.contains('terms-note__link')).toBe(true)
    /* 站内链接不开新窗口 */
    expect(link.getAttribute('target')).toBeNull()
    expect(link.getAttribute('rel')).toBeNull()
  })

  it('opens an external address in a new window and cuts the opener link', () => {
    render(
      <Link href="https://example.com/terms" external>
        terms
      </Link>,
    )
    const link = screen.getByRole('link', { name: 'terms' })
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('renders the element the caller passes through render', () => {
    const Stub = ({ className, children, ...rest }: { className?: string; children?: React.ReactNode }) => (
      <span className={className} data-stub {...rest}>
        {children}
      </span>
    )
    render(
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
    render(
      <Link href="/app/register" onClick={onClick}>
        register
      </Link>,
    )
    const link = screen.getByRole('link', { name: 'register' })
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders without an href when the caller gives none', () => {
    render(<Link>placeholder</Link>)
    const element = screen.getByText('placeholder')
    expect(element.tagName).toBe('A')
    expect(element.getAttribute('href')).toBeNull()
  })
})
