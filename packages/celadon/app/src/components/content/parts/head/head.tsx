import type { CSSProperties, ReactNode } from 'react'
import { Button, Icon } from '@/components/base'
import { MotionPanel } from '@/components/base/motion'
import { Tooltip } from '@/components/base/tooltip'
import { useWindowChrome } from '@/platform/client'
import type { IconId } from '@/platform/icons'
import './head.less'

/** 列头两侧插槽里装的一颗键。装什么、显不显、禁不禁用都由装配层按角色算好，列头只负责画。 */
export type HeadKey = {
	/** 图形 */
	icon: IconId
	/** 这一栏当前是展开还是收起，决定 aria-expanded */
	expanded: boolean
	/** 不显示时槽位收成零宽，键本身淡出（沿用既有做法） */
	visible: boolean
	/** 受平台或窗口限制：置灰并说明原因，不出现按下去没有反应的键 */
	blocked?: boolean
	/** 无障碍名与气泡文案，由装配层翻译好 */
	label: string
	/** 置灰时的原因文案 */
	blockedLabel?: string
	onClick: () => void
}

export type ContentHeadProps = {
	/** 这一页的标题；不传只画两侧插槽 */
	title?: string
	/** 导航列是否收起：收起才接管交通灯留白 */
	navCollapsed: boolean
	/** 左端槽位：导航找回键；不传则留空 */
	lead?: HeadKey
	/** 右端槽位：次栏的收起键或找回键；不传则留空 */
	trail?: HeadKey
	/** 右侧插槽：与当前页有关的动作，放在次栏操作键之前 */
	trailing?: ReactNode
	/** 本栏是次栏（换边后）：列头不参与布局投影，贴住窗口右缘，收放时标题与键都不跟着滑 */
	pinned?: boolean
}

/* 内容列的标题栏（40 像素，与另两列列头等高）。
   三个区域固定：左槽位 · 中标题 · 右槽位与业务插槽。
   两颗键的显示与文案由装配层按主栏 / 次栏的角色给：主栏是中间那一栏，次栏是离导航最远的那一栏，
   这一层不认识角色，也不认识业务。 */
export function ContentHead({ title, navCollapsed, lead, trail, trailing, pinned = false }: ContentHeadProps) {
	const chrome = useWindowChrome()
	return (
		/* 主栏里列头随列平移：尺寸变化的投影不允许缩到标题上；
		   次栏里关掉投影（`project={false}`），列头按窗口右缘摆，收放时标题不动，只被列的左缘裁掉 */
		<MotionPanel
			as='header'
			position
			project={!pinned}
			className='content__head'
			data-controls={chrome.controls}
			data-nav={navCollapsed ? 'collapsed' : 'expanded'}
			style={
				{
					/* macOS 且导航收起：这一行接管交通灯留白 */
					'--head-inset':
						navCollapsed && chrome.controls === 'native' ? 'var(--traffic-lights-width)' : '0px'
				} as CSSProperties
			}
		>
			{/* Windows 的收放键在自绘标题栏里，装配层因此不传导航键；窗口窄到由视口强制收起时置灰并给出原因 */}
			{lead ? <HeadSlot slot={lead} trail={false} /> : null}
			{title ? <h1 className='content__title'>{title}</h1> : null}
			{trailing ? <span className='content__head-trailing'>{trailing}</span> : null}
			{/* 提示挂在外层 span 上，因为禁用态的按钮收不到指针事件，气泡否则不会出现 */}
			{trail ? <HeadSlot slot={trail} trail /> : null}
		</MotionPanel>
	)
}

/* 一颗键：槽位宽度由 CSS 给，不显示时收成零宽；键的淡入淡出也在 CSS 里 */
function HeadSlot({ slot, trail }: { slot: HeadKey; trail: boolean }) {
	const text = slot.blocked ? (slot.blockedLabel ?? slot.label) : slot.label
	return (
		<span
			className={trail ? 'content__head-slot content__head-slot--browser' : 'content__head-slot'}
			data-hidden={!slot.visible}
		>
			<Tooltip label={text} side='bottom'>
				<span className='content__head-key-wrap' title={slot.blocked ? text : undefined}>
					<Button
						className={
							trail ? 'content__head-key content__head-key--browser' : 'content__head-key'
						}
						iconOnly
						variant='plain'
						size='small'
						disabled={slot.blocked}
						aria-label={text}
						aria-expanded={slot.expanded}
						onClick={slot.onClick}
					>
						<Icon name={slot.icon} size={16} />
					</Button>
				</span>
			</Tooltip>
		</span>
	)
}
