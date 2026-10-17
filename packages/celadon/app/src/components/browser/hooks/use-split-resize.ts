import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'

/** 两个面板之间那根抓手：跟手拖动算比例，双击回平分，方向键微调。口径与导航列右缘一致。 */
const MIN_RATIO = 0.2
const MAX_RATIO = 0.8
/** 键盘每次调整的比例。 */
const STEP = 0.02
/** 悬停高亮的延迟，与导航列右缘同一口径：指针进入后先给光标，停住这么久才亮出可拖的提示。 */
const HOVER_DELAY_MS = 300

export type SplitOrientation = 'columns' | 'rows'

const clamp = (value: number) => Math.min(MAX_RATIO, Math.max(MIN_RATIO, value))

export function useSplitResize(
  orientation: SplitOrientation,
  ratio: number,
  onChange: (ratio: number) => void,
  /** 指针往正方向拖动时比例是变小还是变大：左右分栏新栏在左、比例记主栏，所以取反 */
  reverse = false
) {
  const nodeRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [hovered, setHovered] = useState(false)
  const start = useRef({ x: 0, y: 0, ratio })
  const ratioRef = useRef(ratio)
  ratioRef.current = ratio
  const reverseRef = useRef(reverse)
  reverseRef.current = reverse

  /* 抓手本身只有几像素宽，比例要按**容器**算：按抓手算的话，拖一点点就被夹到上下限，看起来就是跳 */
  const containerBox = () => nodeRef.current?.parentElement?.getBoundingClientRect() ?? null

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      const node = nodeRef.current
      const box = containerBox()
      if (!node || !box) return
      if (box.width === 0 || box.height === 0) return
      event.preventDefault()
      /* 按下即接管光标：拖出抓手、拖到面板上，光标仍是拖动光标 */
      document.body.style.setProperty('cursor', orientation === 'rows' ? 'row-resize' : 'col-resize')
      node.setPointerCapture?.(event.pointerId)
      start.current = { x: event.clientX, y: event.clientY, ratio: ratioRef.current }
      setDragging(true)
    },
    [orientation]
  )

  /* 拖动：移动与抬起都挂在窗口上，指针移出抓手、移出窗口也不丢 */
  useEffect(() => {
    if (!dragging) return
    const move = (event: PointerEvent) => {
      const box = containerBox()
      if (!box) return
      const span = orientation === 'rows' ? box.height : box.width
      if (span === 0) return
      const moved =
        orientation === 'rows' ? event.clientY - start.current.y : event.clientX - start.current.x
      /* 左右分栏新栏在左：指针往右，主栏那一份变小，所以位移取反。
         这里只反转换算，不改存进去的值，下一次拖动读到的起点才是同一个口径，不会越拖越跳 */
      onChange(clamp(start.current.ratio + (reverseRef.current ? -moved : moved) / span))
    }
    const end = (event: PointerEvent) => {
      setDragging(false)
      document.body.style.removeProperty('cursor')
      nodeRef.current?.releasePointerCapture?.(event.pointerId)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [dragging, orientation, onChange])

  /* 卸载时把接管过的正文光标交还，并清掉还没到点的悬停定时器 */
  useEffect(
    () => () => {
      if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current)
      document.body.style.removeProperty('cursor')
      document.body.style.removeProperty('user-select')
    },
    []
  )

  /* 拖动期间锁住正文选择：指针扫过两个面板里的内容时不该带出选中，卸载时交还 */
  useEffect(() => {
    const previous = document.body.style.userSelect
    document.body.style.userSelect = dragging ? 'none' : previous
    return () => {
      document.body.style.userSelect = previous
    }
  }, [dragging])

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const move = (delta: number) => {
        event.preventDefault()
        onChange(clamp(ratioRef.current + (reverseRef.current ? -delta : delta)))
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') move(-STEP)
      else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') move(STEP)
      else if (event.key === 'Home') move(MIN_RATIO - ratioRef.current)
      else if (event.key === 'End') move(MAX_RATIO - ratioRef.current)
      else if (event.key === 'Enter') {
        event.preventDefault()
        onChange(0.5)
      }
    },
    [onChange]
  )

  const hoverTimer = useRef<number | null>(null)
  const onPointerEnter = useCallback(() => {
    if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current)
    hoverTimer.current = window.setTimeout(() => setHovered(true), HOVER_DELAY_MS)
  }, [])
  const onPointerLeave = useCallback(() => {
    if (hoverTimer.current !== null) {
      window.clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
    setHovered(false)
  }, [])
  const reset = useCallback(() => onChange(0.5), [onChange])

  return {
    ref: (node: HTMLDivElement | null) => {
      nodeRef.current = node
    },
    dragging,
    highlighted: dragging || hovered,
    onPointerEnter,
    onPointerLeave,
    onPointerDown,
    onKeyDown,
    onDoubleClick: reset,
  }
}
