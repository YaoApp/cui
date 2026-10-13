import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

/** 内容区与标签浏览器之间那条分界线：拖动改标签浏览器的宽，双击回到默认宽。
    口径与导航列右缘一致（按下接管光标 · 指针捕获 · 窗口挂监听 · 每帧最多画一次）。 */

/** 拖动阈值：位移不到这个数按点击处理。 */
const DRAG_THRESHOLD = 3

/** 两次抬起之间的间隔小于这个数、且都没有位移，按双击算（复位回默认宽）。 */
const DOUBLE_CLICK_MS = 400
/** 悬停高亮的延迟，与导航列右缘同一口径：指针进入后先给光标，停住这么久才亮出可拖的提示。 */
const HOVER_DELAY_MS = 300

/** 从节点上读一个长度 token，取不到时用回退值。 */
function tokenPx(name: string, fallback: number, node: HTMLElement | null): number {
  if (typeof window === 'undefined' || !node) return fallback
  const raw = getComputedStyle(node).getPropertyValue(name).trim()
  const value = Number.parseFloat(raw)
  return Number.isFinite(value) ? value : fallback
}

export type ColumnResize = {
  ref: (node: HTMLElement | null) => void
  dragging: boolean
  highlighted: boolean
  min: number
  max: number
  onPointerEnter: () => void
  onPointerLeave: () => void
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
  onDoubleClick: () => void
}

