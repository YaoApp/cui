import './content.less'
import type { ReactNode } from 'react'
import { ScrollArea } from '@/components/base/scroll-area'

export type ContentProps = {
  children: ReactNode
}

/* 中栏：页面容器。栏宽由三栏的列轨给（让步顺序见 design/foundations.md F6），
   这一层只管最小宽与自己的滚动 —— 内容形态的其余三种等用到处再加（plan/08-layout-base.md §3.3）。 */
export function Content({ children }: ContentProps) {
  return (
    <main className="content">
      <ScrollArea className="content__scroll" size="medium" persistent>{children}</ScrollArea>
    </main>
  )
}
