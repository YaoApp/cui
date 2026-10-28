import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { Spinner } from '@/components/base/spinner'
import { useTranslation } from '@/platform/i18n'
import { listBots, type BotRecord } from '@/data/apps'
import { botCopy, type BotCopy } from './catalog'
import './bots.less'

type BotCard = {
  record: BotRecord
  copy: BotCopy
}

export function BotsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [items, setItems] = useState<BotCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    listBots()
      .then((records) => {
        if (cancelled) return
        setItems(
          records
            .map((record) => {
              const copy = botCopy(record.id)
              return copy ? { record, copy } : null
            })
            .filter((item): item is BotCard => item !== null),
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

  return (
    <div className='bots-page'>
      <header className='bots-page__head'>
        <div className='bots-page__title'>
          <span className='bots-page__mark' aria-hidden='true'>
            <Icon name='i-bot' size={20} />
          </span>
          <div>
            <h1>{t('bots.catalogTitle')}</h1>
            <p>{t('bots.lede')}</p>
          </div>
        </div>
        <Button
          variant='soft'
          size='small'
          icon={<Icon name='i-plus' size={16} />}
          onClick={() => navigate('/new?create=bot')}
        >
          {t('bots.create')}
        </Button>
      </header>

      {loading ? (
        <div className='bots-page__state' role='status' aria-label={t('bots.title')}>
          <Spinner />
        </div>
      ) : error ? (
        <div className='bots-page__state' role='alert'>
          <span>{t('bots.error')}</span>
          <Button variant='ghost' size='small' onClick={() => setRetry((value) => value + 1)}>
            {t('bots.retry')}
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className='bots-page__state'>
          <span>{t('bots.empty')}</span>
        </div>
      ) : (
        <ul className='bots-grid'>
          {items.map(({ record, copy }) => (
            <li key={record.id}>
              <Button
                variant='plain'
                size='large'
                className='bots-card'
                onClick={() => navigate(`/new?bot=${encodeURIComponent(record.id)}`)}
              >
                <span className='bots-card__icon'>
                  <Icon name={copy.icon} size={20} />
                </span>
                <span className='bots-card__body'>
                  <span className='bots-card__title'>
                    <strong>{t(copy.nameKey)}</strong>
                    {t(copy.englishKey) !== t(copy.nameKey) ? <em>{t(copy.englishKey)}</em> : null}
                  </span>
                  <span className='bots-card__description'>{t(copy.descriptionKey)}</span>
                  <span className='bots-card__foot'>
                    <span>{t(copy.metaKey)}</span>
                    <span className='bots-card__open'>{t('session.rec.chat')}</span>
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
