import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

/** 两个面板之间那根分隔条的拖动：跟手算比例，松手交给调用方存；双击回到平分。 */
const MIN_RATIO = 0.2
const MAX_RATIO = 0.8

export type SplitOrientation = 'columns' | 'rows'

export function useSplitResize(
  orientation: SplitOrientation,
  onChange: (ratio: number) => void
) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    setDragging(true)
  }, [])

  useEffect(() => {
    if (!dragging) return
    const move = (event: PointerEvent) => {
      const box = containerRef.current?.getBoundingClientRect()
      if (!box || box.width === 0 || box.height === 0) return
      const value =
        orientation === 'columns'
          ? (event.clientX - box.left) / box.width
          : (event.clientY - box.top) / box.height
      onChange(Math.min(MAX_RATIO, Math.max(MIN_RATIO, value)))
    }
    const end = () => setDragging(false)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [dragging, orientation, onChange])

  /* 拖动中指针保持箭头并锁住选择：拖过两个面板的内容时不该出现文本选中 */
  useEffect(() => {
    const previous = document.body.style.userSelect
    document.body.style.userSelect = dragging ? 'none' : previous
    return () => {
      document.body.style.userSelect = previous
    }
  }, [dragging])

  const reset = useCallback(() => onChange(0.5), [onChange])

  return { containerRef, dragging, onPointerDown, reset }
}
