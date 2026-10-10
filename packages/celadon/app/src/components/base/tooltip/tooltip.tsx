import './tooltip.less'
import type { ReactElement } from 'react'
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'

export type TooltipProps = {
  /** 提示文字，调用方从语言包取 */
  label: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** 触发提示的元素：必须能接收 props（按钮 · 图标按钮 · 链接） */
  children: ReactElement
}

/* 文字提示：与上游一致，悬停延时、焦点跟随、`Esc` 关闭都由 `@base-ui/react` 的 Tooltip 负责，
   这里只做视觉（`architecture/03-boundaries.md` §3：基础件包装上游 + token 类）。 */
export function Tooltip({ label, side = 'top', children }: TooltipProps) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={6} className="tooltip__positioner">
          <BaseTooltip.Popup className="tooltip__popup">{label}</BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  )
}
