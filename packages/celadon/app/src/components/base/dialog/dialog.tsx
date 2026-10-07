import type { ReactNode, RefObject } from 'react'
import { useRef } from 'react'
import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import './dialog.less'

/** 面板宽度档：`form` 给表单与步骤（480），`page` 用来打开一整页内容（中栏可读宽）。 */
export type DialogSize = 'form' | 'page'

export type DialogProps = {
  /** 受控开关。 */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 进场或退场动画结束（上游同名回调）：退场结束时才是真正可以卸载面板的时机。 */
  onOpenChangeComplete?: (open: boolean) => void
  /** 标题：落在 `Dialog.Title` 上，由上游与 `role="dialog"` 关联。 */
  title: ReactNode
  /** 标题下的一句说明，可省；省了不占位。 */
  description?: ReactNode
  /** 关闭钮的无障碍名，文案由调用方的语言包给。 */
  closeLabel: string
  /** 固定底部操作区，通常是主次两个按钮；可省。 */
  footer?: ReactNode
  /** 宽度档。 */
  size?: DialogSize
  /** 点遮罩是否关闭（上游语义）；按 Esc 关闭由上游负责。 */
  disablePointerDismissal?: boolean
  /** 打开时先聚焦哪里；不传则由上游聚焦第一个可聚焦元素。 */
  initialFocus?: boolean | RefObject<HTMLElement | null>
  className?: string
  children: ReactNode
}

/**
 * 弹窗页面：把一整步内容装进浮层，头部与底部固定、正文自己滚。
 *
 * 术语上 dialog 是控件、modal 是行为，这里是两者的合体（模态的弹窗页面）。行为一件都不自己写：
 * 焦点陷阱、按 Esc 关闭、点遮罩关闭、关闭后焦点归位、嵌套弹窗的标记全部由上游部件负责，
 * 本组件只做界面适配（外壳、取值、动效）。需要特殊形态时用 `DialogParts` 直接拼上游部件。
 *
 * 视觉取自规范：遮罩 `--scrim`，面板 `--background-surface` 加 `--border-default` 边界、`--radius-large`
 * 与 `--shadow-overlay`（L3 档），动效取 `modal` 场景（进场减速、退场加速且只淡出），宽度两档见 `--dialog-width`。
 */
export function DialogPage({
  open,
  onOpenChange,
  onOpenChangeComplete,
  title,
  description,
  closeLabel,
  footer,
  size = 'form',
  disablePointerDismissal = false,
  initialFocus,
  className,
  children,
}: DialogProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
      disablePointerDismissal={disablePointerDismissal}
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="dialog__scrim" />
        <BaseDialog.Viewport className="dialog__viewport">
          <BaseDialog.Popup
            ref={popupRef}
            tabIndex={-1}
            className={['dialog', size === 'page' ? 'dialog--page' : null, className].filter(Boolean).join(' ')}
            /* 默认把焦点交给面板本身，而不是第一个可聚焦元素：上游默认会落在头部的关闭钮上，
               打开弹窗即选中一个次要动作，读屏会先念「关闭」。面板自己可聚焦（tabIndex=-1），
               于是焦点进入弹窗内部（模态要求），Tab 才走到关闭钮与内容。调用方传 initialFocus 即以它为准。 */
            initialFocus={initialFocus ?? popupRef}
          >
            <header className="dialog__head">
              <BaseDialog.Title className="dialog__title">{title}</BaseDialog.Title>
              <BaseDialog.Close
                render={
                  <Button
                    type="button"
                    className="dialog__close"
                    variant="plain"
                    iconOnly
                    aria-label={closeLabel}
                    icon={<Icon name="i-act-close" />}
                  />
                }
              />
            </header>
            {description ? (
              <BaseDialog.Description className="dialog__description">{description}</BaseDialog.Description>
            ) : null}
            <div className="dialog__body">{children}</div>
            {footer ? <footer className="dialog__foot">{footer}</footer> : null}
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}

/** 上游 Dialog 的全部部件：需要特殊形态时直接用，行为与可访问性仍在。 */
export * as DialogParts from '@base-ui/react/dialog'
