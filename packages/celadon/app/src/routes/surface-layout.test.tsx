import { act, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { SurfaceLayout } from '@/routes/surface-layout'
import { useSidePanelStore } from '@/stores/side-panel'

/* 布局**自己的契约**：替公共 store 绑定地址栏（机制见 platform/router/use-url-binding.ts）。
   公共的东西不归任何 feature，所以绑定住在这里；组合起来的效果（点实体→地址栏出现参数、
   后退→面板关掉）由浏览器层的深链用例覆盖。表面由支路传入，不从地址取。 */
function renderAt(entry: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <SurfaceLayout surface="main" />,
        children: [
          { path: 'world', element: <p>页面</p> },
          { path: 'hello', element: <p>你好页</p> },
        ],
      },
    ],
    { initialEntries: [entry] },
  )
  render(<RouterProvider router={router} />)
  return router
}

describe('SurfaceLayout · the public entry and the address', () => {
  it('reads a named query parameter into the public store', async () => {
    renderAt('/world?sideEntity=e2')
    await waitFor(() => expect(useSidePanelStore.getState().entry).toEqual({ kind: 'world-entity', id: 'e2' }))
  })

  it('writes the public store back to the address, so it can be shared', async () => {
    const router = renderAt('/world')
    expect(screen.getByText('页面')).toBeInTheDocument()
    useSidePanelStore.getState().open({ kind: 'world-entity', id: 'e3' })
    await waitFor(() => expect(router.state.location.search).toBe('?sideEntity=e3'))
  })
})

/* 条目只由能渲染它的功能负责：离开它的地盘、或深链落在别人的地盘上，都要作废。
   放单元层 —— 浏览器层那条"点击后立刻断言 URL"会与写回 effect 抢跑（验收抓到 50% 假绿）。 */
describe('SurfaceLayout · an entry that no longer belongs here', () => {
  it('clears the entry and the parameter when the route leaves the owner', async () => {
    act(() => useSidePanelStore.getState().open({ kind: 'world-entity', id: 'e2' }))
    const router = renderAt('/world?sideEntity=e2')
    expect(useSidePanelStore.getState().entry).toEqual({ kind: 'world-entity', id: 'e2' })

    await act(async () => {
      await router.navigate('/hello?sideEntity=e2')
    })

    await waitFor(() => expect(useSidePanelStore.getState().entry).toBeUndefined())
    expect(router.state.location.search).toBe('')
  })

  it('never takes the entry of a route it cannot render, not even for a moment', async () => {
    /* 只看"最终清空"是不够的：读时不判断、再靠离开 effect 清掉，结果一样绿。
       这里盯**过程中的每一次 store 变化** —— 读时若认了它，就会留下痕迹。 */
    const seen: unknown[] = []
    const unsubscribe = useSidePanelStore.subscribe((state) => seen.push(state.entry))
    renderAt('/hello?sideEntity=e2')
    await waitFor(() => expect(useSidePanelStore.getState().entry).toBeUndefined())
    unsubscribe()

    expect(seen.some((entry) => (entry as { kind?: string } | undefined)?.kind === 'world-entity')).toBe(false)
  })

  it('leaves the feature without writing the parameter back on the way out', async () => {
    /* 修的是"离开时先把参数写回去、再删掉"（多塞两条历史）。只看最终地址看不出来，
       要盯**路由器落过的每一个地址**：不该出现带参的那一站。 */
    act(() => useSidePanelStore.getState().open({ kind: 'world-entity', id: 'e2' }))
    const router = renderAt('/world?sideEntity=e2')

    const landed: string[] = []
    const unsubscribe = router.subscribe((state) => landed.push(state.location.search))
    await act(async () => {
      await router.navigate('/hello')
    })
    unsubscribe()
    await waitFor(() => expect(useSidePanelStore.getState().entry).toBeUndefined())

    expect(landed.filter((search) => search.includes('sideEntity'))).toEqual([])
    expect(router.state.location.search).toBe('')
  })

  it('does not take the parameter of a route it cannot render', async () => {
    const router = renderAt('/hello?sideEntity=e2')
    await waitFor(() => expect(useSidePanelStore.getState().entry).toBeUndefined())
    expect(router.state.location.search).toBe('')
  })

  it('writes nothing for a kind nobody registered', async () => {
    const router = renderAt('/world')
    act(() => useSidePanelStore.getState().open({ kind: 'unregistered-thing', id: 'x' }))
    await waitFor(() => expect(router.state.location.search).toBe(''))
  })
})
