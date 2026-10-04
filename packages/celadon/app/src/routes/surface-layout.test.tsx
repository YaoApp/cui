import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { SurfaceLayout } from '@/routes/surface-layout'

/* 外壳的契约：**所有页面住在主区里**。侧边（`side/`）在 2026-10-04 撤掉（没有产品页面时它没有消费者），
   导航也不在壳里 —— 它属于脚手架（`plan/05-scaffold.md` §4、§6.1）。 */
function renderAt(entry: string) {
  const router = createMemoryRouter(
    [{ path: '/', element: <SurfaceLayout />, children: [{ path: 'scaffold', element: <p>页面</p> }] }],
    { initialEntries: [entry] },
  )
  render(<RouterProvider router={router} />)
  return router
}

describe('SurfaceLayout', () => {
  it('renders the page inside the main surface', () => {
    renderAt('/scaffold')
    const main = screen.getByRole('main')
    expect(main).toHaveClass('surface', 'surface--main')
    expect(screen.getByText('页面')).toBeInTheDocument()
  })

  it('keeps the query string untouched (no binding lives here any more)', () => {
    const router = renderAt('/scaffold?q=alpha')
    expect(router.state.location.search).toBe('?q=alpha')
  })
})
