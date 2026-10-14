import { useEffect, useRef, useState } from 'react'
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
   入场的淡入位移由 browser.less 的 browser-tab-in 关键帧给，纯 CSS，不碰布局投影。

   标题分两层：外层是被悬停的框（统一 Tooltip 的触发元素），内层才是负责省略号的那一段。
   Safari 会给「正在被省略号截断的元素」自己弹一个原生提示，且与 title 属性无关；
   把省略号放在内层并让它不接指针事件，Safari 就没有可瞄准的对象，原生提示不会出现。 */
export function BrowserTabItem({ tab, active, onActivate, onClose }: BrowserTabItemProps) {
	const { t } = useTranslation()
	/* 观测挂在主体上，不挂在标题上：标题要作为统一 Tooltip 的触发元素交给基础件渲染，
	   基础件会接管它的 ref，挂在同一节点上的 ref 拿不到节点。主体是我们自己的元素，稳定 */
	const mainRef = useRef<HTMLSpanElement>(null)
	/* 标题被省略号截断时才挂统一 Tooltip。截断与否必须在指针进来之前就定下来：
	   若等悬停时才挂上 Tooltip，第一次悬停赶不上这次指针事件，气泡不会出现；
	   所以挂尺寸观测，标签宽度或文字一变就重算，指针进来时 Tooltip 已经在树上 */
	const [truncated, setTruncated] = useState(false)
	useEffect(() => {
		const main = mainRef.current
		if (!main) return
		const check = () => {
			const text = main.querySelector('.browser__tab-text')
			if (!text) return
			setTruncated(text.scrollWidth > text.clientWidth)
		}
		check()
		const observer = new ResizeObserver(check)
		observer.observe(main)
		return () => observer.disconnect()
	}, [tab.label])
	const label = (
		<span className="browser__tab-label">
			<span className="browser__tab-text">{tab.label}</span>
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
				ref={mainRef}
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
