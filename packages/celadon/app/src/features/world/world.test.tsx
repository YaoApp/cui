import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { WorldPage } from '@/features/world/world'

/* 测试自己定义一条最小路由 —— feature 不许 import routes/（见 architecture/07-routing.md）。 */
function renderAt(entry: string) {
  const router = createMemoryRouter([{ path: '/:surface/world/:worldId?', element: <WorldPage /> }], {
    initialEntries: [entry],
  })
  render(<RouterProvider router={router} />)
  return router
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

})
