import './layout.less'
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Browser, Home, Web, type BrowserTab } from '@/components/browser'
import { Content } from '@/components/content'
import { Nav, type NavItem } from '@/components/nav'
import { useAuthStore } from '@/features/auth/auth.store'
import { useLandingRecord } from '@/features/auth/use-landing-record'
import { InboxNav } from '@/features/inbox'
import { client, useWindowChrome } from '@/platform/client'
import { useMediaQuery } from '@/platform/client/use-media-query'
import type { I18nKey } from '@/platform/i18n/i18n-types'
import { useTranslation } from '@/platform/i18n'
import { HOME_TAB, tabKey, useTabsStore, type TabEntry } from '@/stores/browser/tabs'
import { useColumnsStore } from '@/stores/layout/columns'

/* 一级导航的六项：**路由信息的投影**，写在装配层（`architecture/07-routing.md`）。
   每一项一个图标加文字；「新任务」是动作但占一级位置（超高频，一步可达）。 */
const MAIN_ITEMS: NavItem[] = [
	{ key: 'new', icon: 'i-new-task', labelKey: 'shell.navigation.item.new', to: '/new' },
	{ key: 'apps', icon: 'i-apps', labelKey: 'shell.navigation.item.apps', to: '/apps' },
	{ key: 'inbox', icon: 'i-inbox', labelKey: 'shell.navigation.item.inbox', to: '/inbox' },
	{ key: 'board', icon: 'i-board', labelKey: 'shell.navigation.item.board', to: '/board' },
	{ key: 'workspace', icon: 'i-ws', labelKey: 'shell.navigation.item.workspace', to: '/workspace' },
	{ key: 'computer', icon: 'i-pc', labelKey: 'shell.navigation.item.computer', to: '/computer' }
]

/** 底部一行的两个快捷图标：与主导航里的工作空间、电脑是同一份内容、同一套图标。 */
const SHORTCUTS: NavItem[] = MAIN_ITEMS.filter((item) => item.key === 'workspace' || item.key === 'computer')

/* 三栏外壳：导航栏 | 内容区 | 标签浏览器。三栏的布局事实与标签集都在 `stores/`，
   这一层是唯一读它们的地方 —— 组件只收 props（见 architecture/03-boundaries.md §2）。 */
