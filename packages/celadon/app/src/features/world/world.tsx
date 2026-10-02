import { useLocation, useNavigate, useParams } from 'react-router'
import { Button } from '@/components/base/button'
import { Header } from '@/components/header'
import { Nav } from '@/components/nav'
import { useTranslation } from '@/platform/i18n'
import { buildShareUrl } from '@/platform/utils/share-url'
import { usePageTitle } from '@/platform/router/use-page-title'
import { navWithActive } from '@/platform/utils/nav'
import { EntityPanel } from './components/entity-panel'
import { useSidePanelStore } from '@/stores/side-panel'
import { useWorldUrlSync } from './use-world-url-sync'
import { findEntity, findWorld, WORLDS } from './worlds'
import './world.less'

/* 验证用的 feature：列表 → 详情（对象在路径里）→ 条目面板（对象在具名 query 里）。
   同一个组件也能被 `/side/world/...` 装进侧边 —— 侧边只是挂载点。 */
export function WorldPage() {
  const { worldId } = useParams()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { query, setFilter } = useWorldUrlSync()
  const { t } = useTranslation()
  // 侧边开着谁 —— **公共**状态（说不清归哪个功能），住 stores/
  // 面板里开着的是不是**本功能**的条目 —— 公共 store 只认 kind，不认识 world
  const entry = useSidePanelStore((s) => s.entry)
  const selectedEntityId = entry?.kind === 'world-entity' ? entry.id : undefined
  const openPanel = useSidePanelStore((s) => s.open)
  const openEntity = (id?: string) => openPanel(id ? { kind: 'world-entity', id } : undefined)

  const world = findWorld(worldId)
  usePageTitle(world ? world.name : t('world.title'))
  const entity = findEntity(world, selectedEntityId)
  const needle = query.trim().toLowerCase()
  const visible = WORLDS.filter((w) => w.name.toLowerCase().includes(needle))
  // 应用级导航项存的是 key；世界名是**数据**（plan/19：数据本身不翻译），直接用
  const appNav = navWithActive(pathname).map((item) => ({ ...item, label: t(item.label) }))

  if (worldId && !world) return <p className="world__missing">{t('world.missing', { id: worldId })}</p>

  const worldNav = navWithActive(
    pathname,
    visible.map((item) => ({ label: item.name, href: `/main/world/${item.id}` })),
  )

  return (
    <div className="world">
      <Header title={t('world.title')} onRefresh={() => navigate(0)}>
        <Nav items={appNav} label={t('nav.appLabel')} localeSwitch onSelect={(item) => navigate(item.href)} />
      </Header>
      {/* 同一组件、另一组 items：世界之间的导航 */}
      <Nav items={worldNav} label={t('world.navLabel')} onSelect={(item) => navigate(item.href)} />
      <form className="world__filter" role="search" onSubmit={(event) => event.preventDefault()}>
        <label className="world__label" htmlFor="world-q">
          {t('world.filter')}
        </label>
        <input
          id="world-q"
          className="input"
          value={query}
          placeholder={t('world.filterPlaceholder')}
          onChange={(event) => setFilter(event.target.value)}
        />
      </form>

      {world ? (
        <section className="world__detail" aria-label={t('world.detailLabel')}>
          <h2 className="world__title">{world.name}</h2>
          <p className="world__summary">{world.summary}</p>
          <ul className="world__entities">
            {world.entities.map((item) => (
              <li key={item.id}>
                <Button
                  variant="ghost"
                  size="small"
                  aria-pressed={item.id === selectedEntityId}
                  onClick={() => openEntity(item.id)}
                >
                  {item.name}
                </Button>
              </li>
            ))}
          </ul>
          <p className="world__share">
            <a className="link" href={buildShareUrl({ feature: 'world', object: world.id }, { sideEntity: selectedEntityId })}>
              {t('world.share')}
            </a>
          </p>
        </section>
      ) : null}

      {entity ? <EntityPanel entity={entity} onClose={() => openEntity(undefined)} /> : null}
    </div>
  )
}
