import type { ReactNode, RefObject } from 'react'
import { useRef } from 'react'
import { Drawer as BaseDrawer } from '@base-ui/react/drawer'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import './drawer.less'

export type DrawerProps = {
  /** 受控开关。 */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 标题：由上游与 `role="dialog"` 关联。 */
  title: ReactNode
  /** 关闭钮的无障碍名，文案由调用方的语言包给。 */
  closeLabel: string
  /** 固定底部操作区；可省。 */
  footer?: ReactNode
  /** 停靠边：窄屏导航贴行首，筛选面板贴行末。 */
  side?: 'start' | 'end'
  /** 打开时先聚焦哪里；不传则由上游聚焦第一个可聚焦元素。 */
  initialFocus?: boolean | RefObject<HTMLElement | null>
  className?: string
  children: ReactNode
}

/**
 * 抽屉：贴边滑入的模态弹窗，窄屏导航与筛选面板用。
 *
 * 与弹窗页面共用遮罩与面板的取值，差别在位置与动效：面板贴行首或行末、铺满高度，
 * 进出走动效规范的 `drawer` 场景（进场慢档减速，退场快档加速）。滑动关闭与焦点管理由上游负责。
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  closeLabel,
  footer,
  side = 'start',
  initialFocus,
  className,
  children,
}: DrawerProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  return (
    <BaseDrawer.Root open={open} onOpenChange={onOpenChange}>
      <BaseDrawer.Portal>
        <BaseDrawer.Backdrop className="dialog__scrim" />
        <BaseDrawer.Viewport
          className={['drawer__viewport', side === 'end' ? 'drawer__viewport--end' : null].filter(Boolean).join(' ')}
        >
          <BaseDrawer.Popup
            ref={popupRef}
            tabIndex={-1}
            className={['drawer', side === 'end' ? 'drawer--end' : null, className].filter(Boolean).join(' ')}
            /* 与弹窗同一条约定：焦点默认交给面板本身，不落在头部的关闭钮上 */
            initialFocus={initialFocus ?? popupRef}
          >
            <header className="dialog__head">
              <BaseDrawer.Title className="dialog__title">{title}</BaseDrawer.Title>
              <BaseDrawer.Close
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
            <div className="dialog__body">{children}</div>
            {footer ? <footer className="dialog__foot">{footer}</footer> : null}
          </BaseDrawer.Popup>
        </BaseDrawer.Viewport>
      </BaseDrawer.Portal>
    </BaseDrawer.Root>
  )
}
