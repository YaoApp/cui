import { describe, expect, it, beforeEach } from 'vitest'
import type { TabTarget } from './targets'
import { HOME_TAB, isHome, tabKey, useTabsStore, type TabEntry } from './tabs'

const external = (url: string): TabTarget => ({ kind: 'external', url })
const at = (key: string): TabEntry | undefined => useTabsStore.getState().tabs.find((tab) => tab.key === key)

const reset = () => {
	useTabsStore.setState({ tabs: [HOME_TAB], activeKey: tabKey(HOME_TAB) })
}

describe('标签集', () => {
	beforeEach(reset)

	it('还是首页那一页时不可关；换成普通一页之后能关，关完首页重新出现', () => {
		const state = useTabsStore.getState()
		expect(state.tabs).toEqual([HOME_TAB])
		expect(state.activeKey).toBe('home')
		expect(isHome(state.tabs[0])).toBe(true)

		/* 还是首页：关不动 */
		useTabsStore.getState().close('home')
		expect(useTabsStore.getState().tabs).toEqual([HOME_TAB])

		/* 换上目标之后它就是普通一页，可以关；关完一个不剩，首页回来 */
		useTabsStore.getState().navigate('home', external('example.com'))
		expect(useTabsStore.getState().tabs).toHaveLength(1)
		expect(isHome(useTabsStore.getState().tabs[0])).toBe(false)
		useTabsStore.getState().close('home')
		const after = useTabsStore.getState()
		expect(after.tabs).toEqual([HOME_TAB])
		expect(after.activeKey).toBe('home')
	})

	it('开一页：追加并停到它；同一目标再开只切过去', () => {
		useTabsStore.getState().open(external('example.com'))
		let state = useTabsStore.getState()
		expect(state.tabs).toHaveLength(2)
		const opened = state.tabs[1]
		expect(state.activeKey).toBe(opened.key)

		useTabsStore.getState().activate('home')
		useTabsStore.getState().open(external('example.com'))
		state = useTabsStore.getState()
		expect(state.tabs).toHaveLength(2)
		expect(state.activeKey).toBe(opened.key)
	})

	it('新建空页：出现一项并激活，页里再开东西时原位换内容', () => {
		useTabsStore.getState().openBlank()
		let state = useTabsStore.getState()
		expect(state.tabs).toHaveLength(2)
		const blank = state.tabs[1]
		expect(blank.target).toEqual({ kind: 'blank' })
		expect(state.activeKey).toBe(blank.key)

		useTabsStore.getState().navigate(blank.key, external('example.com'))
		state = useTabsStore.getState()
		expect(state.tabs).toHaveLength(2)
		expect(state.tabs[1].key).toBe(blank.key)
		expect(state.tabs[1].target).toEqual({ kind: 'external', url: 'example.com' })
		expect(state.activeKey).toBe(blank.key)
	})

	it('当前页已经是空页时再点新建，不叠第二个', () => {
		useTabsStore.getState().openBlank()
		useTabsStore.getState().openBlank()
		expect(useTabsStore.getState().tabs).toHaveLength(2)
	})

	it('首页也在自己的窗口里换内容：填上之后它就是那一页', () => {
		useTabsStore.getState().navigate('home', external('example.com'))
		const state = useTabsStore.getState()
		expect(state.tabs).toHaveLength(1)
		expect(state.tabs[0].key).toBe('home')
		expect(state.tabs[0].target).toEqual({ kind: 'external', url: 'example.com' })
		expect(state.activeKey).toBe('home')

		/* 关掉它：一个都不剩，首页重新出现 */
		useTabsStore.getState().close('home')
		expect(useTabsStore.getState().tabs).toEqual([HOME_TAB])
	})

	it('关当前页按右邻优先，没有右邻取左邻，都没有落回首页', () => {
		useTabsStore.getState().open(external('a'))
		const first = useTabsStore.getState().activeKey
		useTabsStore.getState().open(external('b'))
		const second = useTabsStore.getState().activeKey
		useTabsStore.getState().open(external('c'))
		const third = useTabsStore.getState().activeKey

		/* 关中间那页：右邻接上 */
		useTabsStore.getState().activate(second)
		useTabsStore.getState().close(second)
		expect(useTabsStore.getState().activeKey).toBe(third)

		/* 关最后一页：没有右邻，取左邻 */
		useTabsStore.getState().close(third)
		expect(useTabsStore.getState().activeKey).toBe(first)

		/* 关掉最后一页：落回首页 */
		useTabsStore.getState().close(first)
		expect(useTabsStore.getState().activeKey).toBe('home')
		expect(useTabsStore.getState().tabs).toEqual([HOME_TAB])
	})

	it('关的不是当前页时，当前页不动', () => {
		useTabsStore.getState().open(external('a'))
		const first = useTabsStore.getState().activeKey
		useTabsStore.getState().open(external('b'))
		const second = useTabsStore.getState().activeKey
		useTabsStore.getState().close(first)
		expect(useTabsStore.getState().activeKey).toBe(second)
		expect(at(second)).toBeDefined()
	})

	it('页的 key 在换内容前后不变', () => {
		useTabsStore.getState().openBlank()
		const blank = useTabsStore.getState().tabs[1]
		useTabsStore.getState().navigate(blank.key, { kind: 'internal', path: '/help' })
		expect(useTabsStore.getState().tabs[1].key).toBe(blank.key)
		expect(useTabsStore.getState().tabs[1].target).toEqual({ kind: 'internal', path: '/help' })
	})

	it('重排：索引按移除该项之后的数组算，向前向后都成立', () => {
		const state = useTabsStore.getState()
		state.open(external('a.com'))
		const second = useTabsStore.getState().tabs[1].key
		state.open(external('b.com'))
		const third = useTabsStore.getState().tabs[2].key
		const order = () => useTabsStore.getState().tabs.map(tabKey)
		expect(order()).toEqual([HOME_TAB.key, second, third])

		/* 把第三项移到最前：移除它之后数组是 [首页, 第二项]，插到 0 */
		useTabsStore.getState().move(third, 0)
		expect(order()).toEqual([third, HOME_TAB.key, second])

		/* 再把它移到末尾：此时移除它之后数组长 2，插到 2 */
		useTabsStore.getState().move(third, 2)
		expect(order()).toEqual([HOME_TAB.key, second, third])

		/* 往前一位 */
		useTabsStore.getState().move(third, 1)
		expect(order()).toEqual([HOME_TAB.key, third, second])
	})

	it('重排：越界夹取、小数取整、原地不动与未知 key 都不改变顺序', () => {
		const state = useTabsStore.getState()
		state.open(external('a.com'))
		const second = useTabsStore.getState().tabs[1].key
		state.open(external('b.com'))
		const third = useTabsStore.getState().tabs[2].key
		const order = () => useTabsStore.getState().tabs.map(tabKey)

		useTabsStore.getState().move(second, -5)
		expect(order()).toEqual([second, HOME_TAB.key, third])
		useTabsStore.getState().move(second, 99)
		expect(order()).toEqual([HOME_TAB.key, third, second])
		useTabsStore.getState().move(second, 99.7)
		expect(order()).toEqual([HOME_TAB.key, third, second])
		useTabsStore.getState().move('missing', 0)
		expect(order()).toEqual([HOME_TAB.key, third, second])
		/* 目标位置与现位置相同：不写状态，顺序不变 */
		useTabsStore.getState().move(third, 1)
		expect(order()).toEqual([HOME_TAB.key, third, second])
	})

	it('重排不动当前页', () => {
		const state = useTabsStore.getState()
		state.open(external('a.com'))
		const second = useTabsStore.getState().tabs[1].key
		state.activate(HOME_TAB.key)
		useTabsStore.getState().move(second, 0)
		expect(useTabsStore.getState().activeKey).toBe(HOME_TAB.key)
		expect(useTabsStore.getState().tabs[0].key).toBe(second)
	})
})
