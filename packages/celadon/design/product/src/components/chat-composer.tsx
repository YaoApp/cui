import { useRef, type ReactNode } from 'react'
import { Icon } from './icon'
import './chat-composer.css'

type SubmitKey = 'enter' | 'mod-enter'

type ChatComposerProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder: string
  canSend: boolean
  context?: ReactNode
  resources?: ReactNode
  attachments?: ReactNode
  overlay?: ReactNode
  listening?: ReactNode
  note?: string
  className?: string
  bare?: boolean
  rows?: number
  submitKey?: SubmitKey
  recording?: boolean
  onFiles?: (files: File[]) => void
  onMic?: () => void
  onVoiceChat?: () => void
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  placeholder,
  canSend,
  context,
  resources,
  attachments,
  overlay,
  listening,
  note,
  className,
  bare = false,
  rows = 3,
  submitKey = 'mod-enter',
  recording = false,
  onFiles,
  onMic,
  onVoiceChat,
}: ChatComposerProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className={`cc-composer${bare ? ' cc-composer--bare' : ''}${className ? ` ${className}` : ''}`}>
      {context}

      <textarea
        ref={inputRef}
        className="cc-input"
        rows={rows}
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          const submit =
            submitKey === 'enter'
              ? event.key === 'Enter' && !event.shiftKey
              : (event.metaKey || event.ctrlKey) && event.key === 'Enter'
          if (!submit) return
          event.preventDefault()
          if (canSend) onSubmit()
        }}
      />

      {listening}

      <div className="cc-footer">
        <div className="cc-resources">{resources}</div>
        <div className="cc-actions">
          <input
            ref={fileRef}
            className="cc-file-input"
            type="file"
            multiple
            onChange={(event) => {
              onFiles?.(Array.from(event.target.files ?? []))
              event.target.value = ''
            }}
          />
          {onFiles ? (
            <button
              className="cc-icon-button"
              type="button"
              aria-label="添加附件"
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="i-act-attach" size={18} />
            </button>
          ) : null}
          {canSend ? (
            <button className="cc-send" type="button" aria-label="发送" onClick={onSubmit}>
              <Icon name="i-arrow-up" size={16} />
            </button>
          ) : (
            <>
              {onMic ? (
                <button
                  className={recording ? 'cc-icon-button is-recording' : 'cc-icon-button'}
                  type="button"
                  aria-label={recording ? '停止语音输入' : '语音输入'}
                  aria-pressed={recording}
                  onClick={onMic}
                >
                  <Icon name="i-mic" size={18} />
                </button>
              ) : null}
              {onVoiceChat ? (
                <button className="cc-icon-button" type="button" aria-label="Voice Chat" onClick={onVoiceChat}>
                  <Icon name="i-phone" size={18} />
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>

      {attachments}
      {overlay}
      {note ? <p className="cc-note">{note}</p> : null}
    </div>
  )
}
