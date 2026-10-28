import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { useTranslation } from '@/platform/i18n'
import { MessageList, type MessageItem } from '@/components/message-list'
import './chatbox.less'

export type ChatboxAttachment = {
  id: string
  name: string
}

export type ChatboxProps = {
  messages: MessageItem[]
  empty?: ReactNode
  loading?: boolean
  loadingMore?: boolean
  hasMore?: boolean
  streaming?: boolean
  onLoadMore?: () => void
  onRetry?: (messageId: string) => void
  renderMessageActions?: (message: MessageItem) => ReactNode
  surface?: 'content' | 'browser'
  showHistory?: boolean
  submitKey?: 'enter' | 'mod-enter'
  value: string
  onValueChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  canSend?: boolean
  disabled?: boolean
  context?: ReactNode
  resources?: ReactNode
  attachments?: ChatboxAttachment[]
  onRemoveAttachment?: (id: string) => void
  overlay?: ReactNode
  footer?: ReactNode
  onFiles?: (files: File[]) => void
  onMic?: () => void
  onVoiceChat?: () => void
  onStop?: () => void
  onSettings?: () => void
  listening?: ReactNode
  className?: string
}

export function Chatbox({
  messages,
  empty,
  loading,
  loadingMore,
  hasMore,
  streaming = false,
  onLoadMore,
  onRetry,
  renderMessageActions,
  surface = 'content',
  showHistory = true,
  submitKey = 'enter',
  value,
  onValueChange,
  onSubmit,
  placeholder,
  canSend = false,
  disabled = false,
  context,
  resources,
  attachments = [],
  onRemoveAttachment,
  overlay,
  footer,
  onFiles,
  onMic,
  onVoiceChat,
  onStop,
  onSettings,
  listening,
  className,
}: ChatboxProps) {
  const { t } = useTranslation()
  const inputId = useId()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const node = textareaRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, 200)}px`
  }, [value])

  const sendable = canSend && value.trim().length > 0 && !disabled && !streaming

  function submit() {
    if (!sendable) return
    onSubmit()
  }

  return (
    <section
      className={['chatbox', `chatbox--${surface}`, showHistory ? null : 'is-composer-only', className]
        .filter(Boolean)
        .join(' ')}
      aria-label={t('chatbox.label')}
    >
      {showHistory ? (
        <div className='chatbox__history'>
          <MessageList
            messages={messages}
            empty={empty}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            streaming={streaming}
            onLoadMore={onLoadMore}
            onRetry={onRetry}
            renderActions={renderMessageActions}
            surface={surface}
          />
        </div>
      ) : null}

      <div className='chatbox__composer-wrap'>
        {context ? <div className='chatbox__context'>{context}</div> : null}

        <div className={['chatbox__composer', streaming ? 'is-streaming' : null].filter(Boolean).join(' ')}>
          <label className='chatbox__sr-only' htmlFor={inputId}>
            {placeholder ?? t('chatbox.placeholder')}
          </label>
          <textarea
            ref={textareaRef}
            id={inputId}
            className='chatbox__input'
            rows={1}
            value={value}
            placeholder={placeholder ?? t('chatbox.placeholder')}
            disabled={disabled}
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return
              const shouldSubmit =
                submitKey === 'enter'
                  ? event.key === 'Enter' && !event.shiftKey
                  : (event.metaKey || event.ctrlKey) && event.key === 'Enter'
              if (!shouldSubmit) return
              event.preventDefault()
              submit()
            }}
          />

          {attachments.length > 0 ? (
            <ul className='chatbox__attachments' aria-label={t('chatbox.attachments')}>
              {attachments.map((attachment) => (
                <li key={attachment.id} className='chatbox__attachment'>
                  <Icon name='i-file' size={14} aria-hidden='true' />
                  <span>{attachment.name}</span>
                  {onRemoveAttachment ? (
                    <Button
                      variant='ghost'
                      size='small'
                      iconOnly
                      className='chatbox__attachment-remove'
                      aria-label={t('chatbox.removeAttachment', { name: attachment.name })}
                      icon={<Icon name='i-act-close' size={14} aria-hidden='true' />}
                      onClick={() => onRemoveAttachment(attachment.id)}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}

          <div className='chatbox__toolbar'>
            <div className='chatbox__resources'>
              {resources}
              {onSettings ? (
                <Button
                  variant='ghost'
                  size='small'
                  iconOnly
                  aria-label={t('chatbox.settings')}
                  title={t('chatbox.settings')}
                  icon={<Icon name='i-nav-settings' size={16} />}
                  onClick={onSettings}
                />
              ) : null}
            </div>
            <div className='chatbox__actions'>
              {onFiles ? (
                <>
                  <input
                    ref={fileRef}
                    className='chatbox__file'
                    type='file'
                    multiple
                    onChange={(event) => {
                      onFiles(Array.from(event.target.files ?? []))
                      event.target.value = ''
                    }}
                  />
                  <Button
                    variant='ghost'
                    size='small'
                    iconOnly
                    aria-label={t('chatbox.attach')}
                    title={t('chatbox.attach')}
                    icon={<Icon name='i-act-attach' size={16} />}
                    onClick={() => fileRef.current?.click()}
                  />
                </>
              ) : null}
              {streaming && onStop ? (
                <Button
                  variant='soft'
                  size='small'
                  iconOnly
                  aria-label={t('chatbox.stop')}
                  title={t('chatbox.stop')}
                  icon={<Icon name='i-stop' size={16} />}
                  onClick={onStop}
                />
              ) : sendable ? (
                <Button
                  variant='solid'
                  size='small'
                  iconOnly
                  aria-label={t('chatbox.send')}
                  title={t('chatbox.send')}
                  icon={<Icon name='i-arrow-up' size={16} />}
                  onClick={submit}
                />
              ) : (
                <>
                  {onMic ? (
                    <Button
                      variant='ghost'
                      size='small'
                      iconOnly
                      aria-label={t('chatbox.mic')}
                      title={t('chatbox.mic')}
                      icon={<Icon name='i-mic' size={16} />}
                      onClick={onMic}
                    />
                  ) : null}
                  {onVoiceChat ? (
                    <Button
                      variant='ghost'
                      size='small'
                      iconOnly
                      aria-label={t('chatbox.voice')}
                      title={t('chatbox.voice')}
                      icon={<Icon name='i-phone' size={16} />}
                      onClick={onVoiceChat}
                    />
                  ) : null}
                </>
              )}
            </div>
          </div>

          {listening}
          {overlay}
        </div>

        {footer ? <div className='chatbox__footer'>{footer}</div> : null}
      </div>
    </section>
  )
}
