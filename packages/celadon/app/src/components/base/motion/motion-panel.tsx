import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import { PANEL_SPRING, PANEL_INSTANT } from './panel-motion'

export type MotionPanelProps = HTMLMotionProps<'div'> & {
	/** 参与布局动画的元素标签，默认 div；列用 aside、主区用 main */
	as?: 'div' | 'aside' | 'main' | 'section' | 'nav'
	/** 是否为位移型元素（行、文字、图标）：只平移不缩放，文字因此不变形 */
	position?: boolean
}

/** 参与列联动的容器：位置与尺寸变化交给 Motion 的布局投影，动画期间不动布局。
 *
 * 约定见 `plan/08-layout-motion.md`：
 * - 外壳用本组件（`layout`），内部的条目与文字再加 `position`（对应 `layout="position"`）；
 * - 位移型元素一律 `position`，否则父级尺寸变化的投影会把文字一起缩放，出现变形与发虚；
 * - 减少动效偏好下退化为瞬时，不播放动画；
 * - 拖拽改宽期间传 `transition={PANEL_INSTANT}`，宽度跟手不做动画。
 */
export function MotionPanel({ as = 'div', position = false, transition, ...rest }: MotionPanelProps) {
	const reduced = useReducedMotion()
	const Component = motion[as]
	const layout = position ? 'position' : true
	return <Component layout={layout} transition={transition ?? (reduced ? PANEL_INSTANT : PANEL_SPRING)} {...rest} />
}
