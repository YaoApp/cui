import { beforeEach, describe, expect, it } from 'vitest'
import { HOME_TAB } from './tab-group'
import { isEmpty, useSecondaryTabsStore } from './secondary'

const reset = () => {
	useSecondaryTabsStore.setState({ tabs: [], activeKey: '', recent: [] })
}

const state = () => useSecondaryTabsStore.getState()

describe('secondary tab group', () => {
	beforeEach(reset)

	it('seeds one home page when the split opens and leaves a non-empty group alone', () => {
		state().seed()
		expect(state().tabs).toEqual([HOME_TAB])
		expect(state().activeKey).toBe(HOME_TAB.key)
		expect(isEmpty(state())).toBe(false)

		state().open({ kind: 'external', url: 'https://a.example' })
		const before = state().tabs
		state().seed()
		expect(state().tabs).toEqual(before)
	})

	it('lets the seeded home page be closed, unlike the primary group', () => {
		state().seed()
		state().close(HOME_TAB.key)
		expect(state().tabs).toEqual([])
		expect(state().activeKey).toBe('')
		expect(isEmpty(state())).toBe(true)
	})

	it('closes the active page onto the remaining last one', () => {
		state().seed()
		state().open({ kind: 'external', url: 'https://a.example' })
		state().open({ kind: 'external', url: 'https://b.example' })
		const [home, a, b] = state().tabs
		state().close(b.key)
		expect(state().tabs).toEqual([home, a])
		expect(state().activeKey).toBe(a.key)
	})

	it('reuses a page that already shows the same target', () => {
		state().seed()
		state().open({ kind: 'external', url: 'https://a.example' })
		const key = state().activeKey
		state().activate(HOME_TAB.key)
		state().open({ kind: 'external', url: 'https://a.example' })
		expect(state().activeKey).toBe(key)
		expect(state().tabs).toHaveLength(2)
	})

	it('navigates inside a page and drops it when the target already lives elsewhere', () => {
		state().seed()
		state().open({ kind: 'external', url: 'https://a.example' })
		const a = state().activeKey
		state().navigate(a, { kind: 'external', url: 'https://b.example' })
		expect(state().tabs.find((tab) => tab.key === a)?.target).toEqual({ kind: 'external', url: 'https://b.example' })
		state().open({ kind: 'external', url: 'https://c.example' })
		const c = state().activeKey
		state().navigate(c, { kind: 'external', url: 'https://b.example' })
		expect(state().tabs.some((tab) => tab.key === c)).toBe(false)
		expect(state().activeKey).toBe(a)
	})

	it('moves by the index counted after removal and clamps out-of-range input', () => {
		state().seed()
		state().open({ kind: 'external', url: 'https://a.example' })
		state().open({ kind: 'external', url: 'https://b.example' })
		const [home, a, b] = state().tabs
		state().move(home.key, 1)
		expect(state().tabs.map((tab) => tab.key)).toEqual([a.key, home.key, b.key])
		state().move(b.key, 99)
		expect(state().tabs.map((tab) => tab.key)).toEqual([a.key, home.key, b.key])
	})

	it('closes all, keeps its own recent list and clears without dropping the history', () => {
		state().seed()
		state().open({ kind: 'external', url: 'https://a.example' })
		expect(state().recent[0]?.label).toContain('a.example')
		state().closeAll()
		expect(state().tabs).toEqual([])
		state().clear()
		expect(state().tabs).toEqual([])
		expect(state().recent).toHaveLength(1)
	})

	it('shares the global key allocator with the primary group', () => {
		state().seed()
		state().open({ kind: 'external', url: 'https://a.example' })
		state().open({ kind: 'external', url: 'https://b.example' })
		const keys = state().tabs.map((tab) => tab.key)
		expect(new Set(keys).size).toBe(keys.length)
	})
})

/* 升级路径：只测动作函数的话，把 `migrate` 整段删掉也照样绿，所以这里走真实的水合 */
describe('secondary tab group · hydration', () => {
	beforeEach(() => {
		window.localStorage.clear()
		reset()
	})

	const store = (data: unknown) =>
		window.localStorage.setItem('cui.browser.secondary', JSON.stringify({ state: data, version: 1 }))

	it('falls back to the first page when the stored active page is gone', async () => {
		store({
			tabs: [
				{ key: 'secondary-1', target: { kind: 'home' } },
				{ key: 'secondary-2', target: { kind: 'external', url: 'https://a.example' } }
			],
			activeKey: 'secondary-9',
			recent: [{ key: 'secondary-2', label: 'a.example', target: { kind: 'external', url: 'https://a.example' } }]
		})
		await useSecondaryTabsStore.persist.rehydrate()
		expect(useSecondaryTabsStore.getState().tabs).toHaveLength(2)
		expect(useSecondaryTabsStore.getState().activeKey).toBe('secondary-1')
		expect(useSecondaryTabsStore.getState().recent).toHaveLength(1)
	})

	it('keeps a stored active page that still exists', async () => {
		store({
			tabs: [
				{ key: 'secondary-1', target: { kind: 'home' } },
				{ key: 'secondary-2', target: { kind: 'external', url: 'https://a.example' } }
			],
			activeKey: 'secondary-2',
			recent: []
		})
		await useSecondaryTabsStore.persist.rehydrate()
		expect(useSecondaryTabsStore.getState().activeKey).toBe('secondary-2')
	})

	it('treats a record without pages as an empty group', async () => {
		store({ activeKey: 'secondary-1' })
		await useSecondaryTabsStore.persist.rehydrate()
		expect(useSecondaryTabsStore.getState().tabs).toEqual([])
		expect(useSecondaryTabsStore.getState().activeKey).toBe('')
		expect(useSecondaryTabsStore.getState().recent).toEqual([])
	})
})
