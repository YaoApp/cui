import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { SurfaceLayout } from '@/routes/surface-layout'
import { useSidePanelStore } from '@/stores/side-panel'

/* 布局**自己的契约**：替公共 store 绑定地址栏（机制见 platform/router/use-url-binding.ts）。
   公共的东西不归任何 feature，所以绑定住在这里；组合起来的效果（点实体→地址栏出现参数、
   后退→面板关掉）由浏览器层的深链用例覆盖。 */
function renderAt(entry: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/:surface',
        element: <SurfaceLayout />,
        children: [{ path: 'world', element: <p>页面</p> }],
      },
    ],
    { initialEntries: [entry] },
  )
  render(<RouterProvider router={router} />)
  return router
}

describe('SurfaceLayout · 公共状态与地址栏', () => {
  it('reads a named query parameter into the public store', async () => {
    renderAt('/main/world?sideEntity=e2')
    await waitFor(() => expect(useSidePanelStore.getState().entry).toEqual({ kind: 'world-entity', id: 'e2' }))
  })

  it('writes the public store back to the address, so it can be shared', async () => {
    const router = renderAt('/main/world')
    expect(screen.getByText('页面')).toBeInTheDocument()
    useSidePanelStore.getState().open({ kind: 'world-entity', id: 'e3' })
    await waitFor(() => expect(router.state.location.search).toBe('?sideEntity=e3'))
  })

  it('names an unknown surface in the current language', () => {
    renderAt('/bogus/world')
    expect(screen.getByText('未知的界面表面：bogus')).toBeInTheDocument()
  })
})