export function AppLayout() {
	const { t } = useTranslation()
	const location = useLocation()
	const navigate = useNavigate()
	useLandingRecord(location.pathname, location.search)

	const collapsed = useColumnsStore((state) => state.navCollapsed)
	const chrome = useWindowChrome()
	/* 视口不够宽时按收起呈现，与手动点收起走同一个状态、同一套样式：
     区别只在来源，视口驱动的这一档不写偏好。阈值取 token --nav-auto-collapse（970：导航区最小 + 内容区最小 + 侧栏最小 + 把手），
     即前两栏已经各自压到最小之后才轮到导航区收起（design/foundations.md F6）。 */
	const narrow = useMediaQuery('(width <= 969px)')
	/* 继续压窄到内容区最小 + 侧栏最小 + 把手（400 + 300 + 6），侧栏也让不动了，整条收起（F6 的最后一步）。 */
	const narrowForBrowser = useMediaQuery('(width <= 705px)')
	const toggleNav = useColumnsStore((state) => state.toggleNav)
	const mainFolded = useColumnsStore((state) => state.navMainCollapsed)
	const toggleMain = useColumnsStore((state) => state.toggleNavMain)
	const browserCollapsed = useColumnsStore((state) => state.browserCollapsed)
	const browserHidden = browserCollapsed || narrowForBrowser
	const browserSplit = useColumnsStore((state) => state.browserSplit)
	const setBrowserSplit = useColumnsStore((state) => state.setBrowserSplit)
	const splitRatio = useColumnsStore((state) => state.splitRatio)
	const setSplitRatio = useColumnsStore((state) => state.setSplitRatio)
	const browserWidth = useColumnsStore((state) => state.browserWidth)
	const setBrowserWidth = useColumnsStore((state) => state.setBrowserWidth)
	/* 聚焦哪个面板（0 是第一个）与第二个面板绑哪一页；后者为空时按上面的默认取 */
	const [focusedPane, setFocusedPane] = useState(0)
	const [secondaryKey, setSecondaryKey] = useState('')
	/* 面板独占整扇窗口：这一档把导航区与内容区让出去（见 design/main-shell.md §七） */
	const [exclusive, setExclusive] = useState(false)
	/* 独占档里 `Esc` 退出，回到原来的三栏（见 design/main-shell.md §七） */
	useEffect(() => {
		if (!exclusive) return
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setExclusive(false)
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [exclusive])
	/* 左右分栏要两个面板各有一个可用宽：导航区默认宽 + 内容区最小 + 两侧栏最小 + 把手
     （280 + 400 + 600 + 6 = 1286），窗口不够宽时这两颗键禁用（design/main-shell.md §五）。上下分栏按栏高判，这里不挡。 */
	const splitBlocked = useMediaQuery('(width <= 1285px)')
	const toggleBrowser = useColumnsStore((state) => state.toggleBrowser)
	const browserSide = useColumnsStore((state) => state.browserSide)
	const setBrowserSide = useColumnsStore((state) => state.setBrowserSide)
	const navWidth = useColumnsStore((state) => state.navWidth)
	const setNavWidth = useColumnsStore((state) => state.setNavWidth)

	const account = useAuthStore((state) => state.user)
	const tabs = useTabsStore((state) => state.tabs)
	const activeKey = useTabsStore((state) => state.activeKey)
	const openTab = useTabsStore((state) => state.open)
	const closeTab = useTabsStore((state) => state.close)
	const activateTab = useTabsStore((state) => state.activate)

	const mark = (item: NavItem): NavItem => ({
		...item,
		active: location.pathname.startsWith(item.to)
	})
	/* 「当前」区认的是所在的分区：名字与图标都取这一分区自己的那一项 */
	const current = [...MAIN_ITEMS]
		.sort((a, b) => b.to.length - a.to.length)
		.find((item) => location.pathname.startsWith(item.to))
	const scene: I18nKey = current?.labelKey ?? 'shell.navigation.scene.none'

	const nameOf = (tab: TabEntry): string => (tab.kind === 'browser-home' ? t('shell.browser.home') : tab.id)
	const byKey = (key: string): TabEntry | undefined => tabs.find((tab) => tabKey(tab) === key)
	const view: BrowserTab[] = tabs.map((tab) => ({
		key: tabKey(tab),
		label: nameOf(tab),
		closable: tab.kind !== 'browser-home'
	}))
	const active = tabs.find((tab) => tabKey(tab) === activeKey) ?? HOME_TAB
	/* 第二个面板绑自己那一页：默认取第一个不是当前页的标签，没有别的页时停在首页。
	   标签条上的点击落在**聚焦的那个面板**：面板 0 写全局当前页，面板 1 写它自己这一页 */
	const secondaryTab = byKey(secondaryKey) ?? tabs.find((tab) => tabKey(tab) !== activeKey) ?? HOME_TAB

	/* 一页的内容：两个面板共用同一个函数，分屏时各自渲染自己那一页 */
	const renderTab = (tab: TabEntry) => {
		if (tab.kind === 'browser-home')
			return (
				<Home
					recent={tabs
						.filter((item) => item.kind !== 'browser-home')
						.map((item) => ({ key: tabKey(item), label: nameOf(item) }))}
					onOpenAddress={(address) => openTab({ kind: 'browser-web', id: address })}
				/>
			)
		if (tab.kind === 'browser-web') return <Web address={tab.id} />
		return <p className='content__hint'>{t('shell.content.placeholder')}</p>
	}

	return (
		<div
			className='layout'
			data-client={client.kind}
			data-controls={chrome.controls}
			data-os={client.os || 'unknown'}
			data-width={collapsed || narrow ? 'zero' : 'panel'}
			data-nav={collapsed || narrow ? 'collapsed' : 'expanded'}
			data-browser={browserHidden ? 'collapsed' : browserSide}
			data-exclusive={exclusive ? 'true' : undefined}
		>
			<Nav
				items={MAIN_ITEMS.map(mark)}
				shortcuts={SHORTCUTS.map(mark)}
				scene={scene}
				sceneIcon={current?.icon ?? 'i-apps'}
				accountName={account?.name ?? account?.account ?? t('shell.navigation.account.placeholder')}
				collapsed={collapsed || narrow}
				onToggle={toggleNav}
				mainFolded={mainFolded}
				onToggleMain={toggleMain}
				onSelect={(item) => navigate(item.to)}
				navWidth={navWidth}
				onNavWidth={setNavWidth}
			>
				{location.pathname.startsWith('/inbox') ? <InboxNav /> : null}
			</Nav>
			<Content
				title={t('shell.content.demoTitle')}
				navCollapsed={collapsed || narrow}
				/* 给列头的是**实际**状态：窗口窄到放不下这一栏时它本来就是收起的，
				   切换键同时置灰并给出原因，避免按下去什么都不发生 */
				browserCollapsed={browserHidden}
				browserBlocked={narrowForBrowser}
				onToggleNav={toggleNav}
				onToggleBrowser={toggleBrowser}
			>
				<Outlet />
			</Content>
			<Browser
				tabs={view}
				activeKey={activeKey}
				side={browserSide}
				collapsed={browserHidden}
				split={browserSplit}
				splitBlocked={splitBlocked}
				splitRatio={splitRatio}
				onSplitRatio={setSplitRatio}
				width={browserWidth}
				onWidth={setBrowserWidth}
				onSplit={(next) => {
					/* 每次从单面板进分屏都从平分开始：上次拖过的比例会让点下去那一下跳 */
					if (next !== 'none') setSplitRatio(0.5)
					setBrowserSplit(next)
				}}
				onActivate={(key) => {
					/* 标签条的点击落在聚焦的那个面板：第二个面板聚焦时只换它自己那一页 */
					if (focusedPane === 1 && browserSplit !== 'none') {
						setSecondaryKey(key)
						return
					}
					const tab = byKey(key)
					if (tab) activateTab(tab)
				}}
				onClose={(key) => {
					const tab = byKey(key)
					if (tab) closeTab(tab)
				}}
				onNew={() => activateTab(HOME_TAB)}
				onMove={() => setBrowserSide(browserSide === 'right' ? 'left' : 'right')}
				onCollapse={() => {
					/* 独占档里收掉这一栏：先退出独占。否则导航区与内容区都在让位、本栏又收成零宽，
					   整扇窗口空着，重新展开的入口也不在（它在内容列头里） */
					setExclusive(false)
					toggleBrowser()
				}}
				secondary={renderTab(secondaryTab)}
				secondaryLabel={nameOf(secondaryTab)}
				focusedPane={focusedPane}
				onFocusPane={setFocusedPane}
				exclusive={exclusive}
				onExclusive={() => setExclusive(!exclusive)}
			>
				{renderTab(active)}
			</Browser>
		</div>
	)
}
