import {
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type MouseEvent,
	type PointerEvent,
	type RefObject
} from 'react'
import type { BrowserTab } from '../types'

/** 位移不到 4 像素算点击，超过算拖动，两者互不误触 */
const THRESHOLD = 4

/** 起手到松手之间挡住选区：WebKit 在指针按下那一刻就会起一段选区 */
const blockSelect = (event: Event) => event.preventDefault()

type DragState = { key: string; index: number }

/** 起手时量下的一个可见标签：元素、静止时的左缘与宽度 */
type Slot = { element: HTMLElement; left: number; width: number }

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
   拖动期间被拖的那一块跟手，其余可见标签**按宽度重新排一遍**，提前把换位后的次序摆出来
   （宽度不同的标签换位后若只按槽位平移会留下空隙，所以按每块自己的宽度累加目标左缘），
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
		slots: Slot[]
		draggedIndex: number
		gap: number
		targetLeft: number
	} | null>(null)
	const stateRef = useRef<DragState | null>(null)
	stateRef.current = state
	const suppress = useRef(false)
	/* 挂在 window 上的收尾处理器存一份，收尾与卸载都按同一引用摘掉 */
	/* 收尾处理器都按同一引用挂上：Escape 在越过阈值之前就要能取消，
	   所以不能等 `state` 有了才挂键盘监听 */
	const windowUp = useRef<{
		up: () => void
		cancel: () => void
		key: (event: KeyboardEvent) => void
	} | null>(null)

	const visibleItems = () =>
		Array.from(rowRef.current?.querySelectorAll<HTMLElement>('.browser__tab:not([data-hidden])') ?? []).filter(
			(element) => element.dataset.tabKey
		)

	/** 指针落在第几个可见标签的中点之后，就把插入下标算到那里（被拖的那一块不算） */
	const indexFor = (clientX: number) => {
		const current = gesture.current
		if (!current) return 0
		let index = 0
		current.slots.forEach((slot, position) => {
			if (position === current.draggedIndex) return
			if (clientX > slot.left + slot.width / 2) index += 1
		})
		return index
	}

	/** 让位：按目标次序把其余标签按各自宽度重新排一遍，露出被拖那块要落的位置 */
	const pack = (index: number) => {
		const current = gesture.current
		if (!current) return
		const { slots, draggedIndex, gap } = current
		const dragged = slots[draggedIndex]
		const rests = slots.filter((_, position) => position !== draggedIndex)
		const order = [...rests.slice(0, index), dragged, ...rests.slice(index)]
		let cursor = slots[0].left
		for (const slot of order) {
			if (slot.element === current.block) {
				current.targetLeft = cursor - slots[0].left
			} else {
				slot.element.style.transform = `translateX(${Math.round(cursor - slot.left)}px)`
			}
			cursor += slot.width + gap
		}
	}

	/** 可见段里的落点下标换算成整个数组里的落点下标。
	    拖动只在可见段里算，`move` 却按整个数组算，可见段不是数组前缀时（当前页被换到条上就是这种）
	    两者之间差着隐藏项，不换算就会落到错的位置。锚点取可见段里第 index 项之前的那一项，
	    并在「去掉被拖项之后」的数组里定位，与 `move` 先删后插的口径一致。

	    落到可见段最前面那一档时不能再往隐藏项后面跑：被拖项本来就在可见段首位时（例如条上是
	    「首页 + 当前页」而拖的是首页），它已经在锚点之前，这一档等于原地不动，取两处里靠前的那一个。 */
	const toArrayIndex = (index: number) => {
		const current = gesture.current
		if (!current) return index
		const rests = current.slots
			.filter((_, position) => position !== current.draggedIndex)
			.map((slot) => slot.element.dataset.tabKey ?? '')
		const keys = options.tabs.filter((tab) => tab.key !== current.key).map((tab) => tab.key)
		if (index <= 0) {
			const at = rests.length > 0 ? keys.indexOf(rests[0]) : -1
			const before = at < 0 ? 0 : at
			const from = options.tabs.findIndex((tab) => tab.key === current.key)
			return Math.min(before, from < 0 ? before : from)
		}
		const at = keys.indexOf(rests[index - 1])
		return at < 0 ? keys.length : at + 1
	}

	/* 收尾时把挂在 window 上的处理器按同一引用摘掉：松手只等到 pointerup，
	   pointercancel 那一个会一直留着，下一次指针取消时误触发旧的收尾 */
	const clearWindowHandlers = () => {
		const handlers = windowUp.current
		if (!handlers) return
		window.removeEventListener('pointerup', handlers.up)
		window.removeEventListener('pointercancel', handlers.cancel)
		window.removeEventListener('keydown', handlers.key)
		windowUp.current = null
	}

	/** 清掉拖动期间写在标签上的位移与层级 */
	const clearOffsets = () => {
		const row = rowRef.current
		if (!row) return
		for (const element of row.querySelectorAll<HTMLElement>('.browser__tab')) {
			element.style.transform = ''
			element.style.zIndex = ''
		}
	}

	/* 提交换序时不能立刻清位移：那样会先按旧次序画一帧（各块回到原位），
	   等新次序渲染出来再各就各位，看上去所有标签一起闪一下。
	   留到新次序已经进 DOM、下一次布局提交之前再清，清完才绘制，中间没有可见的一帧。
	   拖动进行中不清：装配层每次渲染都会换掉 `tabs` 的引用，别把跟手与让位位移清掉。 */
	useLayoutEffect(() => {
		if (gesture.current) return
		clearOffsets()
	}, [options.tabs])

	const stop = (commit: boolean) => {
		const current = gesture.current
		if (!current) return
		/* 落点要在清掉 gesture 之前换算 */
		const to = toArrayIndex(stateRef.current?.index ?? 0)
		const settled = stateRef.current
		const from = options.tabs.findIndex((tab) => tab.key === current.key)
		/* 只有确实会写回新次序时才把位移留给上面那个布局时机。落点等于原位、没有换序回调、
		   或还没越过阈值时，那次布局提交不会来，位移与层级会一直留在元素上，立刻清掉。 */
		const willReorder = commit && settled !== null && Boolean(onReorder) && to !== from
		if (!willReorder) clearOffsets()
		try {
			current.block.releasePointerCapture(current.pointerId)
		} catch {
			/* 指针已经不在这块上时释放会抛，忽略 */
		}
		document.body.style.userSelect = ''
		window.removeEventListener('selectstart', blockSelect)
		clearWindowHandlers()
		gesture.current = null
		setState(null)
		if (willReorder && settled) onReorder?.(settled.key, to)
	}

	/* 卸载时把挂在 body 与 window 上的副作用交还，避免中途离开留下锁与监听 */
	useEffect(
		() => () => {
			document.body.style.userSelect = ''
			window.removeEventListener('selectstart', blockSelect)
			clearWindowHandlers()
		},
		[]
	)

	const onPointerDown = (event: PointerEvent<HTMLElement>) => {
		if (event.button !== 0) return
		/* 上一次拖动若没等到那次 click（例如指针移出后松手），别让它吞掉这一次点击 */
		suppress.current = false
		const target = event.target as HTMLElement
		/* 落在关闭键上的按下不进入拖动 */
		if (target.closest('.browser__tab-close')) return
		const block = target.closest<HTMLElement>('.browser__tab')
		if (!block?.dataset.tabKey) return

		const items = visibleItems()
		const draggedIndex = items.indexOf(block)
		if (draggedIndex < 0) return
		const slots: Slot[] = items.map((element) => {
			const box = element.getBoundingClientRect()
			return { element, left: box.left, width: box.width }
		})
		const gap = slots.length > 1 ? Math.max(slots[1].left - (slots[0].left + slots[0].width), 0) : 0
		gesture.current = {
			key: block.dataset.tabKey,
			startX: event.clientX,
			pointerId: event.pointerId,
			block,
			moved: false,
			slots,
			draggedIndex,
			gap,
			targetLeft: slots[draggedIndex].left - slots[0].left
		}
		/* 一按下就锁住文本选择并清掉已有选区：等越过阈值再锁，浏览器已经先选中了一段文字，
		   之后再设 user-select 也清不掉那一段高亮（真机上看得很清楚）。selectstart 也一并挡住，
		   WebKit 在指针按下那一刻就起选区，只设 user-select 有时来不及 */
		document.body.style.userSelect = 'none'
		window.getSelection()?.removeAllRanges()
		window.addEventListener('selectstart', blockSelect)
		windowUp.current = {
			up: () => stop(true),
			cancel: () => stop(false),
			key: (event: KeyboardEvent) => {
				/* 取消：不提交，回到原位。设置在按下时挂上，越阈值之前按 Escape 也管用 */
				if (event.key === 'Escape') stop(false)
			}
		}
		window.addEventListener('pointerup', windowUp.current.up, { once: true })
		window.addEventListener('pointercancel', windowUp.current.cancel, { once: true })
		window.addEventListener('keydown', windowUp.current.key)
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
			try {
				current.block.setPointerCapture(event.pointerId)
			} catch {
				/* 指针捕获不可用时退化为普通事件流，拖动仍可用 */
			}
		}
		current.block.style.transform = `translateX(${offset}px)`
		/* WebKit 会一路把选区续下去，user-select 与 selectstart 都拦不住，每帧清一次 */
		window.getSelection()?.removeAllRanges()

		const index = indexFor(event.clientX)
		if (stateRef.current?.index !== index) {
			pack(index)
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

	return {
		dragging: state !== null,
		indicator: state ? gesture.current?.targetLeft ?? null : null,
		onPointerDown,
		onPointerMove,
		onPointerUp,
		onPointerCancel,
		onClickCapture
	}
}
