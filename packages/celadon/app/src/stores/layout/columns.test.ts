import { describe, expect, it, beforeEach } from 'vitest'
import { useColumnsStore } from './columns'

const reset = () => {
  useColumnsStore.setState({
    navCollapsed: false,
    navMainCollapsed: false,
    browserCollapsed: false,
    browserSide: 'right',
  })
}

describe('三栏的布局事实', () => {
  beforeEach(reset)

  it('starts expanded on the right', () => {
    const state = useColumnsStore.getState()
    expect(state.navCollapsed).toBe(false)
    expect(state.navMainCollapsed).toBe(false)
    expect(state.browserCollapsed).toBe(false)
    expect(state.browserSide).toBe('right')
  })

  it('toggles the navigation column', () => {
    useColumnsStore.getState().toggleNav()
    expect(useColumnsStore.getState().navCollapsed).toBe(true)
    useColumnsStore.getState().toggleNav()
    expect(useColumnsStore.getState().navCollapsed).toBe(false)
  })

  it('folds only the main navigation', () => {
    useColumnsStore.getState().toggleNavMain()
    const state = useColumnsStore.getState()
    expect(state.navMainCollapsed).toBe(true)
    expect(state.navCollapsed).toBe(false)
  })

  it('collapses the browser column and moves it to the other side', () => {
    useColumnsStore.getState().toggleBrowser()
    useColumnsStore.getState().setBrowserSide('left')
    const state = useColumnsStore.getState()
    expect(state.browserCollapsed).toBe(true)
    expect(state.browserSide).toBe('left')
  })

  it('sets the navigation column explicitly', () => {
    useColumnsStore.getState().setNavCollapsed(true)
    expect(useColumnsStore.getState().navCollapsed).toBe(true)
  })
})
