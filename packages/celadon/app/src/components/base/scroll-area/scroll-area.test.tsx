import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScrollArea } from './scroll-area'

describe('ScrollArea', () => {
  it('renders its content inside a scrollable viewport', () => {
    render(
      <ScrollArea>
        <p>三栏内容</p>
      </ScrollArea>,
    )
    expect(screen.getByText('三栏内容')).toBeVisible()
    expect(document.querySelector('.scroll-area__viewport')).not.toBeNull()
  })

  it('carries the size class, medium by default and small on request', () => {
    const { unmount } = render(
      <ScrollArea>
        <p>默认档</p>
      </ScrollArea>,
    )
    expect(document.querySelector('.scroll-area')?.classList.contains('scroll-area--medium')).toBe(true)
    unmount()
    render(
      <ScrollArea size="small">
        <p>小档</p>
      </ScrollArea>,
    )
    expect(document.querySelector('.scroll-area')?.classList.contains('scroll-area--small')).toBe(true)
  })

  it('keeps the caller class alongside its own', () => {
    render(
      <ScrollArea className="nav__scroll">
        <p>列表</p>
      </ScrollArea>,
    )
    const root = document.querySelector('.scroll-area')
    expect(root?.classList.contains('nav__scroll')).toBe(true)
  })
})
