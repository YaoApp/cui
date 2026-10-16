import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type RefObject } from 'react'
import type { BrowserTab } from '../types'

/** 位移不到 4 像素算点击，超过算拖动，两者互不误触 */
const THRESHOLD = 4

type DragState = { key: string; index: number }

export type TabDragResult = {
	/** 是否正在拖动：标签行据此关掉行内过渡 */
	dragging: boolean
	/** 插入指示线的位置，相对标签行左缘；没有拖动时为 null */
	indicator: number | null
	onPointerDown: (event: PointerEvent<HTMLElement>) => void
	onPointerMove: (event: PointerEvent<HTMLElement>) => void
	onPointerUp: (event: PointerEvent<HTMLElement>) => void
	onPointerCancel: () => void
	onClickCapture: (event: MouseEvent<HTMLElement>) => void
}

/* 标签拖动换序：按下起手、超过阈值才进入拖动、按指针位置算插入下标、松手提交。
   被拖的那一块用 transform 跟手（只在拖动期间写），其余标签不动，落点由指示线表达。
   拖动结束后吞掉紧随的那一次 click，否则松手会顺带激活被拖的那一页。 */
export function useTabDrag(options: {
	rowRef: RefObject<HTMLDivElement | null>
	tabs: BrowserTab[]
	onReorder?: (key: string, index: number) => void
}): TabDragResult {
	const { rowRef, onReorder } = options
	const [state, setState] = useState<DragState | null>(null)
	const gesture = useRef<{
		key: string
		startX: number
		pointerId: number
		block: HTMLElement
		moved: boolean
	} | null>(null)
	const suppress = useRef(false)

	const visibleItems = (exceptKey?: string) =>
		Array.from(rowRef.current?.querySelectorAll<HTMLElement>('.browser__tab:not([data-hidden])') ?? [])
			.filter((element) => element.dataset.tabKey && element.dataset.tabKey !== exceptKey)

	/** 指针落在第几个可见标签的中点之后，就把插入下标算到那里 */
	const indexFor = (clientX: number, exceptKey: string) => {
		let index = 0
		for (const element of visibleItems(exceptKey)) {
			const box = element.getBoundingClientRect()
			if (clientX > box.x + box.width / 2) index += 1
		}
		return index
	}

	const indicatorFor = (index: number, exceptKey: string) => {
		const row = rowRef.current
		if (!row) return 0
		const items = visibleItems(exceptKey)
		if (items.length === 0) return 0
		const rowLeft = row.getBoundingClientRect().left
		if (index <= 0) return items[0].getBoundingClientRect().left - rowLeft - 2
		if (index >= items.length) return items[items.length - 1].getBoundingClientRect().right - rowLeft + 2
		return (
			(items[index - 1].getBoundingClientRect().right + items[index].getBoundingClientRect().left) / 2 -
			rowLeft
		)
	}

	const stateRef = useRef<DragState | null>(null)
	stateRef.current = state

	const stop = (commit: boolean) => {
		const current = gesture.current
		if (current) {
			current.block.style.transform = ''
			try {
				current.block.releasePointerCapture(current.pointerId)
			} catch {
				/* 指针已经不在这块上时释放会抛，忽略 */
			}
		}
		gesture.current = null
		const settled = stateRef.current
		setState(null)
		if (commit && settled) onReorder?.(settled.key, settled.index)
	}

	useEffect(() => {
		if (!state) return
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				/* 取消：不提交，回到原位 */
				stop(false)
			}
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [state])

	const onPointerDown = (event: PointerEvent<HTMLElement>) => {
		if (event.button !== 0) return
		const target = event.target as HTMLElement
		/* 落在关闭键上的按下不进入拖动 */
		if (target.closest('.browser__tab-close')) return
		const block = target.closest<HTMLElement>('.browser__tab')
		if (!block?.dataset.tabKey) return
		gesture.current = {
			key: block.dataset.tabKey,
			startX: event.clientX,
			pointerId: event.pointerId,
			block,
			moved: false
		}
		/* 捕获推迟到越过阈值之后再做：按下就捕获会把随后的 click 重定向到整块上，
		   子元素上的激活处理就收不到了（点标签因此失效） */
	}

	const onPointerMove = (event: PointerEvent<HTMLElement>) => {
		const current = gesture.current
		if (!current) return
		const offset = event.clientX - current.startX
		if (!current.moved) {
			if (Math.abs(offset) < THRESHOLD) return
			current.moved = true
			suppress.current = true
			try {
				current.block.setPointerCapture(current.pointerId)
			} catch {
				/* 指针捕获不可用时退化为普通事件流，拖动仍可用 */
			}
		}
		/* 跟手只写元素样式；插入下标变化才走状态，避免每帧重渲染 */
		current.block.style.transform = `translateX(${offset}px)`
		const index = indexFor(event.clientX, current.key)
		setState((previous) => (previous && previous.index === index ? previous : { key: current.key, index }))
	}

	const onPointerUp = () => stop(true)
	const onPointerCancel = () => stop(false)

	const onClickCapture = (event: MouseEvent<HTMLElement>) => {
		if (!suppress.current) return
		suppress.current = false
		event.preventDefault()
		event.stopPropagation()
	}

	return {
		dragging: state !== null,
		indicator: state ? indicatorFor(state.index, state.key) : null,
		onPointerDown,
		onPointerMove,
		onPointerUp,
		onPointerCancel,
		onClickCapture
	}
}
