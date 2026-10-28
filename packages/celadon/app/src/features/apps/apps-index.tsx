import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { Spinner } from '@/components/base/spinner'
import { useTranslation } from '@/platform/i18n'
import type { I18nKey } from '@/platform/i18n/i18n-types'
import { listApps, type AppRecord } from '@/data/apps'
import { appCopy, type AppCopy } from './catalog'
import './apps.less'

type AppCard = {
  record: AppRecord
  copy: AppCopy
}

export function AppsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [items, setItems] = useState<AppCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    listApps()
      .then((records) => {
        if (cancelled) return
        setItems(
          records
            .map((record) => {
              const copy = appCopy(record.id)
              return copy ? { record, copy } : null
            })
            .filter((item): item is AppCard => item !== null),
        )
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [retry])

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' }),
    [i18n.language],
  )

  return (
    <div className='apps-page'>
      <header className='apps-page__head'>
        <div className='apps-page__title'>
          <span className='apps-page__mark' aria-hidden='true'>
            <Icon name='i-apps' size={20} />
          </span>
          <div>
            <h1>{t('apps.catalogTitle')}</h1>
            <p>{t('apps.lede')}</p>
          </div>
        </div>
        <Button
          variant='soft'
          size='small'
          icon={<Icon name='i-plus' size={16} />}
          onClick={() => navigate('/new?create=app')}
        >
          {t('apps.create')}
        </Button>
      </header>

      {loading ? (
        <div className='apps-page__state' role='status' aria-label={t('apps.title')}>
          <Spinner />
        </div>
      ) : error ? (
        <div className='apps-page__state' role='alert'>
          <span>{t('apps.error')}</span>
          <Button variant='ghost' size='small' onClick={() => setRetry((value) => value + 1)}>
            {t('apps.retry')}
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className='apps-page__state'>
          <span>{t('apps.empty')}</span>
        </div>
      ) : (
        <ul className='apps-grid'>
          {items.map(({ record, copy }) => (
            <li key={record.id}>
              <Button
                variant='plain'
                size='large'
                className='apps-card'
                onClick={() => navigate(`/apps/${encodeURIComponent(record.id)}`)}
              >
                <span className='apps-card__icon'>
                  <Icon name={copy.icon} size={20} />
                </span>
                <span className='apps-card__body'>
                  <span className='apps-card__title'>
                    <strong>{t(copy.nameKey)}</strong>
                    <em>{t(copy.englishKey)}</em>
                  </span>
                  <span className='apps-card__description'>{t(copy.descriptionKey)}</span>
                  <span className='apps-card__meta'>
                    <span>{t(`apps.category.${record.category}` as I18nKey)}</span>
                    <span>·</span>
                    <span>{t(`apps.surface.${record.surface}` as I18nKey)}</span>
                    <span>·</span>
                    <span>{t(`apps.status.${record.status}` as I18nKey)}</span>
                  </span>
                  <span className='apps-card__foot'>
                    <span>{t('apps.updated', { date: dateFormatter.format(new Date(record.updated_at)) })}</span>
                    <span className='apps-card__open'>
                      {t('apps.open')}
                      <Icon name='i-right' size={14} />
                    </span>
                  </span>
                </span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
