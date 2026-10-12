import { describe, expect, it, vi } from 'vitest'
import { render, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Nav } from './nav'
import type { NavItem } from './nav.types'

/* 列头与品牌行按平台分工：Web 列头画品牌与两个键（一级菜单键 + 整列收起键），没有品牌行；
   macOS 列头只留整列收起键，一级菜单键在品牌行右端；Windows 列头整块不渲染，
   那个键由壳与内容列头承担。平台判定来自 `platform/client` 的钩子。 */
const chrome = {
	visible: true,
	controls: 'none' as 'native' | 'own' | 'none',
	maximized: false,
	toggleMaximize: vi.fn(),
	dragState: 'idle',
	minimize: vi.fn(),
	close: vi.fn()
}

vi.mock('@/platform/client', () => ({ useWindowChrome: () => chrome }))

const items: NavItem[] = [
	{ key: 'new', icon: 'i-plus', labelKey: 'shell.navigation.item.new', to: '/inbox' },
	{ key: 'inbox', icon: 'i-inbox', labelKey: 'shell.navigation.item.inbox', to: '/inbox', active: true }
]

function renderNav() {
	render(
		<MemoryRouter>
			<Nav
				items={items}
				shortcuts={[]}
				scene='shell.navigation.scene.none'
				sceneIcon='i-inbox'
				accountName='Wren'
				collapsed={false}
				onToggle={vi.fn()}
				mainFolded={false}
				onToggleMain={vi.fn()}
				onSelect={vi.fn()}
				navWidth={null}
				onNavWidth={vi.fn()}
			/>
		</MemoryRouter>
	)
	const header = document.querySelector('.nav__header') as HTMLElement | null
	const brandRow = document.querySelector('.nav__brand-row') as HTMLElement | null
	return { header, brandRow }
}

describe('导航列按平台呈现', () => {
	it('Web：列头画品牌与两个键，不画品牌行', () => {
		chrome.controls = 'none'
		const nav = renderNav()
		if (!nav.header) throw new Error('列头没有渲染')
		expect(within(nav.header).getByRole('button', { name: '折叠主导航' })).toBeInTheDocument()
		expect(within(nav.header).getByRole('button', { name: '收起导航' })).toBeInTheDocument()
		expect(nav.header.querySelector('.nav__brand')).not.toBeNull()
		expect(nav.brandRow).toBeNull()
	})

	it('macOS：列头只留整列收起键，品牌行给出折叠键', () => {
		chrome.controls = 'native'
		const nav = renderNav()
		if (!nav.header) throw new Error('列头没有渲染')
		if (!nav.brandRow) throw new Error('品牌行没有渲染')
		expect(within(nav.header).getByRole('button', { name: '收起导航' })).toBeInTheDocument()
		expect(within(nav.header).queryByRole('button', { name: '折叠主导航' })).toBeNull()
		expect(within(nav.brandRow).getByRole('button', { name: '折叠主导航' })).toBeInTheDocument()
	})

	it('Windows：列头整块不渲染，品牌行给出折叠键', () => {
		chrome.controls = 'own'
		const nav = renderNav()
		if (!nav.brandRow) throw new Error('品牌行没有渲染')
		expect(nav.header).toBeNull()
		expect(within(nav.brandRow).getByRole('button', { name: '折叠主导航' })).toBeInTheDocument()
	})
})
