import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('opens the panel straight from a named query parameter', () => {
    renderAt('/main/world/w1?sideEntity=e2')
    expect(screen.getByRole('region', { name: '条目面板' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '守门人' })).toBeInTheDocument()
  })

  it('leaves the address alone on mount when there is nothing to say', () => {
    const router = renderAt('/main/world/w1')
    expect(router.state.location.search).toBe('')
  })

  it('writes the panel parameter when an entity is opened', async () => {
    const router = renderAt('/main/world/w1')
    await userEvent.click(screen.getByRole('button', { name: '守门人' }))
    expect(router.state.location.search).toBe('?sideEntity=e2')
  })
})