export function useColumnResize(
  width: number | null,
  onCommit: (width: number | null) => void,
  /* 本栏在右时，分界线在本栏左缘：指针左移是变宽，位移取反 */
  side: 'right' | 'left' = 'right'
): ColumnResize {
  const sign = side === 'right' ? -1 : 1
  const nodeRef = useRef<HTMLElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [limits, setLimits] = useState({ min: 300, max: 600 })
  const start = useRef({ x: 0, width: 0 })
  const lastUp = useRef(0)
  /* 上一次抬起是不是「点一下」（几乎没有位移）：拖动结束不能算作双击的第一下 */
  const lastWasTap = useRef(false)
  const hoverTimer = useRef<number | null>(null)
  const frame = useRef<number | null>(null)
  const pending = useRef<number | null>(null)

  /* 上下限：下限取 `--side-min`，上限取「窗口宽 − 导航列实宽 − 内容区最小 − 把手」（design/foundations.md F6） */
  const measure = useCallback(() => {
    const node = nodeRef.current
    const min = tokenPx('--side-min', 300, node)
    const nav = document.querySelector('.nav')
    const navWidth = nav ? nav.getBoundingClientRect().width : tokenPx('--nav-min', 264, node)
    const centerMin = tokenPx('--center-min', 400, node)
    const handle = tokenPx('--side-resize-handle', 6, node)
    const max = Math.max(min, window.innerWidth - navWidth - centerMin - handle)
    return { min, max }
  }, [])

  const clamp = (value: number, bounds: { min: number; max: number }) =>
    Math.min(Math.max(value, bounds.min), bounds.max)

  const defaultWidth = (node: HTMLElement | null) => tokenPx('--side-width-reading', 400, node)

  /* 宽度写成自定义属性，不写内联 `inline-size`：内联样式会压过样式表里的收起态，
     导致「拖过分界线之后再也收不起来」。与导航列右缘同一口径（那边写的也是 `--nav-width`）。 */
  const paint = useCallback((node: HTMLElement | null, value: number | null) => {
    if (!node) return
    if (value === null) node.style.removeProperty('--side-width')
    else node.style.setProperty('--side-width', `${value}px`)
  }, [])

  const limits$ = useRef(limits)
  limits$.current = limits

  useEffect(() => {
    const node = nodeRef.current
    const bounds = measure()
    setLimits(bounds)
    paint(node, width === null ? null : clamp(width, bounds))
  }, [width, measure, paint])

  useEffect(() => {
    const onResize = () => {
      const bounds = measure()
      setLimits(bounds)
      paint(nodeRef.current, width === null ? null : clamp(width, bounds))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [width, measure, paint])

  useEffect(() => {
    if (!dragging) return
    const move = (event: PointerEvent) => {
      const node = nodeRef.current
      if (!node) return
      pending.current = clamp(start.current.width + sign * (event.clientX - start.current.x), limits$.current)
      if (frame.current !== null) return
      frame.current = window.requestAnimationFrame(() => {
        frame.current = null
        if (pending.current !== null) paint(node, pending.current)
      })
    }
    const end = (event: PointerEvent) => {
      const node = nodeRef.current
      setDragging(false)
      /* 丢掉还没画的那一帧：否则它会把松手后的结果盖回去（双击复位就落不下来） */
      pending.current = null
      if (frame.current !== null) {
        window.cancelAnimationFrame(frame.current)
        frame.current = null
      }
      document.body.style.removeProperty('cursor')
      if (node?.hasPointerCapture?.(event.pointerId)) node.releasePointerCapture(event.pointerId)
      const moved = Math.abs(event.clientX - start.current.x)
      const isTap = moved < DRAG_THRESHOLD
      /* 双击复位自己判：抓手持有指针捕获时 `dblclick` 与 `pointerup.detail` 都不可靠，
         按两次抬起的时间间隔算。两次都必须是没有位移的「点一下」：拖完松手后的
         一次单击不能算作双击的第二下，否则会在拖动结束后突然复位。 */
      const now = performance.now()
      if (!node || (isTap && lastWasTap.current && now - lastUp.current < DOUBLE_CLICK_MS)) {
        lastUp.current = 0
        lastWasTap.current = false
        paint(nodeRef.current, null)
        onCommit(null)
        return
      }
      lastUp.current = now
      lastWasTap.current = isTap
      if (isTap) return
      const next = clamp(start.current.width + sign * (event.clientX - start.current.x), measure())
      paint(node, next)
      onCommit(Math.round(next))
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [dragging, measure, paint, onCommit])

  useEffect(
    () => () => {
      if (frame.current !== null) window.cancelAnimationFrame(frame.current)
      if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current)
      document.body.style.removeProperty('cursor')
      document.body.style.removeProperty('user-select')
    },
    []
  )

  /* 拖动期间锁住正文选择：指针扫过内容区与面板里的文字时不该带出选中，卸载时交还 */
  useEffect(() => {
    const previous = document.body.style.userSelect
    document.body.style.userSelect = dragging ? 'none' : previous
    return () => {
      document.body.style.userSelect = previous
    }
  }, [dragging])

  return {
    ref: (node) => {
      nodeRef.current = node
    },
    dragging,
    highlighted: dragging || hovered,
    min: limits.min,
    max: limits.max,
    onPointerEnter: () => {
      if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current)
      hoverTimer.current = window.setTimeout(() => setHovered(true), HOVER_DELAY_MS)
    },
    onPointerLeave: () => {
      if (hoverTimer.current !== null) {
        window.clearTimeout(hoverTimer.current)
        hoverTimer.current = null
      }
      setHovered(false)
    },
    onPointerDown: (event) => {
      const node = nodeRef.current
      if (!node || event.button !== 0) return
      /* 与导航列右缘一致：按下即 preventDefault，指针从这一下开始就不再拉文字选择；
         双击复位走抬起层的间隔判定，不依赖 dblclick，所以拦掉它不影响复位 */
      event.preventDefault()
      const bounds = measure()
      setLimits(bounds)
      document.body.style.setProperty('cursor', 'col-resize')
      node.setPointerCapture?.(event.pointerId)
      start.current = { x: event.clientX, width: clamp(width ?? defaultWidth(node), bounds) }
      setDragging(true)
    },
    onDoubleClick: () => {
      paint(nodeRef.current, null)
      onCommit(null)
    },
  }
}
