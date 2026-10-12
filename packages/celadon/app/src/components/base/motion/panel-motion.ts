import type { Transition } from 'motion/react'

/** 列收放的 spring 参数。
 *
 * 时长与曲线在 `design/tokens.less` 里（`--duration-base` 与 `--easing-decelerate`），
 * 它自带 `still` / `quiet` / `rich` 三档；spring 参数写不进自定义属性，因此放在这里一处，
 * 数值按同一节奏选：位移约一顿饭的宽度（约 224 像素）时目视大约 200 毫秒收住，不出现过冲回弹。
 */
export const PANEL_SPRING = {
	type: 'spring',
	stiffness: 420,
	damping: 38,
	mass: 0.9
} as const satisfies Transition

/** 拖拽改宽期间的过渡：不动画，宽度跟手。 */
export const PANEL_INSTANT = { duration: 0 } as const satisfies Transition

/** 读取 CSS 里的时长（毫秒）。取不到时回退到与 `--duration-base` 相同的值。 */
export function panelDurationMs(fallback = 200): number {
	if (typeof window === 'undefined') return fallback
	const raw = getComputedStyle(document.documentElement).getPropertyValue('--duration-base').trim()
	const value = Number.parseFloat(raw)
	return Number.isFinite(value) ? value : fallback
}

/** 读取 CSS 里的曲线，取不到或解析不了时回退到减速曲线。返回四元组，交给 Motion 的 ease 用。 */
export function panelEase(
	fallback: [number, number, number, number] = [0, 0, 0.2, 1]
): [number, number, number, number] {
	if (typeof window === 'undefined') return fallback
	const raw = getComputedStyle(document.documentElement).getPropertyValue('--easing-decelerate').trim()
	const nums = raw.match(/-?\d*\.?\d+/g)
	if (nums && nums.length === 4) {
		const value = nums.map(Number) as [number, number, number, number]
		if (value.every((n) => Number.isFinite(n))) return value
	}
	return fallback
}

/** 时长曲线档（不引入 spring 时使用，例如减少动效偏好下退化为瞬时）。 */
export function panelTiming(reduced = false): Transition {
	if (reduced) return PANEL_INSTANT
	return { duration: panelDurationMs() / 1000, ease: panelEase() }
}
