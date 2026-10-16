import './content.less'
import type { ReactNode } from 'react'
import { ScrollArea } from '@/components/base/scroll-area'
import { ContentHead, type HeadKey } from './parts/head'

export type ContentProps = {
	children: ReactNode
	/** 列头标题；不传就不画列头 */
	title?: string
	/** 导航列是否收起：收起才接管交通灯留白 */
	navCollapsed?: boolean
	/** 列头左端槽位的键；不传则留空 */
	lead?: HeadKey
	/** 列头右端槽位的键；不传则留空 */
	trail?: HeadKey
	/** 本栏收掉了（换边后次栏是内容区）：内容不再可达，也从无障碍树里摘掉 */
	hidden?: boolean
	/** 本栏是次栏（换边后）：列头贴住窗口右缘，收放时标题不跟着滑 */
	pinned?: boolean
}

/* 中栏：页面容器。栏宽由三栏的列轨给（让步顺序见 design/foundations.md F6），
   这一层只管最小宽与自己的滚动 —— 内容形态的其余三种等用到处再加。
   列头（40 像素）与另外两列等高；两颗键与标题都由装配层给。
   宽度变化由列轨与 `content.less` 的过渡承担：不做尺寸投影，正文就不会被横向压缩。 */
export function Content({
	children,
	title,
	navCollapsed = false,
	lead,
	trail,
	hidden = false,
	pinned = false
}: ContentProps) {
	return (
		<main className='content' aria-hidden={hidden || undefined} inert={hidden || undefined}>
			{title ? (
				<ContentHead title={title} navCollapsed={navCollapsed} lead={lead} trail={trail} pinned={pinned} />
			) : null}
			<ScrollArea className='content__scroll' size='medium' persistent>
				{children}
			</ScrollArea>
		</main>
	)
}
