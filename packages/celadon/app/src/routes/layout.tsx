import './layout.less'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Browser, Home, Web, type BrowserTab } from '@/components/browser'
import { Content } from '@/components/content'
import { Nav, type NavItem } from '@/components/nav'
import { useAuthStore } from '@/features/auth/auth.store'
import { useLandingRecord } from '@/features/auth/use-landing-record'
import { InboxNav } from '@/features/inbox'
import { client } from '@/platform/client'
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
  { key: 'computer', icon: 'i-pc', labelKey: 'shell.navigation.item.computer', to: '/computer' },
]

/** 底部一行的两个快捷图标：与主导航里的工作空间、电脑是同一份内容、同一套图标。 */
const SHORTCUTS: NavItem[] = MAIN_ITEMS.filter(
  (item) => item.key === 'workspace' || item.key === 'computer',
)

/* 三栏外壳：导航栏 | 内容区 | 标签浏览器。三栏的布局事实与标签集都在 `stores/`，
   这一层是唯一读它们的地方 —— 组件只收 props（见 architecture/03-boundaries.md §2）。 */
export function AppLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  useLandingRecord(location.pathname, location.search)

  const collapsed = useColumnsStore((state) => state.navCollapsed)
  const toggleNav = useColumnsStore((state) => state.toggleNav)
  const mainFolded = useColumnsStore((state) => state.navMainCollapsed)
  const toggleMain = useColumnsStore((state) => state.toggleNavMain)
  const browserCollapsed = useColumnsStore((state) => state.browserCollapsed)
  const toggleBrowser = useColumnsStore((state) => state.toggleBrowser)
  const browserSide = useColumnsStore((state) => state.browserSide)
  const setBrowserSide = useColumnsStore((state) => state.setBrowserSide)

  const account = useAuthStore((state) => state.user)
  const tabs = useTabsStore((state) => state.tabs)
  const activeKey = useTabsStore((state) => state.activeKey)
  const openTab = useTabsStore((state) => state.open)
  const closeTab = useTabsStore((state) => state.close)
  const activateTab = useTabsStore((state) => state.activate)

  const mark = (item: NavItem): NavItem => ({
    ...item,
    active: location.pathname.startsWith(item.to),
  })
  /* 「当前」区认的是所在的分区：名字与图标都取这一分区自己的那一项 */
  const current = [...MAIN_ITEMS]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => location.pathname.startsWith(item.to))
  const scene: I18nKey = current?.labelKey ?? 'shell.navigation.scene.none'

  const nameOf = (tab: TabEntry): string =>
    tab.kind === 'browser-home' ? t('shell.browser.home') : tab.id
  const byKey = (key: string): TabEntry | undefined => tabs.find((tab) => tabKey(tab) === key)
  const view: BrowserTab[] = tabs.map((tab) => ({
    key: tabKey(tab),
    label: nameOf(tab),
    closable: tab.kind !== 'browser-home',
  }))
  const active = tabs.find((tab) => tabKey(tab) === activeKey) ?? HOME_TAB

  return (
    <div
      className="layout"
      data-client={client.kind}
      data-browser={browserCollapsed ? 'collapsed' : browserSide}
    >
      <Nav
        items={MAIN_ITEMS.map(mark)}
        shortcuts={SHORTCUTS.map(mark)}
        scene={scene}
        sceneIcon={current?.icon ?? 'i-apps'}
        accountName={account?.name ?? account?.account ?? t('shell.navigation.account.placeholder')}
        collapsed={collapsed}
        onToggle={toggleNav}
        mainFolded={mainFolded}
        onToggleMain={toggleMain}
        onSelect={(item) => navigate(item.to)}
      >
        {location.pathname.startsWith('/inbox') ? <InboxNav /> : null}
      </Nav>
      <Content>
        <Outlet />
      </Content>
      {browserCollapsed ? null : (
        <Browser
          tabs={view}
          activeKey={activeKey}
          side={browserSide}
          onActivate={(key) => {
            const tab = byKey(key)
            if (tab) activateTab(tab)
          }}
          onClose={(key) => {
            const tab = byKey(key)
            if (tab) closeTab(tab)
          }}
          onNew={() => activateTab(HOME_TAB)}
          onMove={() => setBrowserSide(browserSide === 'right' ? 'left' : 'right')}
          onCollapse={toggleBrowser}
        >
          {active.kind === 'browser-home' ? (
            <Home
              recent={tabs
                .filter((tab) => tab.kind !== 'browser-home')
                .map((tab) => ({ key: tabKey(tab), label: nameOf(tab) }))}
              onOpenAddress={(address) => openTab({ kind: 'browser-web', id: address })}
            />
          ) : null}
          {active.kind === 'browser-web' ? <Web address={active.id} /> : null}
          {active.kind !== 'browser-home' && active.kind !== 'browser-web' ? (
            <p className="content__hint">{t('shell.content.placeholder')}</p>
          ) : null}
        </Browser>
      )}
    </div>
  )
}
