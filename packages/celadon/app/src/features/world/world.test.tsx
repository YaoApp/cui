import { act, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { useLocaleStore } from '@/platform/i18n/locale.store'
import { useSidePanelStore } from '@/stores/side-panel'
import { WorldPage } from '@/features/world/world'

/* 测试自己定义一条最小路由 —— feature 不许 import routes/（见 architecture/07-routing.md）。 */
function renderAt(entry: string) {
  const router = createMemoryRouter([{ path: '/:surface/world/:worldId?', element: <WorldPage /> }], {
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
    renderAt('/main/world')
    expect(screen.getByRole('link', { name: 'Alpha 世界' })).toBeInTheDocument()
  })

  it('renders the detail straight from the path', () => {
    renderAt('/main/world/w1')
    expect(screen.getByRole('heading', { name: 'Alpha 世界' })).toBeInTheDocument()
  })

  /* "参数打开面板"与"打开面板写参数"是**组合行为**（布局绑定 + 页面渲染）：
     布局侧的单测在 routes/surface-layout.test.tsx，端到端在浏览器层的深链用例。 */

  it('leaves the address alone on mount when there is nothing to say', () => {
    const router = renderAt('/main/world/w1')
    expect(router.state.location.search).toBe('')
  })

  /* 夹具（我们自己的示例数据）跟语言走：切到英文后，用户看到的列表与详情都是英文。 */
  it('localizes the fixture after switching language', async () => {
    renderAt('/main/world/w1')
    expect(screen.getByRole('heading', { name: 'Alpha 世界' })).toBeInTheDocument()

    await setLocale('en-US')

    expect(screen.getByRole('heading', { name: 'Alpha World' })).toBeInTheDocument()
    expect(screen.getByText('The first world, for checking the list and the detail view.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Origin' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Alpha 世界' })).not.toBeInTheDocument()
  })

  it('keeps the world ids in the links while localizing the labels', async () => {
    renderAt('/main/world')

    await setLocale('en-US')

    expect(screen.getByRole('link', { name: 'Alpha World' })).toHaveAttribute('href', '/main/world/w1')
    expect(screen.getByRole('link', { name: 'Gamma World' })).toHaveAttribute('href', '/main/world/w3')
  })

  it('follows the Japanese pack too', async () => {
    renderAt('/main/world/w1')

    await setLocale('ja')

    expect(screen.getByRole('heading', { name: 'アルファ世界' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '門番' })).toBeInTheDocument()
  })

  /* `kind` 是**系统值**：数据里是 code，用户看到的是译文 —— 切语言后 code 不变、文案跟着换。 */
  it('shows the entity kind through the language pack, never the raw code', async () => {
    useSidePanelStore.getState().open({ kind: 'world-entity', id: 'e2' })
    renderAt('/main/world/w1')
    expect(screen.getByText('角色')).toBeInTheDocument()

    await setLocale('en-US')

    expect(screen.getByRole('heading', { name: 'Gatekeeper' })).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.queryByText('role')).not.toBeInTheDocument()
  })
})
