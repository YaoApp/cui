import { beforeEach, describe, expect, it } from 'vitest'
import { HOME_TAB } from './tabs'
import { useSecondaryTabsStore } from './secondary'

const reset = () => {
	useSecondaryTabsStore.setState({ tabs: [], activeKey: '', recent: [] })
}

describe('secondary tab group', () => {
	beforeEach(reset)

	it('seeds the home page once the split opens and leaves a non-empty group alone', () => {
		useSecondaryTabsStore.getState().seed()
		expect(useSecondaryTabsStore.getState().tabs).toEqual([HOME_TAB])
		expect(useSecondaryTabsStore.getState().activeKey).toBe(HOME_TAB.key)

		useSecondaryTabsStore.getState().open({ kind: 'external', url: 'https://example.com/a' })
		const before = useSecondaryTabsStore.getState().tabs
		useSecondaryTabsStore.getState().seed()
		expect(useSecondaryTabsStore.getState().tabs).toEqual(before)
	})

	it('reuses a page that already shows the same target', () => {
		useSecondaryTabsStore.getState().seed()
		useSecondaryTabsStore.getState().open({ kind: 'external', url: 'https://example.com/a' })
		const key = useSecondaryTabsStore.getState().activeKey
		useSecondaryTabsStore.getState().activate(HOME_TAB.key)
		useSecondaryTabsStore.getState().open({ kind: 'external', url: 'https://example.com/a' })
		expect(useSecondaryTabsStore.getState().activeKey).toBe(key)
		expect(useSecondaryTabsStore.getState().tabs).toHaveLength(2)
	})

	it('closes the active page onto the last remaining one, then empties the group', () => {
		const state = () => useSecondaryTabsStore.getState()
		state().seed()
		state().open({ kind: 'external', url: 'https://example.com/a' })
		state().open({ kind: 'external', url: 'https://example.com/b' })
		const [home, a, b] = state().tabs
		state().close(b.key)
		expect(state().tabs).toEqual([home, a])
		expect(state().activeKey).toBe(a.key)
		state().close(a.key)
		state().close(home.key)
		expect(state().tabs).toEqual([])
		expect(state().activeKey).toBe('')
	})

	it('moves a tab by the index counted after removal and clamps out-of-range input', () => {
		const state = () => useSecondaryTabsStore.getState()
		state().seed()
		state().open({ kind: 'external', url: 'https://example.com/a' })
		state().open({ kind: 'external', url: 'https://example.com/b' })
		const [home, a, b] = state().tabs
		state().move(home.key, 1)
		expect(state().tabs.map((tab) => tab.key)).toEqual([a.key, home.key, b.key])
		state().move(b.key, 99)
		expect(state().tabs.map((tab) => tab.key)).toEqual([a.key, home.key, b.key])
		state().move('missing', 0)
		expect(state().tabs.map((tab) => tab.key)).toEqual([a.key, home.key, b.key])
	})

	it('navigates inside a page and drops the page when the target already lives elsewhere', () => {
		const state = () => useSecondaryTabsStore.getState()
		state().seed()
		state().open({ kind: 'external', url: 'https://example.com/a' })
		const a = state().activeKey
		state().navigate(a, { kind: 'external', url: 'https://example.com/b' })
		expect(state().tabs.find((tab) => tab.key === a)?.target).toEqual({ kind: 'external', url: 'https://example.com/b' })

		state().open({ kind: 'external', url: 'https://example.com/c' })
		const c = state().activeKey
		state().navigate(c, { kind: 'external', url: 'https://example.com/b' })
		expect(state().tabs.some((tab) => tab.key === c)).toBe(false)
		expect(state().activeKey).toBe(a)
	})

	it('closes all and keeps its own recent list', () => {
		const state = () => useSecondaryTabsStore.getState()
		state().seed()
		state().open({ kind: 'external', url: 'https://example.com/a' })
		expect(state().recent[0]?.label).toContain('example.com/a')
		state().closeAll()
		expect(state().tabs).toEqual([])
		expect(state().activeKey).toBe('')
		expect(state().recent).toHaveLength(1)
	})
})
