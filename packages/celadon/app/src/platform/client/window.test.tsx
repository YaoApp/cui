import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, waitFor } from '@testing-library/react'
import { useWindowChrome, type WindowChrome } from './window'

/* 窗口动作的契约：顶带里按下并移动拖动窗口（两个平台都由应用受理），双击最大化按平台分，
   macOS 归系统标题栏、Windows 归这里的切换；单击不拖动，控件与带外都不参与。
   真实窗口行为由桌面壳与人工验收，这里只验分发。 */
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

const chrome: WindowChrome[] = []

/* 每次渲染都把最新的钩子结果记下来：状态更新后读的是新值，不是挂载时那一份。 */
function Probe() {
  chrome.push(useWindowChrome())
  return null
}

/** 挂载探针，返回一个读「最后挂载那个实例」当前结果的函数。 */
function mount() {
  chrome.length = 0
  render(<Probe />)
  return () => chrome[chrome.length - 1]
}

/** 在窗口顶带里派发一次事件，目标默认是正文（非控件）。detail 表示点击次数。 */
function fire(
  type: 'mousedown' | 'pointermove' | 'pointerup' | 'dblclick',
  options: {
    y?: number
    x?: number
    target?: Element
    button?: number
    buttons?: number
    detail?: number
  } = {}
) {
  const target = options.target ?? document.body
  const buttons = options.buttons ?? (type === 'pointerup' ? 0 : 1)
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: options.button ?? 0,
    detail: options.detail ?? 1,
    clientX: options.x ?? 100,
    clientY: options.y ?? 10
  })
  Object.defineProperty(event, 'buttons', { value: buttons })
  act(() => {
    target.dispatchEvent(event)
  })
}

/** 一次完整的拖动：按下、移动、抬起。 */
function dragBy(distance = 12) {
  fire('mousedown', { x: 100, y: 10 })
  fire('pointermove', { x: 100 + distance, y: 10 })
  fire('pointerup', { x: 100 + distance, y: 10 })
}

beforeEach(() => {
  facts.kind = 'web'
  facts.os = 'macos'
  for (const fn of Object.values(bridge)) fn.mockClear()
  document.body.style.removeProperty('cursor')
})

afterEach(() => {
  document.querySelector('.celadon')?.remove()
})

describe('the window chrome hook', () => {
  it('Web：没有窗口可管，带内按下移动与双击都不分发', () => {
    const current = mount()
    expect(current().visible).toBe(false)
    expect(current().controls).toBe('none')
    dragBy()
    fire('dblclick')
    expect(bridge.startDragging).not.toHaveBeenCalled()
    expect(bridge.toggleMaximize).not.toHaveBeenCalled()
  })

  it('macOS：带内按下并移动才请求拖动，单击不请求', async () => {
    facts.kind = 'desktop'
    facts.os = 'macos'
    const current = mount()
    expect(current().visible).toBe(true)
    expect(current().controls).toBe('native')
    fire('mousedown')
    fire('pointerup')
    expect(bridge.startDragging).not.toHaveBeenCalled()
    dragBy()
    await waitFor(() => expect(current().dragState).toBe('ok'))
    expect(bridge.startDragging).toHaveBeenCalledTimes(1)
  })

  it('macOS：双击的第二下不启动拖动，双击切换交给系统标题栏', () => {
    facts.kind = 'desktop'
    facts.os = 'macos'
    mount()
    // 第二下（detail 为 2）即便移动也不拖动，否则系统收不到这次双击
    fire('mousedown', { detail: 2 })
    fire('pointermove', { x: 140 })
    expect(bridge.startDragging).not.toHaveBeenCalled()
    fire('dblclick')
    expect(bridge.toggleMaximize).not.toHaveBeenCalled()
  })

  it('拖动期间把指针统一成箭头，抬起后交还', () => {
    facts.kind = 'desktop'
    mount()
    fire('mousedown')
    fire('pointermove', { x: 130 })
    expect(document.body.style.cursor).toBe('default')
    fire('pointerup')
    expect(document.body.style.cursor).toBe('')
  })

  it('Windows：带内双击切换一次最大化', async () => {
    facts.kind = 'desktop'
    facts.os = 'windows'
    const current = mount()
    expect(current().controls).toBe('own')
    await waitFor(() => expect(bridge.maximized).toHaveBeenCalledTimes(1))
    fire('dblclick')
    await waitFor(() => expect(current().maximized).toBe(true))
    expect(bridge.toggleMaximize).toHaveBeenCalledTimes(1)
  })

  it('多个组件各调一次钩子时，一次双击只切换一次', async () => {
    facts.kind = 'desktop'
    facts.os = 'windows'
    chrome.length = 0
    render(
      <>
        <Probe />
        <Probe />
        <Probe />
      </>
    )
    await waitFor(() => expect(bridge.maximized).toHaveBeenCalledTimes(3))
    fire('dblclick')
    await waitFor(() => expect(bridge.toggleMaximize).toHaveBeenCalledTimes(1))
  })

  it('控件、带外与非左键都不吃拖动，也不吃双击', () => {
    facts.kind = 'desktop'
    facts.os = 'windows'
    mount()
    const button = document.createElement('button')
    const noDrag = document.createElement('div')
    noDrag.setAttribute('data-no-drag', '')
    document.body.append(button, noDrag)
    fire('mousedown', { target: button })
    fire('pointermove', { x: 120, target: button })
    fire('mousedown', { target: noDrag })
    fire('pointermove', { x: 120, target: noDrag })
    fire('mousedown', { y: 200 })
    fire('pointermove', { x: 120, y: 200 })
    fire('mousedown', { button: 2 })
    fire('pointermove', { x: 120 })
    fire('dblclick', { target: button })
    fire('dblclick', { y: 200 })
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
    fire('mousedown', { y: 30 })
    fire('pointermove', { x: 120, y: 30 })
    expect(bridge.startDragging).not.toHaveBeenCalled()
    fire('mousedown', { y: 10 })
    fire('pointermove', { x: 120, y: 10 })
    expect(bridge.startDragging).toHaveBeenCalledTimes(1)
  })

  it('拖动失败时把原因写进 dragState', async () => {
    facts.kind = 'desktop'
    bridge.startDragging.mockRejectedValueOnce(new Error('no permission'))
    const current = mount()
    dragBy()
    await waitFor(() => expect(current().dragState.startsWith('failed:')).toBe(true))
  })

  it('窗口尺寸变化后重读最大化状态，最小化与关闭直接落到桥', async () => {
    facts.kind = 'desktop'
    facts.os = 'windows'
    const current = mount()
    await waitFor(() => expect(bridge.maximized).toHaveBeenCalledTimes(1))
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    await waitFor(() => expect(bridge.maximized).toHaveBeenCalledTimes(2))
    act(() => {
      current().minimize()
      current().close()
    })
    expect(bridge.minimize).toHaveBeenCalledTimes(1)
    expect(bridge.close).toHaveBeenCalledTimes(1)
  })
})
