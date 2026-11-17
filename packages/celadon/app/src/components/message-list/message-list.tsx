import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { Spinner } from '@/components/base/spinner'
import { useTranslation } from '@/platform/i18n'
import './message-list.less'
import type { MessageItem } from './types'

export type MessageListProps = {
  messages: MessageItem[]
  empty?: ReactNode
  loading?: boolean
  loadingMore?: boolean
  hasMore?: boolean
  streaming?: boolean
  onLoadMore?: () => void
  onRetry?: (messageId: string) => void
  renderActions?: (message: MessageItem) => ReactNode
  surface?: 'content' | 'browser'
  className?: string
}

function visibleContent(message: MessageItem): string {
  if (message.content.trim()) return message.content
  return message.kind === 'error' ? ' ' : ''
}

export function MessageList({
  messages,
  empty,
  loading = false,
  loadingMore = false,
  hasMore = false,
  streaming = false,
  onLoadMore,
  onRetry,
  renderActions,
  surface = 'content',
  className,
}: MessageListProps) {
  const { t } = useTranslation()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const stickRef = useRef(true)
  const [awayFromBottom, setAwayFromBottom] = useState(false)
  const lastMessage = messages[messages.length - 1]

  function scrollToBottom(behavior: ScrollBehavior = 'auto') {
    stickRef.current = true
    setAwayFromBottom(false)
    const node = bottomRef.current
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ behavior, block: 'end' })
    }
  }

  function onScroll() {
    const node = scrollerRef.current
    if (!node) return
    const atBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 48
    stickRef.current = atBottom
    setAwayFromBottom(!atBottom)
  }

  useEffect(() => {
    if (loading) return
    if (messages.length === 0) return
    if (stickRef.current) scrollToBottom()
    // The last text delta changes the rendered height without changing the array length.
  }, [loading, messages.length, lastMessage?.content])

  useEffect(() => {
    stickRef.current = true
    setAwayFromBottom(false)
    requestAnimationFrame(() => scrollToBottom())
  }, [])

  if (loading && messages.length === 0) {
    return (
      <div className={['message-list', `message-list--${surface}`, 'is-loading', className].filter(Boolean).join(' ')}>
        <div className='message-list__status' role='status'>
          <Spinner />
          <span>{t('messageList.loading')}</span>
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className={['message-list', `message-list--${surface}`, className].filter(Boolean).join(' ')}>
        <div className='message-list__empty'>{empty}</div>
      </div>
    )
  }

  return (
    <div className={['message-list', `message-list--${surface}`, className].filter(Boolean).join(' ')}>
      <div ref={scrollerRef} className='message-list__scroller' onScroll={onScroll}>
        {hasMore ? (
          <div className='message-list__more'>
            <Button
              variant='ghost'
              size='small'
              loading={loadingMore}
              onClick={onLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? t('messageList.loadingMore') : t('messageList.loadMore')}
            </Button>
          </div>
        ) : null}

        <ol className='message-list__items' aria-live={streaming ? 'polite' : undefined}>
          {messages.map((message) => (
            <li
              key={message.id}
              className={[
                'message-list__item',
                message.role === 'user' ? 'is-user' : 'is-assistant',
                message.kind === 'error' ? 'is-error' : null,
                message.kind === 'cancelled' ? 'is-cancelled' : null,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {message.role === 'assistant' ? (
                <div className='message-list__author'>
                  <span className='message-list__avatar' aria-hidden='true'>
                    <Icon name='i-spark' size={14} />
                  </span>
                  <span>{t('messageList.assistant')}</span>
                </div>
              ) : null}
              <div className='message-list__bubble'>
                {message.kind === 'error' ? (
                  <span className='message-list__state-icon' aria-hidden='true'>
                    <Icon name='i-state-error' size={16} />
                  </span>
                ) : null}
                {message.kind === 'cancelled' ? (
                  <span className='message-list__state-icon' aria-hidden='true'>
                    <Icon name='i-stop' size={14} />
                  </span>
                ) : null}
                <p className='message-list__text'>{visibleContent(message)}</p>
              </div>
              {message.kind === 'error' && onRetry ? (
                <Button
                  variant='ghost'
                  size='small'
                  icon={<Icon name='i-act-refresh' size={14} />}
                  onClick={() => onRetry(message.id)}
                >
                  {t('messageList.retry')}
                </Button>
              ) : null}
              {renderActions
                ? (() => {
                    const actions = renderActions(message)
                    return actions ? <div className='message-list__actions'>{actions}</div> : null
                  })()
                : null}
            </li>
          ))}
        </ol>
        <div ref={bottomRef} className='message-list__bottom' aria-hidden='true' />
      </div>

      {awayFromBottom ? (
        <Button
          className='message-list__jump'
          variant='soft'
          size='small'
          shape='pill'
          icon={<Icon name='i-down' size={14} />}
          onClick={() => scrollToBottom('smooth')}
        >
          {t('messageList.jumpLatest')}
        </Button>
      ) : null}
    </div>
  )
}
