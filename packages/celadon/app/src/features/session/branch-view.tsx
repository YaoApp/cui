import { useState } from 'react'
import { useParams } from 'react-router'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { Chatbox } from '@/components/chatbox'
import { useTranslation } from '@/platform/i18n'
import { useSession } from './hooks/use-session'
import './session.less'

export type BranchViewProps = {
  sessionId: string
  branchId: string
  surface?: 'content' | 'browser'
}

export function BranchView({ sessionId, branchId, surface = 'content' }: BranchViewProps) {
  const { t } = useTranslation()
  const branch = useSession(sessionId, branchId)
  const [draft, setDraft] = useState('')

  const statusText =
    branch.state === 'thinking'
      ? t('session.thinking')
      : branch.state === 'streaming'
        ? t('session.streaming')
        : branch.error
          ? branch.error
          : branch.connected
            ? t('session.ready')
            : t('session.new.connecting')

  return (
    <div className={surface === 'browser' ? 'branch-view branch-view--browser' : 'branch-view'}>
      <div className='session-page__head'>
        <div className='session-page__identity'>
          <Icon name='i-branch' size={16} aria-hidden='true' />
          <span>{branch.session?.title ?? t('session.branch.label')}</span>
        </div>
        <div className='session-page__meta'>
          {branch.session?.model ? <span>{branch.session.model}</span> : null}
          <span className={branch.error ? 'is-error' : undefined}>{statusText}</span>
        </div>
      </div>

      <Chatbox
        messages={branch.messages}
        loading={branch.state === 'loading' && branch.messages.length === 0}
        hasMore={branch.hasMore}
        loadingMore={branch.loadingMore}
        onLoadMore={branch.loadMore}
        empty={
          <div className='session-detail__empty'>
            <div className='session-detail__empty-mark' aria-hidden='true'>
              <Icon name='i-branch' size={20} />
            </div>
            <h2>{t('session.branch.empty')}</h2>
            <p>{t('session.empty.body')}</p>
          </div>
        }
        surface={surface}
        streaming={branch.isStreaming}
        value={draft}
        onValueChange={setDraft}
        onSubmit={() => {
          if (branch.send(draft)) setDraft('')
        }}
        onStop={branch.stop}
        placeholder={t('session.placeholder')}
        canSend={branch.isReady}
        disabled={!branch.isReady}
        onRetry={branch.reload}
        resources={
          branch.session?.model ? (
            <span className='session-page__resource'>
              <Icon name='i-obj-model' size={14} />
              {branch.session.model}
            </span>
          ) : undefined
        }
        footer={
          branch.error ? (
            <span className='session-page__error' role='alert'>
              <Icon name='i-state-error' size={14} /> {branch.error}
              <Button variant='ghost' size='small' onClick={branch.reload}>
                {t('session.retry')}
              </Button>
            </span>
          ) : null
        }
      />
    </div>
  )
}

export function BranchPage() {
  const { sessionId, branchId } = useParams()
  if (!sessionId || !branchId) return null
  return <BranchView sessionId={sessionId} branchId={branchId} />
}
