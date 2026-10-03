import { useEffect } from 'react'
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
  usePageTitle(world ? t(world.nameKey) : t('world.title'))
  const entity = findEntity(world, selectedEntityId)
  /* 条目指向的对象不在了（换了对象 · 换了世界）：**主动作废** —— 否则地址栏与分享链接
     会继续宣称"侧边开着某物"，而画面里什么都没有。 */
  useEffect(() => {
    if (selectedEntityId && !entity) openPanel(undefined)
  }, [selectedEntityId, entity, openPanel])
  const needle = query.trim().toLowerCase()
  /* 夹具的 name / summary 持有语言包 key（见 worlds.ts 与 architecture/08-i18n.md §6），
     所以过滤也在**当前语言的文字**上做，切语言后结果跟着变。 */
  const visible = WORLDS.filter((w) => t(w.nameKey).toLowerCase().includes(needle))
  // 应用级导航项存的是 key；世界名是我们自己的夹具，也走语言包
  const appNav = navWithActive(pathname).map((item) => ({ ...item, label: t(item.label) }))

  if (worldId && !world) {
    /* 保留头部与导航：只换主体，用户还有站内出路（不然只剩浏览器后退）。 */
    return (
      <div className="world">
        <Header title={t('world.title')} onRefresh={() => navigate(0)}>
          <Nav items={appNav} label={t('nav.appLabel')} localeSwitch onSelect={(item) => navigate(item.href)} />
        </Header>
        <p className="world__missing">{t('world.missing', { id: worldId })}</p>
      </div>
    )
  }

  const worldNav = navWithActive(
    pathname,
    visible.map((item) => ({ label: t(item.nameKey), href: `/world/${item.id}` })),
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
          <h2 className="world__title">{t(world.nameKey)}</h2>
          <p className="world__summary">{t(world.summaryKey)}</p>
          <ul className="world__entities">
            {world.entities.map((item) => (
              <li key={item.id}>
                <Button
                  variant="ghost"
                  size="small"
                  aria-pressed={item.id === selectedEntityId}
                  onClick={() => openEntity(item.id)}
                >
                  {t(item.nameKey)}
                </Button>
              </li>
            ))}
          </ul>
          <p className="world__share">
            <a className="link" href={buildShareUrl({ feature: 'world', object: world.id }, entity ? { sideEntity: selectedEntityId } : {})}>
              {t('world.share')}
            </a>
          </p>
        </section>
      ) : null}

      {entity ? <EntityPanel entity={entity} onClose={() => openEntity(undefined)} /> : null}
    </div>
  )
}
