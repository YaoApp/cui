import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import type { MessageItem } from '@/components/message-list'
import { useTranslation } from '@/platform/i18n'

export type MessageActionsProps = {
  message: MessageItem
  onBranch?: (message: MessageItem) => void
  branching?: boolean
  disabled?: boolean
}

export function MessageActions({ message, onBranch, branching = false, disabled = false }: MessageActionsProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className='message-actions'>
      <Button
        variant='ghost'
        size='small'
        icon={<Icon name={copied ? 'i-check' : 'i-act-copy'} size={14} />}
        onClick={copy}
      >
        {copied ? t('session.copied') : t('session.copy')}
      </Button>
      {onBranch ? (
        <Button
          variant='ghost'
          size='small'
          icon={<Icon name='i-branch' size={14} />}
          loading={branching}
          disabled={disabled || branching}
          onClick={() => onBranch(message)}
        >
          {branching ? t('session.branch.creating') : t('session.branch.action')}
        </Button>
      ) : null}
    </div>
  )
}
