import { useTranslation } from '@/platform/i18n'
import type { I18nKey } from '@/platform/i18n/i18n-types'
import './new-session-tabs.less'

export type NewSessionMode = 'use' | 'build'

const MODES: NewSessionMode[] = ['use', 'build']

type NewSessionTabsProps = {
  value: NewSessionMode
  onChange: (value: NewSessionMode) => void
}

export function NewSessionTabs({ value, onChange }: NewSessionTabsProps) {
  const { t } = useTranslation()

  return (
    <div className='session-new-tabs' role='tablist' aria-label={t('session.new.mode')}>
      {MODES.map((tab) => {
        const selected = tab === value
        return (
          <button
            key={tab}
            type='button'
            role='tab'
            id={`new-session-tab-${tab}`}
            className='session-new-tab'
            aria-selected={selected}
            aria-controls={`new-session-panel-${tab}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab)}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
              event.preventDefault()
              const nextMode = tab === 'use' ? 'build' : 'use'
              onChange(nextMode)
              requestAnimationFrame(() => {
                document.getElementById(`new-session-tab-${nextMode}`)?.focus()
              })
            }}
          >
            {t(`session.new.tab.${tab}` as I18nKey)}
          </button>
        )
      })}
    </div>
  )
}
