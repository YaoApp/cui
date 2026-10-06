import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Spinner } from '@/components/base/spinner'

describe('Spinner', () => {
  it('carries the class the stylesheet hooks onto and stays out of the accessibility tree', () => {
    /* 尺寸、颜色与旋转全由 `.spinner` 这个类给（见 spinner.less）；类没了指示器就静默失效。 */
    const { container } = render(<Spinner />)
    const svg = container.querySelector('svg')

    expect(svg).toHaveClass('spinner')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('focusable', 'false')
  })

  it('draws two identical lobes, one turned half a circle, so the ring reads as round', () => {
    /* 一瓣读不出圆；两瓣互成 180° 才既读得出圆、又留出两段空隙看得出在转（见 spinner.tsx 顶部注释）。 */
    const { container } = render(<Spinner />)
    const paths = [...container.querySelectorAll('path')]

    expect(paths).toHaveLength(2)
    expect(paths[0].getAttribute('d')).toBe(paths[1].getAttribute('d'))
    expect(paths[1].getAttribute('transform')).toBe('rotate(180 8 8)')
  })

  it('keeps one square coordinate system so both lobes share the same geometry', () => {
    const { container } = render(<Spinner />)

    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 16 16')
  })
})
