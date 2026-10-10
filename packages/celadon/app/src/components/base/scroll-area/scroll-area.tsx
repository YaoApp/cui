import './scroll-area.less'
import type { ReactNode } from 'react'
import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area'

/** 滚动条尺寸档：small 4 · medium 6 · large 8（见 design/tokens.less）。 */
export type ScrollAreaSize = 'small' | 'medium' | 'large'

export type ScrollAreaProps = {
  children: ReactNode
  /** 尺寸档，按所在栏的宽窄选；默认 medium */
  size?: ScrollAreaSize
  /** 常驻：这一块的滚动条一直展示（内容区这类主阅读区用）；默认为假，指针进入才出现 */
  persistent?: boolean
  className?: string
}

/* 三栏各自的滚动容器：滚动行为与滚动条由上游部件负责，边缘阴影按上游给出的
   `data-overflow-y-start` / `data-overflow-y-end` 出现或消失（只有真的溢出才画）。
   见 `architecture/03-boundaries.md` §3 与 `plan/08-layout-base.md` 第 12 条。 */
export function ScrollArea({
  children,
  size = 'medium',
  persistent = false,
  className,
}: ScrollAreaProps) {
  const classes = ['scroll-area', `scroll-area--${size}`, persistent ? 'scroll-area--persistent' : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <BaseScrollArea.Root className={classes}>
      <BaseScrollArea.Viewport className="scroll-area__viewport">
        {children}
      </BaseScrollArea.Viewport>
      <BaseScrollArea.Scrollbar orientation="vertical" className="scroll-area__bar">
        <BaseScrollArea.Thumb className="scroll-area__thumb" />
      </BaseScrollArea.Scrollbar>
    </BaseScrollArea.Root>
  )
}
