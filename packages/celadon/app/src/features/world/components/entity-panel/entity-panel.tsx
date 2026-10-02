import { Button } from '@/components/base/button'
import { useTranslation } from '@/platform/i18n'
import { WORLD_ENTITY_KIND_KEY, type WorldEntity } from '../../worlds'

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
        <h3 className="entity-panel__title">{t(entity.nameKey)}</h3>
        <Button variant="ghost" size="small" onClick={onClose}>
          {t('entityPanel.close')}
        </Button>
      </header>
      <dl className="entity-panel__meta">
        <dt>{t('entityPanel.kind')}</dt>
        {/* `kind` 是**系统值** code，显示时经语言包取译文 —— 不直接显示 code */}
        <dd>{t(WORLD_ENTITY_KIND_KEY[entity.kind])}</dd>
        <dt>{t('entityPanel.id')}</dt>
        <dd>{entity.id}</dd>
      </dl>
    </section>
  )
}
