import { useCallback, useEffect, useRef, useState } from 'react'

/** 从导航列自身读一个长度 token，取不到或解析不出时用回退值。 */
function tokenPx(name: string, fallback: number, node?: HTMLElement | null): number {
  if (typeof window === 'undefined') return fallback
  const target = node ?? document.documentElement
  const raw = getComputedStyle(target).getPropertyValue(name).trim()
  const value = Number.parseFloat(raw)
  return Number.isFinite(value) ? value : fallback
}

/* 内容区与第三栏的最小宽度，用于算导航列在当次窗口下的上限（见 design/foundations.md 三栏地基）。 */
const CONTENT_MIN = 400
const BROWSER_MIN = 300

/** 键盘每次调整的步长。 */
const STEP = 8

/** 拖动阈值：位移不到这个数就按点击处理（业内通用的 4 像素）。 */
const DRAG_THRESHOLD = 4

/** 悬停高亮的延迟：指针进入后先给光标，停住这么久才亮出可拖的提示。 */
const HOVER_DELAY_MS = 300

export type NavResize = {
  /** 挂在 `<nav>` 上：拖动与存值都写它上面的 `--nav-width` */
  ref: (node: HTMLElement | null) => void
  dragging: boolean
  /** 指针停在把手上够久（或正在拖动）：此时才亮出可拖的提示 */
  highlighted: boolean
  min: number
  max: number
  current: number
  onPointerEnter: () => void
  onPointerLeave: () => void
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void
  onDoubleClick: () => void
}

/* 导航列右缘的拖拽，按 VS Code 的 sash 那套做：
   光标即时表达（命中区一进入就是拖动光标）；高亮延迟 `HOVER_DELAY_MS` 才显形；
   拖动中只改元素上的 `--nav-width`，且每帧最多应用一次；松手才把结果写入偏好。
   上下限每次按下、每次按键都重算，窗口尺寸变化时也重算并夹住存值。 */
