import type { WorldEntity } from '../../worlds'

export type EntityPanelProps = {
  entity: WorldEntity
  onClose: () => void
}

/* 侧边面板的内容 —— 它只收 props，不知道"面板为什么开着"（那是地址的事）。 */
export function EntityPanel({ entity, onClose }: EntityPanelProps) {
  return (
    <section className="entity-panel" aria-label="条目面板">
      <header className="entity-panel__head">
        <h3 className="entity-panel__title">{entity.name}</h3>
        <button type="button" className="btn-ghost" onClick={onClose}>
          关闭
        </button>
      </header>
      <dl className="entity-panel__meta">
        <dt>类型</dt>
        <dd>{entity.kind}</dd>
        <dt>编号</dt>
        <dd>{entity.id}</dd>
      </dl>
    </section>
  )
}
