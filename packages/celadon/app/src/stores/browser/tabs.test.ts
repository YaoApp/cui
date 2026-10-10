import { describe, expect, it, beforeEach } from 'vitest'
import { HOME_TAB, sameTab, tabKey, useTabsStore, type TabEntry } from './tabs'

const web = (id: string): TabEntry => ({ kind: 'browser-web', id })

const reset = () => {
  useTabsStore.setState({ tabs: [HOME_TAB], activeKey: tabKey(HOME_TAB) })
}

describe('标签集', () => {
  beforeEach(reset)

  it('starts with the home tab active', () => {
    const state = useTabsStore.getState()
    expect(state.tabs).toEqual([HOME_TAB])
    expect(state.activeKey).toBe('browser-home:home')
  })

  it('opens a page and stops on it', () => {
    useTabsStore.getState().open(web('https://example.com'))
    const state = useTabsStore.getState()
    expect(state.tabs).toHaveLength(2)
    expect(state.activeKey).toBe('browser-web:https://example.com')
  })

  it('reuses the same page instead of opening a second one', () => {
    useTabsStore.getState().open(web('https://example.com'))
    useTabsStore.getState().open(HOME_TAB)
    useTabsStore.getState().open(web('https://example.com'))
    const state = useTabsStore.getState()
    expect(state.tabs).toHaveLength(2)
    expect(state.activeKey).toBe('browser-web:https://example.com')
  })

  it('never closes the home tab', () => {
    useTabsStore.getState().close(HOME_TAB)
    expect(useTabsStore.getState().tabs).toEqual([HOME_TAB])
  })

  it('falls back to the left neighbour when the active page closes', () => {
    useTabsStore.getState().open(web('a'))
    useTabsStore.getState().open(web('b'))
    useTabsStore.getState().close(web('b'))
    expect(useTabsStore.getState().activeKey).toBe('browser-web:a')
    useTabsStore.getState().close(web('a'))
    expect(useTabsStore.getState().activeKey).toBe('browser-home:home')
  })

  it('keeps the active page when another one closes', () => {
    useTabsStore.getState().open(web('a'))
    useTabsStore.getState().open(web('b'))
    useTabsStore.getState().close(web('a'))
    expect(useTabsStore.getState().activeKey).toBe('browser-web:b')
  })

  it('activates an open page', () => {
    useTabsStore.getState().open(web('a'))
    useTabsStore.getState().activate(HOME_TAB)
    expect(useTabsStore.getState().activeKey).toBe('browser-home:home')
  })

  it('compares entries by kind and id', () => {
    expect(sameTab(web('a'), { kind: 'browser-web', id: 'a' })).toBe(true)
    expect(sameTab(web('a'), { kind: 'app-slice', id: 'a' })).toBe(false)
  })
})
