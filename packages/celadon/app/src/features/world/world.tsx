import { Link, useParams } from 'react-router'
import { buildShareUrl } from '@/platform/utils/share-url'
import { EntityPanel } from './components/entity-panel'
import { useWorldUrlSync } from './use-world-url-sync'
import { findEntity, findWorld, WORLDS } from './worlds'
import './world.less'

/* 验证用的 feature：列表 → 详情（对象在路径里）→ 条目面板（对象在具名 query 里）。
   同一个组件也能被 `/side/world/...` 装进侧边 —— 侧边只是挂载点。 */
export function WorldPage() {
  const { worldId } = useParams()
  const { query, selectedEntityId, setFilter, openEntity } = useWorldUrlSync()

  const world = findWorld(worldId)
  const entity = findEntity(world, selectedEntityId)
  const needle = query.trim().toLowerCase()
  const visible = WORLDS.filter((w) => w.name.toLowerCase().includes(needle))

  if (worldId && !world) return <p className="world__missing">没有这个世界：{worldId}</p>

  return (
    <div className="world">
      <form className="world__filter" role="search" onSubmit={(event) => event.preventDefault()}>
        <label className="world__label" htmlFor="world-q">
          过滤
        </label>
        <input
          id="world-q"
          className="input"
          value={query}
          placeholder="世界名"
          onChange={(event) => setFilter(event.target.value)}
        />
      </form>

      {world ? (
        <section className="world__detail" aria-label="世界详情">
          <h2 className="world__title">{world.name}</h2>
          <p className="world__summary">{world.summary}</p>
          <ul className="world__entities">
            {world.entities.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="btn-ghost"
                  aria-pressed={item.id === selectedEntityId}
                  onClick={() => openEntity(item.id)}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
          <p className="world__share">
            <a href={buildShareUrl({ feature: 'world', object: world.id }, { sideEntity: selectedEntityId })}>
              分享这个视图
            </a>
          </p>
          <p className="world__back">
            <Link to="/main/world">回到列表</Link>
          </p>
        </section>
      ) : (
        <ul className="world__list">
          {visible.map((item) => (
            <li key={item.id} className="world__row">
              <Link className="world__link" to={`/main/world/${item.id}`}>
                {item.name}
              </Link>
              <span className="world__summary">{item.summary}</span>
            </li>
          ))}
        </ul>
      )}

      {entity ? <EntityPanel entity={entity} onClose={() => openEntity(undefined)} /> : null}
    </div>
  )
}
