import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

/* 刷新是**路由重载**：`navigate(0)`。这条用例专门钉住它 —— 删掉那行调用就会红。 */
const navigate = vi.hoisted(() => vi.fn())
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useNavigate: () => navigate }
})

import { ScaffoldPage } from './scaffold-page'

function renderPage(title = '总览') {
  render(
    <MemoryRouter initialEntries={['/scaffold']}>
      <ScaffoldPage title={title}>
        <p>正文</p>
      </ScaffoldPage>
    </MemoryRouter>,
  )
}

describe('ScaffoldPage', () => {
  it('renders the page title, the nav with the current item, and the body', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: '总览' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '路由' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '总览' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('正文')).toBeInTheDocument()
  })

  it('reloads the route when the header refresh is pressed', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: '刷新' }))
    expect(navigate).toHaveBeenCalledWith(0)
  })
})
