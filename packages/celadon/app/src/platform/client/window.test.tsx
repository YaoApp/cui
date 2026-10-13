import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, waitFor } from '@testing-library/react'
import { useWindowChrome, type WindowChrome } from './window'

/* 窗口动作的契约：顶带里的空白按下拖动、双击切换最大化，控件与带外不吃这两个动作。
   真实窗口行为（窗口是否真的移动、是否真的最大化）由桌面壳与人工验收，这里只验分发。 */
const { bridge, facts } = vi.hoisted(() => ({
  bridge: {
    minimize: vi.fn(() => Promise.resolve({ ok: true as const, value: null })),
    toggleMaximize: vi.fn(() => Promise.resolve({ ok: true as const, value: true })),
    close: vi.fn(() => Promise.resolve({ ok: true as const, value: null })),
    maximized: vi.fn(() => Promise.resolve({ ok: true as const, value: false })),
    startDragging: vi.fn(() => Promise.resolve({ ok: true as const, value: null }))
  },
  facts: { kind: 'web' as 'web' | 'desktop', os: 'macos' as 'macos' | 'windows' }
}))

vi.mock('../bridge/window', () => ({ windowChrome: bridge }))
vi.mock('./facts', () => ({ client: facts }))

let chrome: WindowChrome

/* 每次渲染都把最新的钩子结果记下来：状态更新后读的是新值，不是挂载时那一份。 */
function Probe() {
  chrome = useWindowChrome()
  return null
}

function mount() {
  render(<Probe />)
}

/** 在窗口顶带里派发一次按下或双击，目标默认是正文（非控件）。 */
function fireInBand(
  type: 'pointerdown' | 'dblclick',
  options: { y?: number; target?: Element; button?: number } = {}
) {
  const target = options.target ?? document.body
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: options.button ?? 0,
    clientY: options.y ?? 10
  })
  act(() => {
    target.dispatchEvent(event)
  })
}

beforeEach(() => {
  facts.kind = 'web'
  facts.os = 'macos'
  for (const fn of Object.values(bridge)) fn.mockClear()
})

afterEach(() => {
  document.querySelector('.celadon')?.remove()
})

describe('the window chrome hook', () => {
  it('Web：没有窗口可管，顶带里的按下与双击都不分发', () => {
    mount()
    expect(chrome.visible).toBe(false)
    expect(chrome.controls).toBe('none')
    fireInBand('pointerdown')
    fireInBand('dblclick')
    expect(bridge.startDragging).not.toHaveBeenCalled()
    expect(bridge.toggleMaximize).not.toHaveBeenCalled()
  })

  it('macOS：窗口键归原生交通灯，顶带里按下即请求拖动', async () => {
    facts.kind = 'desktop'
    facts.os = 'macos'
    mount()
    expect(chrome.visible).toBe(true)
    expect(chrome.controls).toBe('native')
    fireInBand('pointerdown')
    await waitFor(() => expect(chrome.dragState).toBe('ok'))
    expect(bridge.startDragging).toHaveBeenCalledTimes(1)
  })

  it('Windows：窗口键自绘，顶带里双击即切换最大化', async () => {
    facts.kind = 'desktop'
    facts.os = 'windows'
    mount()
    expect(chrome.controls).toBe('own')
    await waitFor(() => expect(bridge.maximized).toHaveBeenCalledTimes(1))
    fireInBand('dblclick')
    await waitFor(() => expect(chrome.maximized).toBe(true))
    expect(bridge.toggleMaximize).toHaveBeenCalledTimes(1)
  })

  it('控件、带外与非左键都不吃拖动，也不吃双击', () => {
    facts.kind = 'desktop'
    mount()
    const button = document.createElement('button')
    const noDrag = document.createElement('div')
    noDrag.setAttribute('data-no-drag', '')
    document.body.append(button, noDrag)
    fireInBand('pointerdown', { target: button })
    fireInBand('pointerdown', { target: noDrag })
    fireInBand('pointerdown', { y: 200 })
    fireInBand('pointerdown', { button: 2 })
    fireInBand('dblclick', { target: button })
    fireInBand('dblclick', { y: 200 })
    expect(bridge.startDragging).not.toHaveBeenCalled()
    expect(bridge.toggleMaximize).not.toHaveBeenCalled()
    button.remove()
    noDrag.remove()
  })

  it('拖动带高度读 `.celadon` 作用域上的 token', () => {
    facts.kind = 'desktop'
    mount()
    const scope = document.createElement('div')
    scope.className = 'celadon'
    scope.style.setProperty('--window-drag-band', '20px')
    document.body.append(scope)
    fireInBand('pointerdown', { y: 30 })
    expect(bridge.startDragging).not.toHaveBeenCalled()
    fireInBand('pointerdown', { y: 10 })
    expect(bridge.startDragging).toHaveBeenCalledTimes(1)
  })

  it('拖动失败时把原因写进 dragState', async () => {
    facts.kind = 'desktop'
    bridge.startDragging.mockRejectedValueOnce(new Error('no permission'))
    mount()
    fireInBand('pointerdown')
    await waitFor(() => expect(chrome.dragState.startsWith('failed:')).toBe(true))
  })

  it('窗口尺寸变化后重读最大化状态，最小化与关闭直接落到桥', async () => {
    facts.kind = 'desktop'
    facts.os = 'windows'
    mount()
    await waitFor(() => expect(bridge.maximized).toHaveBeenCalledTimes(1))
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    await waitFor(() => expect(bridge.maximized).toHaveBeenCalledTimes(2))
    act(() => {
      chrome.minimize()
      chrome.close()
    })
    expect(bridge.minimize).toHaveBeenCalledTimes(1)
    expect(bridge.close).toHaveBeenCalledTimes(1)
  })
})
