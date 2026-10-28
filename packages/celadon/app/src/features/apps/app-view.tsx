import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { Spinner } from '@/components/base/spinner'
import { useTranslation } from '@/platform/i18n'
import type { I18nKey } from '@/platform/i18n/i18n-types'
import { createSession, listComputers, listModels, listWorkspaces } from '@/data/session'
import { getApp, type AppRecord } from '@/data/apps'
import { appCopy } from './catalog'
import './apps.less'

export function AppViewPage() {
  const { t, i18n } = useTranslation()
  const { appId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState<AppRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState(false)
  const fromNewSession = searchParams.get('from') === 'new-session'

  useEffect(() => {
    if (!appId) return
    let cancelled = false
    setLoading(true)
    setError(false)
    getApp(appId)
      .then((next) => {
        if (!cancelled) setRecord(next)
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
  }, [appId])

  const copy = record ? appCopy(record.id) : undefined
  const name = copy ? t(copy.nameKey) : record?.id ?? ''
  const backLabel = fromNewSession ? t('apps.backNew') : t('apps.back')

  async function start() {
    if (!record || !copy || starting) return
    setStarting(true)
    setStartError(false)
    try {
      const [computers, workspaces, models] = await Promise.all([
        listComputers(),
        listWorkspaces(),
        listModels(),
      ])
      const workspace = workspaces[0]
      const model = models[0]
      if (!workspace || !model) throw new Error('No workspace or model is available.')
      const session = await createSession({
        title: t(copy.nameKey),
        computer_id: workspace.computer_id ?? computers[0]?.id ?? '',
        workspace_id: workspace.id,
        model: model.model_id,
        effort: 'medium',
        agent: record.id,
      })
      navigate(`/sessions/${session.id}`)
    } catch {
      setStartError(true)
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className='app-view app-view--state' role='status'>
        <Spinner />
      </div>
    )
  }

  if (error || !record || !copy) {
    return (
      <div className='app-view app-view--state'>
        <p role='alert'>{t('apps.notFound')}</p>
        <Button variant='ghost' size='small' onClick={() => navigate(fromNewSession ? '/new' : '/apps')}>
          {backLabel}
        </Button>
      </div>
    )
  }

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' })

  return (
    <div className='app-view'>
      <header className='app-view__head'>
        <Button
          variant='ghost'
          size='small'
          iconOnly
          aria-label={backLabel}
          title={backLabel}
          icon={<Icon name='i-left' size={14} />}
          onClick={() => navigate(fromNewSession ? '/new' : '/apps')}
        />
        <span className='app-view__icon'>
          <Icon name={copy.icon} size={20} />
        </span>
        <div className='app-view__identity'>
          <h1>{name}</h1>
          <span>{t(copy.englishKey)}</span>
        </div>
        <span className={`app-view__status is-${record.status}`}>
          {t(`apps.status.${record.status}` as I18nKey)}
        </span>
      </header>

      <div className='app-view__body'>
        <section className='app-view__about' aria-labelledby='app-about-title'>
          <h2 id='app-about-title'>{t('apps.detail.about')}</h2>
          <p>{t(copy.descriptionKey)}</p>
          <dl className='app-view__facts'>
            <div>
              <dt>{t('apps.category')}</dt>
              <dd>{t(`apps.category.${record.category}` as I18nKey)}</dd>
            </div>
            <div>
              <dt>{t('apps.surface')}</dt>
              <dd>{t(`apps.surface.${record.surface}` as I18nKey)}</dd>
            </div>
            <div>
              <dt>{t('apps.updatedLabel')}</dt>
              <dd>{dateFormatter.format(new Date(record.updated_at))}</dd>
            </div>
          </dl>
        </section>

        <aside className='app-view__availability'>
          <span className='app-view__eyebrow'>{t('apps.detail.availability')}</span>
          <dl>
            <div>
              <dt>{t('apps.status')}</dt>
              <dd>{t(`apps.status.${record.status}` as I18nKey)}</dd>
            </div>
            <div>
              <dt>{t('apps.source')}</dt>
              <dd>{t(`apps.source.${record.source}` as I18nKey)}</dd>
            </div>
          </dl>
          {record.status === 'ready' ? (
            <Button variant='solid' size='medium' loading={starting} onClick={() => void start()}>
              {t('apps.detail.start')}
            </Button>
          ) : null}
          {startError ? (
            <p className='app-view__error' role='alert'>
              {t('apps.detail.startFailed')}
            </p>
          ) : null}
        </aside>
      </div>

      <section className='app-view__projects' aria-labelledby='app-projects-title'>
        <h2 id='app-projects-title'>{t('apps.detail.projects')}</h2>
        <div className='app-view__empty'>
          <span className='app-view__icon app-view__icon--muted'>
            <Icon name={copy.icon} size={20} />
          </span>
          <p>{t('apps.detail.empty')}</p>
        </div>
      </section>
    </div>
  )
}
