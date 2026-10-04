import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Page } from '@/components/page'
import { useTranslation } from '@/platform/i18n'
import { usePageTitle } from '@/platform/router/use-page-title'
import { navWithActive } from '../nav'
import { Header } from './header'
import { Nav } from './nav'

/* **脚手架的页壳**：导航与页头只在这里渲染一次（`plan/05-scaffold.md` §4），各页只传标题与正文。
   刷新统一 `navigate(0)`；标题同时给页签（`usePageTitle`）与页头。 */
export function ScaffoldPage({ title, pageTitle, children }: { title: string; pageTitle?: string; children: ReactNode }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  /* 页头用页面名（`title`）；页签可以更具体（`pageTitle`，如详情页的对象名）*/
  usePageTitle(pageTitle ?? title)
  const items = navWithActive(pathname).map((item) => ({ ...item, label: t(item.label) }))
  return (
    <div className="scaffold">
      <Header title={title} onRefresh={() => navigate(0)}>
        <Nav items={items} label={t('nav.appLabel')} localeSwitch onSelect={(item) => navigate(item.href)} />
      </Header>
      <Page>{children}</Page>
    </div>
  )
}
