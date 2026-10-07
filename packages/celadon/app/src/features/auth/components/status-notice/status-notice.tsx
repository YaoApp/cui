import type { ReactNode } from 'react'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import './status-notice.less'

export type StatusNoticeProps = {
  /** 已翻译的文案：接口失败时取 `failure.text`，页面文案取语言包。 */
  text: string
  /** 两种色调：一般提示用 `info`，失败用 `danger`。 */
  tone?: 'info' | 'danger'
  /** 可重试时给出按钮文案，与 `onRetry` 成对出现。 */
  retryLabel?: string
  onRetry?: () => void
  /** 提示右侧的附加内容（例如关闭或换一张）。 */
  action?: ReactNode
  className?: string
}

/**
 * 页面级状态提示：一行文字加一个图标，可选一个重试按钮。
 *
 * 只承担页面级的提示；字段级的错误仍走字段组件自己的消息位，两者不要重复表达同一件事。
 * 失败用 `role="alert"`，一般提示用 `role="status"`，读屏会分别打断与排队播报。
 */
export function StatusNotice({ text, tone = 'info', retryLabel, onRetry, action, className }: StatusNoticeProps) {
  return (
    <div
      className={['status-notice', `status-notice--${tone}`, className].filter(Boolean).join(' ')}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <span className="status-notice__icon" aria-hidden="true">
        <Icon name={tone === 'danger' ? 'i-state-error' : 'i-state-info'} />
      </span>
      <span className="status-notice__text">{text}</span>
      {onRetry && retryLabel ? (
        <Button type="button" variant="plain" size="small" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
      {action}
    </div>
  )
}
