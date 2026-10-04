import { act, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { useLocaleStore } from '@/platform/i18n/locale.store'
import { RoutingPage } from './routing'

/* 测试自己定义一条最小路由 —— feature 不许 import routes/（见 architecture/07-routing.md）。 */
function renderAt(entry: string) {
  const router = createMemoryRouter([{ path: '/scaffold/routing/:worldId?', element: <RoutingPage /> }], {
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

describe('RoutingPage', () => {
  it('lists the worlds', () => {
    renderAt('/scaffold/routing')
    expect(screen.getByRole('link', { name: 'Alpha 世界' })).toBeInTheDocument()
  })

  it('renders the detail straight from the path', () => {
    renderAt('/scaffold/routing/w1')
    expect(screen.getByRole('heading', { name: 'Alpha 世界' })).toBeInTheDocument()
  })

  it('leaves the address alone on mount when there is nothing to say', () => {
    const router = renderAt('/scaffold/routing/w1')
    expect(router.state.location.search).toBe('')
  })

  /* 夹具（我们自己的示例数据）跟语言走：切到英文后，用户看到的列表与详情都是英文。 */
  it('localizes the fixture after switching language', async () => {
    renderAt('/scaffold/routing/w1')
    expect(screen.getByRole('heading', { name: 'Alpha 世界' })).toBeInTheDocument()

    await setLocale('en-US')

    expect(screen.getByRole('heading', { name: 'Alpha World' })).toBeInTheDocument()
    expect(screen.getByText('The first world, for checking the list and the detail view.')).toBeInTheDocument()
    expect(screen.getByText('Origin')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Alpha 世界' })).not.toBeInTheDocument()
  })

  it('keeps the world ids in the links while localizing the labels', async () => {
    renderAt('/scaffold/routing')

    await setLocale('en-US')

    expect(screen.getByRole('link', { name: 'Alpha World' })).toHaveAttribute('href', '/scaffold/routing/w1')
    expect(screen.getByRole('link', { name: 'Gamma World' })).toHaveAttribute('href', '/scaffold/routing/w3')
  })

  it('follows the Japanese pack too', async () => {
    renderAt('/scaffold/routing/w1')

    await setLocale('ja')

    expect(screen.getByRole('heading', { name: 'アルファ世界' })).toBeInTheDocument()
    expect(screen.getByText('門番')).toBeInTheDocument()
  })

  it('shares a link that carries the app segment and the object', () => {
    renderAt('/scaffold/routing/w1')
    const share = screen.getByRole('link', { name: '分享这个视图' })
    expect(share.getAttribute('href')).toContain('/scaffold/routing/w1')
    expect(share.getAttribute('href')).not.toContain('sideEntity')
  })
})

/* 找不到世界时**必须留下导航** —— 只剩一行文案的话，用户只能按浏览器后退。 */
describe('RoutingPage · a world that does not exist', () => {
  it('keeps the header and the navigation so the user can get somewhere', () => {
    renderAt('/scaffold/routing/nope')
    expect(screen.getByText('没有这个世界：nope')).toBeInTheDocument()
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: '刷新' })).toBeInTheDocument()
  })
})
