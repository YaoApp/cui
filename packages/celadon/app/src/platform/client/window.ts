/* 无标题栏窗口的窗口动作：桌面由宿主执行，Web 下按钮与拖动都不出现。
   组件只读这里的能力与 props，不判宿主（`architecture/03-boundaries.md` §2 的平台差异规则）。 */
import { useEffect, useState } from 'react'
import { client } from './facts'
import { windowChrome } from '../bridge/window'
import { isOk } from '../bridge/result'

/** 顶部拖动带的高度：窗口最上面这一条里，空白处都可移动窗口。 */
const DRAG_BAND_FALLBACK = 48

/** 这些元素上的按下不当作拖动，控件照旧可用。 */
const INTERACTIVE = 'button, a, input, select, textarea, [contenteditable], [data-no-drag]'

export type WindowChrome = {
	/** 要不要画窗口按钮：只有桌面壳有窗口可管 */
	visible: boolean
	/** 窗口键归谁：原生（macOS 交通灯）· 自绘（Windows）· 没有（Web） */
	controls: 'native' | 'own' | 'none'
	/** 当前是否最大化，用来在最大化与还原之间换图形 */
	maximized: boolean
	toggleMaximize: () => void
	/** 最近一次拖动请求的结果，给顶行的调试标记显示：idle · calling · ok · failed:… */
	dragState: string
	minimize: () => void
	close: () => void
}

/** 顶部拖动带的高度：优先读 token，取不到用兜底值。 */
function dragBandHeight(): number {
	if (typeof window === 'undefined') return DRAG_BAND_FALLBACK
	const value = getComputedStyle(document.documentElement).getPropertyValue('--window-drag-band')
	const parsed = Number.parseFloat(value)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DRAG_BAND_FALLBACK
}

export function useWindowChrome(): WindowChrome {
	const visible = client.kind === 'desktop'
	const [dragState, setDragState] = useState('idle')
	const [maximized, setMaximized] = useState(false)
	/* 平台决定窗口键归谁：macOS 有原生交通灯，Windows 关掉原生边框后必须自绘，Web 两种都没有 */
	const controls: WindowChrome['controls'] =
		client.kind !== 'desktop' ? 'none' : client.os === 'windows' ? 'own' : 'native'

	/* 窗口尺寸变化后读一次最大化状态，用来选图形 */
	useEffect(() => {
		if (controls !== 'own') return
		const sync = () => {
			void windowChrome.maximized().then((result) => {
				if (isOk(result)) setMaximized(result.value)
			})
		}
		sync()
		window.addEventListener('resize', sync)
		return () => window.removeEventListener('resize', sync)
	}, [controls])

	const drag = () => {
		setDragState('calling')
		windowChrome.startDragging().then(
			() => setDragState('ok'),
			(error: unknown) => setDragState(`failed:${String(error).slice(0, 60)}`)
		)
	}

	/* 顶部那一条带子统一可拖：无论导航列、内容区还是标签栏，只要指针落在窗口最上面这一带，
     空白处按下即拖动窗口。控件（按钮、链接、输入、标了 data-no-drag 的）不吃拖动，点击照旧。
     在 window 上受理一次，各栏不必各写一层。 */
	useEffect(() => {
		if (!visible) return
		const onPointerDown = (event: PointerEvent) => {
			if (event.button !== 0) return
			if (event.clientY > dragBandHeight()) return
			const target = event.target
			if (!(target instanceof Element)) return
			if (target.closest(INTERACTIVE)) return
			drag()
		}
		window.addEventListener('pointerdown', onPointerDown, true)
		return () => {
			window.removeEventListener('pointerdown', onPointerDown, true)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [visible])

	return {
		visible,
		controls,
		maximized,
		toggleMaximize: () => {
			void windowChrome.toggleMaximize().then((result) => {
				if (isOk(result)) setMaximized(result.value)
			})
		},
		dragState,
		minimize: () => {
			void windowChrome.minimize()
		},
		close: () => {
			void windowChrome.close()
		}
	}
}
