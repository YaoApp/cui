import { Outlet } from 'react-router'
import { useTranslation } from '@/platform/i18n'
import './surface-layout.less'

/* 外壳：所有页面住在主区里。侧边（`side/`）在 2026-10-04 撤掉 —— 没有产品页面时它没有消费者，
   需要侧边时重新设计（`plan/05-scaffold.md` §6.1）。**导航不在壳里**：它属于脚手架（`ScaffoldPage`）。 */
export function SurfaceLayout() {
  const { t } = useTranslation()
  return (
    <main className="surface surface--main" aria-label={t('surface.main')}>
      <Outlet />
    </main>
  )
}
