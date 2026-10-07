import type { ReactNode } from 'react'
import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog'
import { Button } from '@/components/base/button'
import '../dialog/dialog.less'

export type AlertDialogProps = {
  /** 受控开关。 */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 标题，由上游与 `role="alertdialog"` 关联。 */
  title: ReactNode
  /** 正文：说清后果与不可撤回之处。 */
  description?: ReactNode
  /** 主操作：通常是危险或品牌实心按钮。 */
  confirm: ReactNode
  /** 次操作：取消。 */
  cancel: ReactNode
  className?: string
  children?: ReactNode
}

/**
 * 确认框：不可点遮罩关闭的模态弹窗，必须选一个。
 *
 * 与弹窗页面同一套面板样式（`.dialog*`），差别只在行为：上游的 `AlertDialog` 不响应点遮罩与按 Esc，
 * 因此适合删除、断开、覆盖这类不可撤回的操作。界面上没有关闭钮：出口就是底部那两个操作。
 */
export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirm,
  cancel,
  className,
  children,
}: AlertDialogProps) {
  return (
    <BaseAlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseAlertDialog.Portal>
        <BaseAlertDialog.Backdrop className="dialog__scrim" />
        <BaseAlertDialog.Viewport className="dialog__viewport">
          <BaseAlertDialog.Popup className={['dialog', className].filter(Boolean).join(' ')}>
            <header className="dialog__head">
              <BaseAlertDialog.Title className="dialog__title">{title}</BaseAlertDialog.Title>
            </header>
            {description ? (
              <BaseAlertDialog.Description className="dialog__description">{description}</BaseAlertDialog.Description>
            ) : null}
            {children ? <div className="dialog__body">{children}</div> : null}
            <footer className="dialog__foot">
              <BaseAlertDialog.Close render={<Button type="button" variant="ghost" />}>{cancel}</BaseAlertDialog.Close>
              {/* 主操作也走上游的 Close：关闭原因与焦点归位由上游按同一条路处理，
                  自己在 onClick 里翻 open 会绕过它，finalFocus 一类回调读不到关闭原因 */}
              <BaseAlertDialog.Close render={<Button type="button" variant="inverse" />}>{confirm}</BaseAlertDialog.Close>
            </footer>
          </BaseAlertDialog.Popup>
        </BaseAlertDialog.Viewport>
      </BaseAlertDialog.Portal>
    </BaseAlertDialog.Root>
  )
}
