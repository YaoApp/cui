import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/base/icon'
import { Tooltip } from '@/components/base/tooltip'
import { useTranslation } from '@/platform/i18n'
import type { BrowserTab } from '../../types'

export type BrowserTabItemProps = {
	tab: BrowserTab
	/** 是否是当前页 */
	active: boolean
	/** 放不下、进了下拉菜单：仍渲染（宽度量得到），但收成不可见并脱离排布 */
	hidden?: boolean
	/** 键盘落点：roving tabindex，当前落点为 0，其余为 -1 */
	tabIndex?: number
	onActivate: (key: string) => void
	onClose: (key: string) => void
}

/* 一个标签项：整块是标签本体，悬停、当前、焦点、点选与中键都由它自己接；
   块里放图标与标题，关闭键是块内的兄弟控件，点它只关闭、不激活。

   刻意不用 MotionPanel：它基于 motion 的布局投影，会在元素上写 transform，
   而投影测量在 WebKit 里会对小数宽度（本行实测 75.25）来回取整，指针一进一出就看见跳。
   入场的淡入位移由 `data-enter` 加过渡给（见下），纯 CSS，不碰布局投影。

   WebKit 会给「正在被省略号截断的元素」自己弹一个原生提示，它与 title 属性无关，
   元素上写空 title 也压不住。所以标题这一段取 pointer-events: none，指针永远落不到它身上，
   截断信息由覆盖整块主体的统一 Tooltip 承担。观测因此挂在最外层块上：
   主体在截断时会交给基础件当触发元素，ref 会被接管，外层块是我们自己的元素，稳定。 */
export function BrowserTabItem({
	tab,
	active,
	hidden = false,
	tabIndex = -1,
	onActivate,
	onClose
}: BrowserTabItemProps) {
	const { t } = useTranslation()
	const blockRef = useRef<HTMLSpanElement>(null)
	/* 标题被省略号截断时才挂统一 Tooltip。截断与否必须在指针进来之前就定下来：
	   若等悬停时才挂上 Tooltip，第一次悬停赶不上这次指针事件，气泡不会出现；
	   所以挂尺寸观测，标签宽度或文字一变就重算，指针进来时 Tooltip 已经在树上 */
	const [truncated, setTruncated] = useState(false)
	/* 入场的淡入位移：只在挂载后的第一帧挂上 data-enter，下一帧摘掉，由过渡走完。
	   不用 CSS 动画：换序时 React 会把节点重新插入，WebKit 会把动画从头再跑一遍，
	   松手那一刻所有挪过位置的标签一起淡入，看上去就是整条闪一下。过渡只在属性值变化时走，
	   重插不触发。 */
	const [entering, setEntering] = useState(true)
	useEffect(() => {
		const id = requestAnimationFrame(() => setEntering(false))
		return () => cancelAnimationFrame(id)
	}, [])
	useEffect(() => {
		const block = blockRef.current
		if (!block) return
		const check = () => {
			const label = block.querySelector('.browser__tab-label')
			if (!label) return
			/* 两个读数都是取整后的整数，短标题在小数宽度上会出现一像素的假差，
			   留一像素余量，避免没截断也弹提示 */
			setTruncated(label.scrollWidth - label.clientWidth > 1)
		}
		check()
		/* 单测环境（jsdom）没有 ResizeObserver：只跳过观测，不往全局钉桩 ——
		   钉了会让上游组件走进只有真浏览器才成立的分支 */
		if (typeof ResizeObserver === 'undefined') return
		const observer = new ResizeObserver(check)
		observer.observe(block)
		return () => observer.disconnect()
	}, [tab.label])
	const main = (
		<span
			className="browser__tab-main"
			role="tab"
			tabIndex={tabIndex}
			aria-selected={active}
			onClick={() => onActivate(tab.key)}
		>
			<Icon name={tab.icon ?? (tab.closable ? 'i-globe' : 'i-home')} size={14} />
			<span className="browser__tab-label">{tab.label}</span>
		</span>
	)
	return (
		<span
			className="browser__tab"
			ref={blockRef}
			data-active={active || undefined}
			data-closable={tab.closable || undefined}
			data-hidden={hidden || undefined}
			data-enter={entering || undefined}
			data-tab-key={tab.key}
			onAuxClick={(event) => {
				// 中键关闭（首页不可关）
				if (event.button === 1 && tab.closable) {
					event.preventDefault()
					onClose(tab.key)
				}
			}}
		>
			{truncated ? (
				<Tooltip label={tab.label} side="bottom">
					{main}
				</Tooltip>
			) : (
				main
			)}
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
