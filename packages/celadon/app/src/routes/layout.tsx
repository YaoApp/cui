import './layout.less'
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Browser, TabPage, type BrowserTab } from '@/components/browser'
import { Content, type HeadKey } from '@/components/content'
import { Nav, type NavItem } from '@/components/nav'
import { useAuthStore } from '@/features/auth/auth.store'
import { useLandingRecord } from '@/features/auth/hooks/use-landing-record'
import { InboxNav } from '@/features/inbox'
import { client, useWindowChrome } from '@/platform/client'
import { useMediaQuery } from '@/platform/client/use-media-query'
import type { I18nKey } from '@/platform/i18n/i18n-types'
import type { IconId } from '@/platform/icons'
import { useTranslation } from '@/platform/i18n'
import { HOME_TAB, tabKey, useTabsStore, type TabEntry } from '@/stores/browser/tabs'
import { isAddressLike, parseTarget, targetLabel } from '@/stores/browser/targets'
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

/* 标签浏览器的默认栏宽取 token --side-width-reading，与组件自己的默认值同一口径；
   写死数字会让 token 改了不生效。token 声明在主题作用域（`.celadon`，挂在 body 上）而不是根元素，
   所以读 body；首次读取后缓存，样式表不变就不必反复算。 */
let sideWidthReadingCache: number | null = null
function sideWidthReading(): number {
	if (sideWidthReadingCache !== null) return sideWidthReadingCache
	const value = Number.parseFloat(getComputedStyle(document.body).getPropertyValue('--side-width-reading'))
	sideWidthReadingCache = Number.isFinite(value) ? value : 400
	return sideWidthReadingCache
}

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
     区别只在来源，视口驱动的这一档不写偏好。阈值取 token --nav-auto-collapse（988：导航列默认宽 280 + 内容区最小 + 侧栏最小 + 把手），
     即前两栏已经各自压到最小之后才轮到导航区收起（design/foundations.md F6）。 */
	const narrow = useMediaQuery('(width <= 987px)')
	/* 存下来的栏宽是偏好值：窗口放不下时按可用宽度收。否则列会被 max-inline-size 夹住，
	   而栏内的定尺壳仍按存值画，左半边就被裁掉（把窗口拖窄之后，先前拖过的宽值还留着，就会这样）。 */
	const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth)
	useEffect(() => {
		const onResize = () => setViewportWidth(window.innerWidth)
		window.addEventListener('resize', onResize)
		return () => window.removeEventListener('resize', onResize)
	}, [])
	/* 继续压窄到主栏最小 + 次栏最小 + 把手（400 + 300 + 8），次栏也让不动了，整条收起（F6 的最后一步）。
	   收掉的是次栏：正常态是标签浏览器，镜像态是内容区。 */
	const narrowForSecondary = useMediaQuery('(width <= 707px)')
	const toggleNav = useColumnsStore((state) => state.toggleNav)
	const mainFolded = useColumnsStore((state) => state.navMainCollapsed)
	const toggleMain = useColumnsStore((state) => state.toggleNavMain)
	const browserCollapsed = useColumnsStore((state) => state.browserCollapsed)
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
     （280 + 400 + 600 + 8 = 1288），窗口不够宽时这两颗键禁用（design/main-shell.md §五）。上下分栏按栏高判，这里不挡。 */
	const splitBlocked = useMediaQuery('(width <= 1287px)')
	const toggleBrowser = useColumnsStore((state) => state.toggleBrowser)
	const browserSide = useColumnsStore((state) => state.browserSide)
	/* 主栏是中间那一栏：正常态（本栏在右）是内容区，镜像态（本栏在左）是标签浏览器；
	   次栏是离导航最远的那一栏，也就是会被整条收掉的那一栏。收放键与找回键都按这两个角色给。 */
	const mirror = browserSide === 'left'
	const secondaryHidden = browserCollapsed || narrowForSecondary
	const browserHidden = !mirror && secondaryHidden
	const contentHidden = mirror && secondaryHidden
	const navCollapsed = collapsed || narrow
	const setBrowserSide = useColumnsStore((state) => state.setBrowserSide)
	const navWidth = useColumnsStore((state) => state.navWidth)
	/* 栏宽上限 = 窗口 − 导航区（收起时为 0）− 内容区最小 400 − 把手 8；下限是侧栏最小 300。
	   默认档（没拖过）同样按它收：否则窄窗口下默认 400 也放不下，栏内的定尺壳会溢出到列外。
	   列与栏内的壳用同一个数，不会一个被夹住、一个照旧。 */
	const sideRoom = Math.max(300, viewportWidth - (navCollapsed ? 0 : (navWidth ?? 280)) - 400 - 8)
	const browserWidthShown = Math.min(browserWidth ?? sideWidthReading(), sideRoom)
	const setNavWidth = useColumnsStore((state) => state.setNavWidth)

	const account = useAuthStore((state) => state.user)
	const tabs = useTabsStore((state) => state.tabs)
	const activeKey = useTabsStore((state) => state.activeKey)
	const openBlankTab = useTabsStore((state) => state.openBlank)
	const navigateTab = useTabsStore((state) => state.navigate)
	const closeTab = useTabsStore((state) => state.close)
	const moveTab = useTabsStore((state) => state.move)
	const closeOthersTabs = useTabsStore((state) => state.closeOthers)
	const closeAllTabs = useTabsStore((state) => state.closeAll)
	const recentTabs = useTabsStore((state) => state.recent)
	const openTab = useTabsStore((state) => state.open)
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

	const nameOf = (tab: TabEntry): string => {
		if (tab.target.kind === 'home') return t('shell.browser.home')
		if (tab.target.kind === 'blank') return t('shell.browser.tab.blank')
		return tab.title ?? targetLabel(tab.target)
	}
	const iconOf = (tab: TabEntry): IconId | undefined => {
		if (tab.target.kind === 'home') return 'i-home'
		if (tab.target.kind === 'blank') return 'i-plus'
		return tab.icon
	}
	const byKey = (key: string): TabEntry | undefined => tabs.find((tab) => tabKey(tab) === key)
	const view: BrowserTab[] = tabs.map((tab) => ({
		key: tabKey(tab),
		label: nameOf(tab),
		/* 还是首页那一页时不可关；它换上目标成了普通一页之后就能关 */
		closable: tab.target.kind !== 'home',
		icon: iconOf(tab)
	}))
	const active = tabs.find((tab) => tabKey(tab) === activeKey) ?? HOME_TAB
	/* 第二个面板绑自己那一页：默认取第一个不是当前页的标签，没有别的页时停在首页。
	   标签条上的点击落在**聚焦的那个面板**：面板 0 写全局当前页，面板 1 写它自己这一页 */
	const secondaryTab = byKey(secondaryKey) ?? tabs.find((tab) => tabKey(tab) !== activeKey) ?? HOME_TAB

	/* 新标签页上的「打开过的东西」：store 按使用顺序记着，关掉页也不消失；点一条复用同一页打开 */
	const recent = recentTabs.map((entry) => ({ key: entry.key, label: entry.label }))
	const openRecent = (key: string) => {
		const entry = recentTabs.find((item) => item.key === key)
		if (entry) openTab(entry.target)
	}

	/* 一页里的地址入口提交了：解析成目标后落在这**本页**里，首页也一样。
	   想回到新标签页就把它关掉，或者关掉所有页让首页重新出现。
	   两个面板共用这一套，各自传自己那一页。 */
	const openIn = (tab: TabEntry, input: string) => {
		const target = parseTarget(input)
		if (target.kind === 'blank') return
		navigateTab(tabKey(tab), target)
	}

	/* 地址入口的校验：判据在目标模块里，空串与不像地址的各给一种错误态 */
	const validateAddress = (input: string): 'empty' | 'invalid' | null => {
		if (!input) return 'empty'
		return isAddressLike(input) ? null : 'invalid'
	}

	/* 一页的内容：两个面板共用同一个派发组件，分屏时各自渲染自己那一页 */
	const renderTab = (tab: TabEntry) => (
		<TabPage
			key={tab.key}
			tab={tab}
			recent={recent}
			onOpen={(input) => openIn(tab, input)}
			onOpenRecent={openRecent}
			validateAddress={validateAddress}
		/>
	)

	/* 列头两颗键按角色给：
	   正常态主栏是内容区，左端导航找回、右端标签浏览器找回；
	   镜像态主栏是标签浏览器（两颗找回键搬到它的顶栏），内容区是次栏，右端装它自己的收起键、左端留空。 */
	const navHeadKey: HeadKey = {
		icon: 'i-panel-left',
		expanded: !navCollapsed,
		visible: navCollapsed && chrome.controls !== 'own',
		blocked: narrow,
		label: t('shell.navigation.action.expand'),
		blockedLabel: t('shell.navigation.action.blocked'),
		onClick: toggleNav
	}
	const contentLead = mirror ? undefined : navHeadKey
	const contentTrail: HeadKey = mirror
		? {
				icon: 'i-panel-right',
				expanded: true,
				visible: true,
				label: t('shell.browser.action.collapse'),
				onClick: toggleBrowser
			}
		: {
				icon: 'i-panel-right',
				expanded: !secondaryHidden,
				visible: secondaryHidden,
				blocked: narrowForSecondary,
				label: secondaryHidden
					? t('shell.browser.action.expand')
					: t('shell.browser.action.collapse'),
				blockedLabel: t('shell.browser.action.blocked'),
				onClick: toggleBrowser
			}

	return (
		<div
			className='layout'
			data-client={client.kind}
			data-controls={chrome.controls}
			data-os={client.os || 'unknown'}
			data-width={collapsed || narrow ? 'zero' : 'panel'}
			data-nav={collapsed || narrow ? 'collapsed' : 'expanded'}
			/* 收放与次序分成两个属性：收放一变 data-browser 就是 collapsed，次序另由 data-browser-side 给 */
			data-browser={secondaryHidden ? 'collapsed' : 'expanded'}
			data-browser-side={browserSide}
			data-mirror={mirror ? 'true' : undefined}
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
				navCollapsed={navCollapsed}
				lead={contentLead}
				trail={contentTrail}
				hidden={contentHidden}
			>
				<Outlet />
			</Content>
			<Browser
				tabs={view}
				activeKey={activeKey}
				side={browserSide}
				collapsed={browserHidden}
				primary={mirror}
				/* 本栏落在窗口最左时，平台有原生交通灯就让顶栏左端让出红绿灯：
				   面板独占时它是唯一一栏，镜像态里导航区收起时它也在最左 */
				barInset={chrome.controls === 'native' && (exclusive || (mirror && navCollapsed))}
				navKey={
					mirror
						? {
								visible: navCollapsed && chrome.controls !== 'own',
								blocked: narrow,
								onClick: toggleNav
							}
						: undefined
				}
				secondaryKey={
					mirror
						? {
								collapsed: secondaryHidden,
								blocked: narrowForSecondary,
								onClick: toggleBrowser
							}
						: undefined
				}
				split={browserSplit}
				splitBlocked={splitBlocked}
				splitRatio={splitRatio}
				onSplitRatio={setSplitRatio}
				width={browserWidthShown}
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
					activateTab(key)
				}}
				onClose={(key) => closeTab(key)}
				onNew={() => openBlankTab()}
				onReorder={(key, index) => moveTab(key, index)}
				onRefresh={(key) => {
					/* 外部页与内部页目前都是占位，重开同一目标看不出变化；接上真实内容后在这里重取 */
					const tab = tabs.find((item) => item.key === key)
					if (tab) navigateTab(key, tab.target)
				}}
				onCloseOthers={(key) => closeOthersTabs(key)}
				onCloseAll={() => closeAllTabs()}
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
