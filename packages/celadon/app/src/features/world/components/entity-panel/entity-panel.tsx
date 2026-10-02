import { Button } from '@/components/base/button'
import { useTranslation } from '@/platform/i18n'
import type { WorldEntity } from '../../worlds'

export type EntityPanelProps = {
  entity: WorldEntity
  onClose: () => void
}

/* 侧边面板的内容 —— 它只收 props，不知道"面板为什么开着"（那是地址的事）。 */
export function EntityPanel({ entity, onClose }: EntityPanelProps) {
  const { t } = useTranslation()

  return (
    <section className="entity-panel" aria-label={t('entityPanel.label')}>
      <header className="entity-panel__head">
        <h3 className="entity-panel__title">{entity.name}</h3>
        <Button variant="ghost" size="small" onClick={onClose}>
          {t('entityPanel.close')}
        </Button>
      </header>
      <dl className="entity-panel__meta">
        <dt>{t('entityPanel.kind')}</dt>
        <dd>{entity.kind}</dd>
        <dt>{t('entityPanel.id')}</dt>
        <dd>{entity.id}</dd>
      </dl>
    </section>
  )
}
