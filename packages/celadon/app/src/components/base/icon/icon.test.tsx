import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Icon } from '@/components/base/icon'

describe('Icon', () => {
  it('points at the symbol by name', () => {
    const { container } = render(<Icon name="i-act-refresh" />)
    expect(container.querySelector('use')?.getAttribute('href')).toBe('#i-act-refresh')
  })

  it('defaults to the product size and follows the size prop', () => {
    const { container, rerender } = render(<Icon name="i-chat" />)
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('16')
    rerender(<Icon name="i-chat" size={24} />)
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('24')
  })

  it('is decorative unless it carries a label', () => {
    const { container, rerender } = render(<Icon name="i-chat" />)
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
    rerender(<Icon name="i-chat" label="会话" />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('role')).toBe('img')
    expect(svg?.getAttribute('aria-label')).toBe('会话')
    expect(svg?.getAttribute('aria-hidden')).toBeNull()
  })
})
