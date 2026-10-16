import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type RefObject } from 'react'
import type { BrowserTab } from '../types'

/** 位移不到 4 像素算点击，超过算拖动，两者互不误触 */
const THRESHOLD = 4

type DragState = { key: string; index: number }

type RestRect = { element: HTMLElement; left: number; right: number }

export type TabDragResult = {
	/** 是否正在拖动：标签行据此关掉行内过渡、锁住文本选择 */
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
   拖动期间被拖的那一块跟手，其余可见标签**按落点让位**，提前把换位后的次序摆出来，
   落点另有一条插入指示线；位移一律用 transform 表达，不改布局、不重建节点。

   两个量都基于起手时量下的一遍静止位置：让位已经把元素挪开，若再按挪开后的位置算下标，
   指针不动下标也会变，来回抖。挪动只写元素样式，下标变化才走状态，避免每帧重渲染。
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
		rests: RestRect[]
		step: number
		draggedIndex: number
	} | null>(null)
	const stateRef = useRef<DragState | null>(null)
	stateRef.current = state
	const suppress = useRef(false)

	const visibleItems = () =>
		Array.from(rowRef.current?.querySelectorAll<HTMLElement>('.browser__tab:not([data-hidden])') ?? []).filter(
			(element) => element.dataset.tabKey
		)

	/** 让位：把被让开的那一段各挪一档，露出被拖那一块要去的位置 */
	const shift = (index: number) => {
		const current = gesture.current
		if (!current) return
		const { rests, step, draggedIndex } = current
		rests.forEach((rest, position) => {
			let offset = 0
			if (draggedIndex < index && position >= draggedIndex && position < index) offset = -step
			if (draggedIndex > index && position >= index && position < draggedIndex) offset = step
			rest.element.style.transform = offset === 0 ? '' : `translateX(${offset}px)`
		})
	}

	const stop = (commit: boolean) => {
		const current = gesture.current
		if (current) {
			current.block.style.transform = ''
			current.block.style.zIndex = ''
			for (const rest of current.rests) rest.element.style.transform = ''
			try {
				current.block.releasePointerCapture(current.pointerId)
			} catch {
				/* 指针已经不在这块上时释放会抛，忽略 */
			}
			document.body.style.userSelect = ''
		}
		gesture.current = null
		const settled = stateRef.current
		setState(null)
		if (commit && settled) onReorder?.(settled.key, settled.index)
	}

	useEffect(() => {
		if (!state) return
		const onKeyDown = (event: KeyboardEvent) => {
			/* 取消：不提交，回到原位 */
			if (event.key === 'Escape') stop(false)
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

		const items = visibleItems()
		const draggedIndex = items.indexOf(block)
		if (draggedIndex < 0) return
		const rests: RestRect[] = items
			.filter((element) => element !== block)
			.map((element) => {
				const box = element.getBoundingClientRect()
				return { element, left: box.left, right: box.right }
			})
		const box = block.getBoundingClientRect()
		const gap = Math.max(box.left - (rests[0]?.right ?? box.left), 0)
		gesture.current = {
			key: block.dataset.tabKey,
			startX: event.clientX,
			pointerId: event.pointerId,
			block,
			moved: false,
			rests,
			step: Math.round(box.width + gap),
			draggedIndex
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
			current.block.style.zIndex = '2'
			document.body.style.userSelect = 'none'
			try {
				current.block.setPointerCapture(event.pointerId)
			} catch {
				/* 指针捕获不可用时退化为普通事件流，拖动仍可用 */
			}
		}
		current.block.style.transform = `translateX(${offset}px)`

		/* 下标只按起手时的静止位置算，让位挪动不影响它 */
		let index = 0
		for (const rest of current.rests) {
			if (event.clientX > (rest.left + rest.right) / 2) index += 1
		}
		if (stateRef.current?.index !== index) {
			shift(index)
			setState({ key: current.key, index })
		}
	}

	const onPointerUp = () => stop(true)
	const onPointerCancel = () => stop(false)

	const onClickCapture = (event: MouseEvent<HTMLElement>) => {
		if (!suppress.current) return
		suppress.current = false
		event.preventDefault()
		event.stopPropagation()
	}

	/** 指示线的位置：第 index 个静止位置的左侧，或末尾那一项的右侧 */
	const indicatorFor = (index: number) => {
		const current = gesture.current
		const row = rowRef.current
		if (!current || !row) return 0
		const rowLeft = row.getBoundingClientRect().left
		if (current.rests.length === 0) return 0
		if (index <= 0) return current.rests[0].left - rowLeft - 2
		if (index >= current.rests.length)
			return current.rests[current.rests.length - 1].right - rowLeft + 2
		return (current.rests[index - 1].right + current.rests[index].left) / 2 - rowLeft
	}

	return {
		dragging: state !== null,
		indicator: state ? indicatorFor(state.index) : null,
		onPointerDown,
		onPointerMove,
		onPointerUp,
		onPointerCancel,
		onClickCapture
	}
}
