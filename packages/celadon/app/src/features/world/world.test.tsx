import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { useLocaleStore } from '@/platform/i18n/locale.store'
import { useSidePanelStore } from '@/stores/side-panel'
import { WorldPage } from '@/features/world/world'

/* 测试自己定义一条最小路由 —— feature 不许 import routes/（见 architecture/07-routing.md）。 */
function renderAt(entry: string) {
  const router = createMemoryRouter([{ path: '/world/:worldId?', element: <WorldPage /> }], {
    initialEntries: [entry],
  })
  render(<RouterProvider router={router} />)
  return router
}

/** 语言是 store 的事实，切换走它的动作（组件不直接改字段）。 */
function setLocale(locale: string) {
  return act(async () => {
    useLocaleStore.getState().setLocale(locale)
  })
}

describe('WorldPage', () => {
  it('lists the worlds', () => {
    renderAt('/world')
    expect(screen.getByRole('link', { name: 'Alpha 世界' })).toBeInTheDocument()
  })

  it('renders the detail straight from the path', () => {
    renderAt('/world/w1')
    expect(screen.getByRole('heading', { name: 'Alpha 世界' })).toBeInTheDocument()
  })

  /* "参数打开面板"与"打开面板写参数"是**组合行为**（布局绑定 + 页面渲染）：
     布局侧的单测在 routes/surface-layout.test.tsx，端到端在浏览器层的深链用例。 */

  it('leaves the address alone on mount when there is nothing to say', () => {
    const router = renderAt('/world/w1')
    expect(router.state.location.search).toBe('')
  })

  /* 夹具（我们自己的示例数据）跟语言走：切到英文后，用户看到的列表与详情都是英文。 */
  it('localizes the fixture after switching language', async () => {
    renderAt('/world/w1')
    expect(screen.getByRole('heading', { name: 'Alpha 世界' })).toBeInTheDocument()

    await setLocale('en-US')

    expect(screen.getByRole('heading', { name: 'Alpha World' })).toBeInTheDocument()
    expect(screen.getByText('The first world, for checking the list and the detail view.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Origin' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Alpha 世界' })).not.toBeInTheDocument()
  })

  it('keeps the world ids in the links while localizing the labels', async () => {
    renderAt('/world')

    await setLocale('en-US')

    expect(screen.getByRole('link', { name: 'Alpha World' })).toHaveAttribute('href', '/world/w1')
    expect(screen.getByRole('link', { name: 'Gamma World' })).toHaveAttribute('href', '/world/w3')
  })

  it('follows the Japanese pack too', async () => {
    renderAt('/world/w1')

    await setLocale('ja')

    expect(screen.getByRole('heading', { name: 'アルファ世界' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '門番' })).toBeInTheDocument()
  })

  /* `kind` 是**系统值**：数据里是 code，用户看到的是译文 —— 切语言后 code 不变、文案跟着换。 */
  it('shows the entity kind through the language pack, never the raw code', async () => {
    useSidePanelStore.getState().open({ kind: 'world-entity', id: 'e2' })
    renderAt('/world/w1')
    expect(screen.getByText('角色')).toBeInTheDocument()

    await setLocale('en-US')

    expect(screen.getByRole('heading', { name: 'Gatekeeper' })).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.queryByText('role')).not.toBeInTheDocument()
  })
})

/* 条目指向的对象不在了：必须作废，且**分享链接不许带上它**。 */
describe('WorldPage · an entry whose object is gone', () => {
  it('clears an entry whose object is gone, and keeps it out of the share link', async () => {
    act(() => useSidePanelStore.getState().open({ kind: 'world-entity', id: 'nope' }))
    renderAt('/world/w1')

    await waitFor(() => expect(useSidePanelStore.getState().entry).toBeUndefined())
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href') ?? '')
    expect(hrefs.some((href) => href.includes('sideEntity'))).toBe(false)
  })
})

/* 找不到世界时**必须留下导航** —— 只剩一行文案的话，用户只能按浏览器后退。 */
describe('WorldPage · a world that does not exist', () => {
  it('keeps the header and the navigation so the user can get somewhere', () => {
    renderAt('/world/nope')
    expect(screen.getByText('没有这个世界：nope')).toBeInTheDocument()
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: '刷新' })).toBeInTheDocument()
  })
})

/* `aria-pressed` 说的就是"这个开着"：再点同一个必须关上，否则语义在说谎。 */
describe('WorldPage · the pressed state of an entry', () => {
  it('closes the panel when the active entity is clicked again', async () => {
    renderAt('/world/w1')
    const button = screen.getByRole('button', { name: '守门人' })

    await userEvent.click(button)
    expect(useSidePanelStore.getState().entry).toEqual({ kind: 'world-entity', id: 'e2' })
    expect(button).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(button)
    expect(useSidePanelStore.getState().entry).toBeUndefined()
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })
})
