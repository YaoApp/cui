import { useLocation, useNavigate, useParams } from 'react-router'
import { PageSection } from '@/components/page'
import { useTranslation } from '@/platform/i18n'
import { buildShareUrl } from '@/platform/utils/share-url'
import { navWithActive } from '@/features/scaffold/nav'
import { ScaffoldPage } from '../components/scaffold-page'
import { Nav } from '../components/nav'
import { useRoutingUrlSync } from './use-routing-url-sync'
import { findWorld, WORLDS } from './worlds'
import './routing.less'

/* 脚手架的**路由样例**：列表 → 详情（对象在路径里），过滤词在查询串里（`?q=`）。
   演示"地址栏 ↔ 状态"这一层（见 architecture/07-routing.md）。 */
export function RoutingPage() {
  const { worldId } = useParams()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { query, setFilter } = useRoutingUrlSync()
  const { t } = useTranslation()

  const world = findWorld(worldId)
  /** 详情页用**对象名**当标题：用户才知道自己开的是哪一个（没找到就用页面名）。 */
  const title = world ? t(world.nameKey) : t('routing.title')
  const needle = query.trim().toLowerCase()
  /* 夹具的 name / summary 持有语言包 key（见 worlds.ts 与 architecture/08-i18n.md §6），
     所以过滤也在**当前语言的文字**上做，切语言后结果跟着变。 */
  const visible = WORLDS.filter((w) => t(w.nameKey).toLowerCase().includes(needle))
  const worldNav = navWithActive(
    pathname,
    visible.map((item) => ({ label: t(item.nameKey), href: `/scaffold/routing/${item.id}` })),
  )

  if (worldId && !world) {
    /* 保留页头与导航：只换主体，用户还有站内出路。 */
    return (
      <div className="routing">
        <ScaffoldPage title={t('routing.title')} pageTitle={title}>
          <p className="routing__missing">{t('routing.missing', { id: worldId })}</p>
        </ScaffoldPage>
      </div>
    )
  }

  return (
    <div className="routing">
      <ScaffoldPage title={t('routing.title')} pageTitle={title}>
        {/* 同一组件、另一组 items：世界之间的导航（页内子导航，留在脚手架里） */}
        <Nav items={worldNav} label={t('routing.navLabel')} onSelect={(item) => navigate(item.href)} />
        <form className="routing__filter" role="search" onSubmit={(event) => event.preventDefault()}>
          <label className="routing__label" htmlFor="routing-q">
            {t('routing.filter')}
          </label>
          <input
            id="routing-q"
            className="input"
            value={query}
            placeholder={t('routing.filterPlaceholder')}
            onChange={(event) => setFilter(event.target.value)}
          />
        </form>

        {world ? (
          <PageSection label={t('routing.detailLabel')}>
            <h2 className="routing__title">{t(world.nameKey)}</h2>
            <p className="routing__summary">{t(world.summaryKey)}</p>
            <ul className="routing__entities">
              {world.entities.map((item) => (
                <li key={item.id}>{t(item.nameKey)}</li>
              ))}
            </ul>
            <p className="routing__share">
              <a className="link" href={buildShareUrl({ feature: 'scaffold/routing', object: world.id })}>
                {t('routing.share')}
              </a>
            </p>
          </PageSection>
        ) : null}
      </ScaffoldPage>
    </div>
  )
}
