import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppLayout } from '@/routes/layout'
import { useColumnsStore } from '@/stores/layout/columns'
import { useTabsStore, HOME_TAB, tabKey } from '@/stores/browser/tabs'

/* 三栏外壳的契约：导航栏、内容区、标签浏览器同时在位；哪一栏画什么由布局事实决定。 */
function renderAt(entry: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppLayout />,
        children: [{ path: 'inbox', element: <p>页面</p> }],
      },
    ],
    { initialEntries: [entry] },
  )
  render(<RouterProvider router={router} />)
  return router
}

describe('AppLayout', () => {
  beforeEach(() => {
    useColumnsStore.setState({ navCollapsed: false, navMainCollapsed: false, browserCollapsed: false, browserSide: 'right' })
    useTabsStore.setState({ tabs: [HOME_TAB], activeKey: tabKey(HOME_TAB) })
  })

  it('renders the three columns and the page', () => {
    renderAt('/inbox')
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('complementary')).toBeInTheDocument()
    expect(screen.getByText('页面')).toBeInTheDocument()
  })

  it('drops the browser column when it is collapsed', () => {
    useColumnsStore.setState({ browserCollapsed: true })
    renderAt('/inbox')
    expect(screen.queryByRole('complementary')).toBeNull()
  })

  it('marks the current destination', () => {
    renderAt('/inbox')
    const current = screen.getAllByRole('link', { name: '收件箱' })
    expect(current[0]).toHaveAttribute('aria-current', 'page')
  })

  it('keeps the query string untouched', () => {
    const router = renderAt('/inbox?q=alpha')
    expect(router.state.location.search).toBe('?q=alpha')
  })
})
