import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { OverviewPage } from '@/features/scaffold/overview'

/** 页面现在带头部导航（useNavigate / useLocation），必须有路由上下文才能单独渲染。 */
function renderPage(entry = '/hello') {
  render(
    <RouterProvider
      router={createMemoryRouter([{ path: '/hello', element: <OverviewPage /> }], { initialEntries: [entry] })}
    />,
  )
}

/* 这条走的是完整链路：base/button → header → feature store → 私有组件 foo-bar */
describe('OverviewPage', () => {
  it('renders the page header with a refresh button', () => {
    renderPage()
    expect(screen.getByText(/结构试跑/)).toBeInTheDocument()
    /* 刷新是**路由重载**（`ScaffoldPage` 里 `navigate(0)`），不再是页面状态自增；
       那条动作本身由 `scaffold-page.test.tsx` 钉住 */
    expect(screen.getByRole('button', { name: '刷新' })).toBeInTheDocument()
  })
})

describe('OverviewPage · theme', () => {
  it('switches the page theme through the toggle', async () => {
    renderPage()
    expect(document.documentElement.dataset.theme).toBe('light')

    await userEvent.click(screen.getByRole('button', { name: '暗色' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(screen.getByRole('button', { name: '暗色' })).toHaveClass('is-on')
  })
})
