import { describe, expect, it } from 'vitest'
import {
	HOME_TAB,
	activateIn,
	appendIn,
	closeAllIn,
	closeIn,
	closeOthersIn,
	homeIn,
	moveIn,
	navigateIn,
	nextKey,
	rememberIn,
	type GroupState,
	type TabEntry
} from './tab-group'

const page = (key: string, url: string): TabEntry => ({ key, target: { kind: 'external', url } })
const group = (tabs: TabEntry[], activeKey = tabs[0]?.key ?? ''): GroupState => ({ tabs, activeKey, recent: [] })

describe('tab group actions', () => {
	it('appends and activates a page, keeping the old ones in place', () => {
		const before = group([HOME_TAB])
		const after = appendIn(before, page('page-1', 'https://a.example'))
		expect(after.tabs.map((tab) => tab.key)).toEqual(['home', 'page-1'])
		expect(after.activeKey).toBe('page-1')
		expect(before.tabs).toHaveLength(1)
	})

	it('navigates inside a page and drops it when the target already lives elsewhere', () => {
		const before = group([HOME_TAB, page('page-1', 'https://a.example'), page('page-2', 'https://b.example')], 'page-2')
		const moved = navigateIn(before, 'page-2', { kind: 'external', url: 'https://c.example' })
		expect(moved.tabs.find((tab) => tab.key === 'page-2')?.target).toEqual({
			kind: 'external',
			url: 'https://c.example'
		})
		const dropped = navigateIn(moved, 'page-2', { kind: 'external', url: 'https://a.example' })
		expect(dropped.tabs.some((tab) => tab.key === 'page-2')).toBe(false)
		expect(dropped.activeKey).toBe('page-1')
	})

	it('closes onto the right neighbour and restores the home page when the last one goes', () => {
		const before = group([HOME_TAB, page('page-1', 'https://a.example'), page('page-2', 'https://b.example')], 'page-1')
		const closed = closeIn(before, 'page-1')
		expect(closed.tabs.map((tab) => tab.key)).toEqual(['home', 'page-2'])
		expect(closed.activeKey).toBe('page-2')
		const emptied = closeIn(closeIn(closed, 'page-2'), 'home')
		expect(emptied.tabs).toEqual([HOME_TAB])
	})

	it('keeps the home page only when asked to (the primary group)', () => {
		const before = group([HOME_TAB], 'home')
		expect(closeIn(before, 'home').tabs).toHaveLength(1)
		expect(closeIn(before, 'home', { keepHome: false }).tabs).toHaveLength(0)
	})

	it('closes others and all with the primary and the secondary rules', () => {
		const before = group([HOME_TAB, page('page-1', 'https://a.example'), page('page-2', 'https://b.example')], 'page-2')
		expect(closeOthersIn(before, 'page-1').tabs.map((tab) => tab.key)).toEqual(['home', 'page-1'])
		expect(closeOthersIn(before, 'page-1', { keepHome: false }).tabs.map((tab) => tab.key)).toEqual(['page-1'])
		expect(closeAllIn(before).tabs.map((tab) => tab.key)).toEqual(['home'])
		expect(closeAllIn(before, { keepHome: false }).tabs).toEqual([])
	})

	it('moves by the index counted after removal and clamps out-of-range input', () => {
		const before = group([HOME_TAB, page('page-1', 'https://a.example'), page('page-2', 'https://b.example')])
		expect(moveIn(before, 'home', 1).tabs.map((tab) => tab.key)).toEqual(['page-1', 'home', 'page-2'])
		expect(moveIn(before, 'page-2', 99).tabs.map((tab) => tab.key)).toEqual(['home', 'page-1', 'page-2'])
		expect(moveIn(before, 'page-2', Number.NaN)).toBe(before)
		expect(moveIn(before, 'missing', 0)).toBe(before)
	})

	it('activates only an existing page and falls back to the home page for an empty group', () => {
		const before = group([HOME_TAB, page('page-1', 'https://a.example')], 'page-1')
		expect(activateIn(before, 'home').activeKey).toBe('home')
		expect(activateIn(before, 'missing')).toBe(before)
		const empty = group([], '')
		expect(homeIn(empty).tabs).toEqual([HOME_TAB])
		expect(homeIn(before)).toBe(before)
	})

	it('allocates keys across groups and remembers the recent targets once', () => {
		const first = nextKey([], 'page')
		const second = nextKey([{ ...HOME_TAB, key: first }], 'page')
		expect(first).not.toBe(second)
		const recent = rememberIn(rememberIn([], { kind: 'external', url: 'https://a.example' }), {
			kind: 'external',
			url: 'https://a.example'
		})
		expect(recent).toHaveLength(1)
		for (let index = 0; index < 12; index += 1) {
			rememberIn([], { kind: 'external', url: `https://example.com/${index}` })
		}
		expect(rememberIn([], { kind: 'home' })).toHaveLength(0)
	})
})
