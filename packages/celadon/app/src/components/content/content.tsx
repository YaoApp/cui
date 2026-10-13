import './content.less'
import type { ReactNode } from 'react'
import type { Transition } from 'motion/react'
import { ScrollArea } from '@/components/base/scroll-area'
import { MotionPanel } from '@/components/base/motion'
import { ContentHead } from './parts/head'

export type ContentProps = {
	children: ReactNode
	/** 列头标题；不传就不画列头 */
	title?: string
	/** 导航列是否收起：收起才展示导航操作按钮，并接管交通灯留白 */
	navCollapsed?: boolean
	/** 窗口窄到由视口强制收起导航：切换键置灰并给出原因 */
	navBlocked?: boolean
	/** 标签浏览器列是否收起：收起才展示 Browser 操作按钮 */
	browserCollapsed?: boolean
	/** 窗口窄到放不下标签浏览器那一栏：切换键置灰并给出原因 */
	browserBlocked?: boolean
	/** 拖动任一列改宽期间传瞬时过渡：中栏只跟手，不做任何补间 */
	transition?: Transition
	onToggleNav?: () => void
	onToggleBrowser?: () => void
}

/* 中栏：页面容器。栏宽由三栏的列轨给（让步顺序见 design/foundations.md F6），
   这一层只管最小宽与自己的滚动 —— 内容形态的其余三种等用到处再加（plan/08-layout-base.md §3.3）。
   列头（40 像素）与另外两列等高，见 plan/08-layout-shell.md §5.2；标题与插槽都由装配层给。
   这一列只做位置投影（`position`）：宽度跟着列轨变，正文与列头都不参与尺寸投影，
   因此收起展开与拖动期间文字不会发虚或压扁（plan/08-layout-motion.md §2 硬约束一）。 */
export function Content({
	children,
	title,
	navCollapsed = false,
	navBlocked = false,
	browserCollapsed = false,
	browserBlocked = false,
	transition,
	onToggleNav = () => {},
	onToggleBrowser = () => {}
}: ContentProps) {
	return (
		<MotionPanel as='main' position className='content' transition={transition}>
			{title ? (
				<ContentHead
					title={title}
					navCollapsed={navCollapsed}
					navBlocked={navBlocked}
					browserCollapsed={browserCollapsed}
					browserBlocked={browserBlocked}
					onToggleNav={onToggleNav}
					onToggleBrowser={onToggleBrowser}
				/>
			) : null}
			<ScrollArea className='content__scroll' size='medium' persistent>
				{children}
			</ScrollArea>
		</MotionPanel>
	)
}
