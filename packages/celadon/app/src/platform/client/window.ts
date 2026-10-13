/* 无标题栏窗口的窗口动作：桌面由宿主执行，Web 下按钮与拖动都不出现。
   组件只读这里的能力与 props，不判宿主（`architecture/03-boundaries.md` §2 的平台差异规则）。 */
import { useEffect, useState } from 'react'
import { client } from './facts'
import { windowChrome } from '../bridge/window'
import { isOk } from '../bridge/result'

/** 顶部拖动带的高度：窗口最上面这一条里，空白处都可移动窗口。 */
const DRAG_BAND_FALLBACK = 48

/** 带内按下后移动超过这个距离才请求拖动。按下即拖会把双击吃掉，双击要留给最大化。 */
const DRAG_START_DISTANCE = 3

/** 这些元素上的按下不当作拖动，控件照旧可用。 */
const INTERACTIVE = 'button, a, input, select, textarea, [contenteditable], [data-no-drag]'

/* 这个钩子被多个组件各调一次（列头 · 内容列头 · 窗口键 · 外壳），每个实例都挂一份 window 监听，
   同一个事件会依次到达每一份。动作只由第一份执行一次，否则一次双击会切换好几轮最大化。 */
const consumed = new WeakSet<Event>()

function firstToHandle(event: Event): boolean {
	if (consumed.has(event)) return false
	consumed.add(event)
	return true
}

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

/** 顶部拖动带的高度：优先读 token，取不到用兜底值。token 挂在 `.celadon` 作用域上。 */
function dragBandHeight(): number {
	if (typeof window === 'undefined') return DRAG_BAND_FALLBACK
	const scope = document.querySelector('.celadon') ?? document.documentElement
	const value = getComputedStyle(scope).getPropertyValue('--window-drag-band')
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

	/* 拖动由宿主接管，指针停在什么元素上都不再决定光标，统一成箭头，
     避免拖过文字、把手或链接时显示成文本光标或调整光标。 */
	const releaseCursor = () => {
		document.body.style.removeProperty('cursor')
	}

	const drag = () => {
		document.body.style.setProperty('cursor', 'default')
		setDragState('calling')
		windowChrome.startDragging().then(
			() => setDragState('ok'),
			(error: unknown) => setDragState(`failed:${String(error).slice(0, 60)}`)
		)
	}

	const toggle = () => {
		void windowChrome.toggleMaximize().then((result) => {
			if (isOk(result)) setMaximized(result.value)
		})
	}

	/* 顶部那一条带子统一受理两件事：无论导航列、内容区还是标签栏，只要指针落在窗口最上面这一带，
     空白处按下并移动即拖动窗口，空白处双击即在最大化与还原之间切换。macOS 的标题栏是 Overlay，
     被网络视图盖住，系统收不到这一下双击，所以两个平台都由应用切换。
     控件（按钮、链接、输入、标了 data-no-drag 的）两件事都不参与，点击照旧。
     在 window 上受理一次，各栏不必各写一层。 */
	useEffect(() => {
		if (!visible) return
		let pressed: { x: number; y: number } | null = null
		const inBand = (event: MouseEvent) => {
			if (event.button !== 0) return false
			if (event.clientY > dragBandHeight()) return false
			const target = event.target
			if (!(target instanceof Element)) return false
			return !target.closest(INTERACTIVE)
		}
		/* 按下用 mousedown 读点击次数：`detail` 为 2 表示这是双击的第二下，
           那一下留给双击，不启动拖动，否则系统与原生控件都收不到这次双击。 */
		const onMouseDown = (event: MouseEvent) => {
			pressed = event.detail <= 1 && inBand(event) ? { x: event.clientX, y: event.clientY } : null
		}
		const onPointerMove = (event: PointerEvent) => {
			if (!pressed) return
			if ((event.buttons & 1) === 0) {
				pressed = null
				return
			}
			const moved = Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y)
			if (moved < DRAG_START_DISTANCE) return
			pressed = null
			if (firstToHandle(event)) drag()
		}
		const onPointerEnd = () => {
			pressed = null
			releaseCursor()
		}
		const onDoubleClick = (event: MouseEvent) => {
			if (!inBand(event)) return
			if (firstToHandle(event)) toggle()
		}
		window.addEventListener('mousedown', onMouseDown, true)
		window.addEventListener('pointermove', onPointerMove, true)
		window.addEventListener('pointerup', onPointerEnd, true)
		window.addEventListener('pointercancel', onPointerEnd, true)
		window.addEventListener('blur', onPointerEnd)
		window.addEventListener('dblclick', onDoubleClick, true)
		return () => {
			window.removeEventListener('mousedown', onMouseDown, true)
			window.removeEventListener('pointermove', onPointerMove, true)
			window.removeEventListener('pointerup', onPointerEnd, true)
			window.removeEventListener('pointercancel', onPointerEnd, true)
			window.removeEventListener('blur', onPointerEnd)
			window.removeEventListener('dblclick', onDoubleClick, true)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [visible])

	return {
		visible,
		controls,
		maximized,
		toggleMaximize: toggle,
		dragState,
		minimize: () => {
			void windowChrome.minimize()
		},
		close: () => {
			void windowChrome.close()
		}
	}
}