export function useNavResize(
  width: number | null,
  onCommit: (width: number | null) => void,
): NavResize {
  const nodeRef = useRef<HTMLElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [limits, setLimits] = useState(() => measure(null))
  const start = useRef({ x: 0, width: 0 })
  const hoverTimer = useRef<number | null>(null)
  const frame = useRef<number | null>(null)
  const pending = useRef<number | null>(null)

  /* 上下限：下限取 `--nav-min`，上限取 `--nav-max` 与「窗口宽减内容区最小减第三栏最小」的较小者 */
  function measure(node: HTMLElement | null) {
    const min = tokenPx('--nav-min', 264, node)
    const max = Math.max(
      min,
      Math.min(tokenPx('--nav-max', 420, node), window.innerWidth - CONTENT_MIN - BROWSER_MIN),
    )
    return { min, max }
  }

  const clamp = (value: number, bounds: { min: number; max: number }) =>
    Math.min(Math.max(value, bounds.min), bounds.max)

  const defaultWidth = (node: HTMLElement | null) => tokenPx('--nav-default', 280, node)

  const paint = useCallback((value: number | null, node: HTMLElement | null) => {
    if (!node) return
    if (value === null) node.style.removeProperty('--nav-width')
    else node.style.setProperty('--nav-width', `${value}px`)
  }, [])

  /* 拖动中的落位每帧最多应用一次：指针事件再密，画面也只按帧推进 */
  const paintNextFrame = useCallback(
    (value: number, node: HTMLElement) => {
      pending.current = value
      if (frame.current !== null) return
      frame.current = window.requestAnimationFrame(() => {
        frame.current = null
        if (pending.current !== null) paint(pending.current, node)
      })
    },
    [paint],
  )

  const clearHoverTimer = useCallback(() => {
    if (hoverTimer.current !== null) {
      window.clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
  }, [])

  /* 存值与窗口变化：重算上下限，并按当次上下限夹一次后重画。
     进页面这一次落位不带动画：先挂 `nav--instant`，下一帧摘掉。 */
  useEffect(() => {
    const node = nodeRef.current
    const bounds = measure(node)
    setLimits(bounds)
    if (!node) return
    node.classList.add('nav--instant')
    paint(width === null ? null : clamp(width, bounds), node)
    const raf = window.requestAnimationFrame(() => node.classList.remove('nav--instant'))
    return () => window.cancelAnimationFrame(raf)
  }, [width, paint])

  useEffect(() => {
    const onResize = () => {
      const node = nodeRef.current
      const bounds = measure(node)
      setLimits(bounds)
      paint(width === null ? null : clamp(width, bounds), node)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [width, paint])

  /* 拖动：移动与抬起都挂在窗口上，指针移出列外也不丢 */
  useDragListeners(
    dragging,
    (event) => {
      const node = nodeRef.current
      if (!node) return
      const bounds = measure(node)
      paintNextFrame(clamp(start.current.width + (event.clientX - start.current.x), bounds), node)
    },
    (event) => {
      const node = nodeRef.current
      if (!node) return
      const bounds = measure(node)
      setDragging(false)
      document.body.style.removeProperty('cursor')
      if (node.hasPointerCapture?.(event.pointerId)) node.releasePointerCapture(event.pointerId)
      /* 位移不到阈值按点击处理：不写偏好，双击复位与误触都不会被按下那一下抢走 */
      const moved = Math.abs(event.clientX - start.current.x)
      if (moved < DRAG_THRESHOLD) return
      const next = clamp(start.current.width + (event.clientX - start.current.x), bounds)
      paint(next, node)
      onCommit(Math.round(next))
    },
  )

  /* 高亮只落在列的分割线上：把类挂在列上，样式里换边界色 */
  useEffect(() => {
    nodeRef.current?.classList.toggle('nav--resize-hover', hovered)
  }, [hovered])

  /* 卸载时清掉挂起的计时器与帧，并把接管过的正文光标交还：
     拖动中列被卸载、或指针在窗口外释放导致抬起事件到不了时，光标不会卡在拖动光标上 */
  useEffect(
    () => () => {
      clearHoverTimer()
      if (frame.current !== null) window.cancelAnimationFrame(frame.current)
      document.body.style.removeProperty('cursor')
    },
    [clearHoverTimer],
  )

  return {
    ref: (node) => {
      nodeRef.current = node
    },
    dragging,
    highlighted: dragging || hovered,
    min: limits.min,
    max: limits.max,
    current: width ?? defaultWidth(nodeRef.current),
    onPointerEnter: () => {
      clearHoverTimer()
      hoverTimer.current = window.setTimeout(() => setHovered(true), HOVER_DELAY_MS)
    },
    onPointerLeave: () => {
      clearHoverTimer()
      setHovered(false)
    },
    onPointerDown: (event) => {
      const node = nodeRef.current
      if (!node) return
      event.preventDefault()
      clearHoverTimer()
      /* 按下即接管光标：拖出列外、拖到别的元素上，光标仍是拖动光标 */
      document.body.style.setProperty('cursor', 'col-resize')
      const bounds = measure(node)
      setLimits(bounds)
      node.setPointerCapture?.(event.pointerId)
      start.current = { x: event.clientX, width: clamp(width ?? defaultWidth(node), bounds) }
      setDragging(true)
    },
    onKeyDown: (event) => {
      const node = nodeRef.current
      const bounds = measure(node)
      setLimits(bounds)
      const current = clamp(width ?? defaultWidth(node), bounds)
      const move = (delta: number) => {
        event.preventDefault()
        onCommit(Math.round(clamp(current + delta, bounds)))
      }
      if (event.key === 'ArrowLeft') move(-STEP)
      else if (event.key === 'ArrowRight') move(STEP)
      else if (event.key === 'Home') move(bounds.min - current)
      else if (event.key === 'End') move(bounds.max - current)
    },
    onDoubleClick: () => onCommit(null),
  }
}

/* 拖动期间把移动与抬起挂到窗口上：即便元素上的指针捕获不可用（无头环境没有实现），
   指针移出列外、移出窗口也仍然跟手。回调用 ref 收着，避免每次渲染重挂监听。 */
export function useDragListeners(
  active: boolean,
  onMove: (event: PointerEvent) => void,
  onEnd: (event: PointerEvent) => void,
) {
  const moveRef = useRef(onMove)
  const endRef = useRef(onEnd)
  moveRef.current = onMove
  endRef.current = onEnd

  useEffect(() => {
    if (!active) return
    const move = (event: PointerEvent) => moveRef.current(event)
    const end = (event: PointerEvent) => endRef.current(event)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [active])
}
