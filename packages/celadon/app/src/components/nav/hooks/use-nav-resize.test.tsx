import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Nav } from '../nav'
import { MemoryRouter } from 'react-router'
import type { NavItem } from '../nav.types'

const items: NavItem[] = [
  { key: 'inbox', icon: 'i-inbox', labelKey: 'shell.navigation.item.inbox', to: '/inbox' },
]

/* 上下限每次按窗口算：无头环境的窗口宽 1024，上限因此是 1024 − 400 − 300 */
const EXPECTED_MAX = Math.min(420, window.innerWidth - 400 - 300)

function renderRail() {
  const onNavWidth = vi.fn()
  render(
    <MemoryRouter>
      <Nav
        items={items}
        shortcuts={[]}
        scene="shell.navigation.scene.none"
        sceneIcon="i-inbox"
        accountName="Wren"
        collapsed={false}
        onToggle={vi.fn()}
        mainFolded={false}
        onToggleMain={vi.fn()}
        onSelect={vi.fn()}
        navWidth={null}
        onNavWidth={onNavWidth}
      />
    </MemoryRouter>,
  )
  return { onNavWidth }
}

/* jsdom 里没有真实布局，样式表也不参与计算，因此这些用例只验动作契约：
   键盘步长、上下限的钳制、双击复位与拖动过程中不写状态。宽度与观感由浏览器用例验。 */
describe('the navigation column resize handle', () => {
  it('offers a separator with the current value and both limits', () => {
    renderRail()
    const handle = screen.getByRole('separator', { name: '调整导航列宽度' })
    expect(handle).toBeTruthy()
    expect(handle.getAttribute('aria-orientation')).toBe('vertical')
    expect(Number(handle.getAttribute('aria-valuenow'))).toBe(280)
    expect(Number(handle.getAttribute('aria-valuemin'))).toBe(264)
    expect(Number(handle.getAttribute('aria-valuemax'))).toBe(EXPECTED_MAX)
  })

  it('steps the width with the arrow keys and clamps at the limits', () => {
    const { onNavWidth } = renderRail()
    const handle = screen.getByRole('separator', { name: '调整导航列宽度' })
    fireEvent.keyDown(handle, { key: 'ArrowRight' })
    expect(onNavWidth).toHaveBeenLastCalledWith(288)
    fireEvent.keyDown(handle, { key: 'ArrowLeft' })
    expect(onNavWidth).toHaveBeenLastCalledWith(272)
    fireEvent.keyDown(handle, { key: 'End' })
    expect(onNavWidth).toHaveBeenLastCalledWith(EXPECTED_MAX)
    fireEvent.keyDown(handle, { key: 'Home' })
    expect(onNavWidth).toHaveBeenLastCalledWith(264)
  })

  it('resets to the default width on a double click', () => {
    const { onNavWidth } = renderRail()
    fireEvent.doubleClick(screen.getByRole('separator', { name: '调整导航列宽度' }))
    expect(onNavWidth).toHaveBeenCalledWith(null)
  })

  it('keeps the state untouched while the pointer is down', async () => {
    const { onNavWidth } = renderRail()
    const handle = screen.getByRole('separator', { name: '调整导航列宽度' })
    await act(async () => {
      fireEvent.pointerDown(handle, { pointerId: 1, clientX: 300 })
    })
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 340 })
    expect(onNavWidth).not.toHaveBeenCalled()
    await act(async () => {
      fireEvent.pointerUp(handle, { pointerId: 1, clientX: 340 })
    })
    expect(onNavWidth).toHaveBeenCalledTimes(1)
  })
})
