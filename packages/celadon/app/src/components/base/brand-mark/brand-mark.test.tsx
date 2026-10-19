import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BrandMark } from '@/components/base/brand-mark'

describe('BrandMark', () => {
  it('carries the class the stylesheet hooks onto and points at the sprite by name', () => {
    const { container } = render(<BrandMark name="brand-yao" />)
    const svg = container.querySelector('svg')

    expect(svg).toHaveClass('brand-mark')
    expect(svg?.querySelector('use')?.getAttribute('href')).toBe('#brand-yao')
  })

  it('defaults to 24 and follows the size prop', () => {
    const { container, rerender } = render(<BrandMark name="brand-yao" />)
    const svg = container.querySelector('svg')

    expect(svg).toHaveAttribute('width', '24')
    expect(svg).toHaveAttribute('height', '24')

    rerender(<BrandMark name="brand-yao" size={32} />)
    expect(svg).toHaveAttribute('width', '32')
    expect(svg).toHaveAttribute('height', '32')
  })

  it('is decorative unless it carries a label', () => {
    const { container } = render(<BrandMark name="brand-yao" />)

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('svg')).not.toHaveAttribute('role')
  })

  it('becomes a labelled image when the caller gives it a name', () => {
    const { container } = render(<BrandMark name="brand-yao" label="Yao" />)
    const svg = container.querySelector('svg')

    expect(svg).toHaveAttribute('role', 'img')
    expect(svg).toHaveAttribute('aria-label', 'Yao')
    expect(svg).not.toHaveAttribute('aria-hidden')
  })

  it('renders the light and dark Ghost vectors for the current mark', () => {
    const { container } = render(<BrandMark name="brand-yao-agents" size={32} label="Yao Agents" />)
    const mark = container.querySelector('.brand-mark--image')
    const light = container.querySelector('.brand-mark__img--light')
    const dark = container.querySelector('.brand-mark__img--dark')

    expect(mark).toHaveClass('brand-mark', 'brand-mark--image')
    expect(mark).toHaveAttribute('role', 'img')
    expect(mark).toHaveAttribute('aria-label', 'Yao Agents')
    expect(mark).toHaveStyle({ width: '32px', height: '32px' })
    expect(light?.getAttribute('src')).toContain('/brand/yao-agents-ghost.svg')
    expect(dark?.getAttribute('src')).toContain('/brand/yao-agents-ghost-dark.svg')
    expect(light).toHaveAttribute('alt', '')
    expect(dark).toHaveAttribute('alt', '')
  })

  it('keeps the old sprite path for the archived marks', () => {
    const { container } = render(<BrandMark name="brand-yao" />)
    expect(container.querySelector('svg use')?.getAttribute('href')).toBe('#brand-yao')
  })

  it('takes the caller class without dropping its own', () => {
    const { container } = render(<BrandMark name="brand-yao" className="brand-slot" />)

    expect(container.querySelector('svg')).toHaveClass('brand-mark', 'brand-slot')
  })
})
