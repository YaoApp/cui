import { beforeEach, describe, expect, it } from 'vitest'
import { useDataCheckStore } from './data-check.store'

/* 私有 store 与公共 store 共用同一套自动复位（test-support 按文件名发现），第一条就在验证它。 */
describe('useDataCheckStore', () => {
  beforeEach(() => {
    expect(useDataCheckStore.getState().lines).toEqual([])
  })

  it('starts empty and keeps it that way between cases', () => {
    useDataCheckStore.getState().report({ label: 'a', text: 'x', expected: false })
    expect(useDataCheckStore.getState().lines).toHaveLength(1)
  })

  it('puts the newest first and numbers every line apart', () => {
    const { report } = useDataCheckStore.getState()
    report({ label: 'first', text: '1', expected: false })
    report({ label: 'second', text: '2', expected: true })
    const lines = useDataCheckStore.getState().lines
    expect(lines.map((line) => line.label)).toEqual(['second', 'first'])
    expect(new Set(lines.map((line) => line.id)).size).toBe(2)
    expect(lines[1]).toMatchObject({ label: 'first', expected: false })
  })

  it('keeps the most recent twenty', () => {
    const { report } = useDataCheckStore.getState()
    for (let index = 0; index < 25; index += 1) report({ label: `l${index}`, text: '', expected: false })
    const lines = useDataCheckStore.getState().lines
    expect(lines).toHaveLength(20)
    expect(lines[0].label).toBe('l24')
    expect(new Set(lines.map((line) => line.id)).size).toBe(20)
  })
})
