import { useRef, useState } from 'react'
import { Icon } from '@/components/base/icon'
import { Tooltip } from '@/components/base/tooltip'
import { useTranslation } from '@/platform/i18n'
import type { BrowserTab } from '../../types'

export type BrowserTabItemProps = {
	tab: BrowserTab
	/** 是否是当前页 */
	active: boolean
	onActivate: (key: string) => void
	onClose: (key: string) => void
}

/* 一个标签项：整块是标签本体，悬停、当前、焦点、点选与中键都由它自己接；
   块里放图标与标题，关闭键是块内的兄弟控件，点它只关闭、不激活。

   刻意不用 MotionPanel：它基于 motion 的布局投影，会在元素上写 transform，
   而投影测量在 WebKit 里会对小数宽度（本行实测 75.25）来回取整，指针一进一出就看见跳。
   入场的淡入位移由 browser.less 的 browser-tab-in 关键帧给，纯 CSS，不碰布局投影。 */
export function BrowserTabItem({ tab, active, onActivate, onClose }: BrowserTabItemProps) {
	const { t } = useTranslation()
	const labelRef = useRef<HTMLSpanElement>(null)
	/* 标题被省略号截断时才给提示；提示用本包统一的 Tooltip，观感与导航列等处一致，
	   不用浏览器原生的 title 气泡 */
	const [truncated, setTruncated] = useState(false)
	const label = (
		<span
			className="browser__tab-label"
			ref={labelRef}
			onPointerEnter={() => {
				const node = labelRef.current
				setTruncated(!!node && node.scrollWidth > node.clientWidth)
			}}
		>
			{tab.label}
		</span>
	)
	return (
		<span
			className="browser__tab"
			data-active={active || undefined}
			data-closable={tab.closable || undefined}
			onAuxClick={(event) => {
				// 中键关闭（首页不可关）
				if (event.button === 1 && tab.closable) {
					event.preventDefault()
					onClose(tab.key)
				}
			}}
		>
			<span
				className="browser__tab-main"
				role="tab"
				aria-selected={active}
				onClick={() => onActivate(tab.key)}
			>
				<Icon name={tab.closable ? 'i-globe' : 'i-home'} size={14} />
				{truncated ? (
					<Tooltip label={tab.label} side="bottom">
						{label}
					</Tooltip>
				) : (
					label
				)}
			</span>
			{tab.closable ? (
				/* 关闭键不套基础 Button，也不套 Tooltip：两者都会往这一行里插自己的包装与属性。
				   这里只留一个固定 24 的普通元素，悬停只改它自己的颜色与缩放；名字用 aria-label 给 */
				<span
					className="browser__tab-close"
					role="button"
					tabIndex={-1}
					aria-label={t('shell.browser.tab.close')}
					onClick={() => onClose(tab.key)}
				>
					<Icon name="i-act-close" size={14} />
				</span>
			) : null}
		</span>
	)
}
