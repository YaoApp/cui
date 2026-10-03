import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { HelloPage } from '@/features/hello'

/** 页面现在带头部导航（useNavigate / useLocation），必须有路由上下文才能单独渲染。 */
function renderPage(entry = '/hello') {
  render(
    <RouterProvider
      router={createMemoryRouter([{ path: '/hello', element: <HelloPage /> }], { initialEntries: [entry] })}
    />,
  )
}

/* 这条走的是完整链路：base/button → header → feature store → 私有组件 foo-bar */
describe('HelloPage', () => {
  it('clicking refresh moves the counter on the page', async () => {
    renderPage()
    expect(screen.getByText('已刷新 0 次')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '刷新' }))

    expect(screen.getByText('已刷新 1 次')).toBeInTheDocument()
  })
})

describe('HelloPage · theme', () => {
  it('switches the page theme through the toggle', async () => {
    renderPage()
    expect(document.documentElement.dataset.theme).toBe('light')

    await userEvent.click(screen.getByRole('button', { name: '暗色' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(screen.getByRole('button', { name: '暗色' })).toHaveClass('is-on')
  })
})
