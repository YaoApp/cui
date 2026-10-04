/* **这一页的页面级用例**：钉住**调用点**的接线（不只是那些纯函数）。
 *
 * 与 `verify.test.tsx` 同一套写法：mock 平台层、挂真页面、断言关键行为。
 * 这里连 `@/platform/transport/fetch` 一起换掉 —— 于是走的是**真的 `send()`**：
 * 服务信息（`/.well-known/yao`）→ 地址（service.endpoint）→ 出口（transportFetch）→ 解包裹（unwrap）；
 * 受保护的两条在假出口上回 401，页面照预期把结果标注成"预期失败"。 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const MESSAGE = 'hello from the scaffold'
const SERVICE = { name: 'Yao Agents', version: '1.0.0', openapi: '/v1' }

vi.mock('@/platform/transport/fetch', () => ({ transportFetch: vi.fn() }))

import { transportFetch } from '@/platform/transport/fetch'
import { useThemeStore } from '@/platform/theme/theme.store'
import { DataCheckPage } from './data-check'

function json(value: unknown, status = 200) {
  return { ok: true as const, value: new Response(JSON.stringify(value), { status }) }
}

/** 公开那条的调用（挂载时四态那节也会打一次，所以按 URL 过滤而不是数次数）。 */
const publicCalls = () =>
  vi.mocked(transportFetch).mock.calls.filter(([url]) => String(url).includes('/helloworld/public'))

function renderPage() {
  render(
    <MemoryRouter>
      <DataCheckPage />
    </MemoryRouter>,
  )
}

describe('the data check page', () => {
  beforeEach(() => {
    vi.mocked(transportFetch).mockReset()
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      // 服务信息：`send()` 第一次需要时读一次，给 openapi 前缀地址才拼得出来
      if (target.includes('/.well-known/yao')) return json(SERVICE)
      // 受保护的两条：登录还没接，假出口回 401（预期失败）
      if (target.includes('/helloworld/protected')) {
        return json({ error: 'unauthorized', error_description: 'login is not wired' }, 401)
      }
      return json({ MESSAGE, SERVER_TIME: '2026-01-01T00:00:00Z' })
    })
  })

  it('does not run the manual requests until a button is clicked', async () => {
    renderPage()

    // 四态那节挂载即跑（公开 GET），等它落定后：手动的那几条一条都不该动
    await waitFor(() => expect(publicCalls().length).toBeGreaterThan(0))
    expect(vi.mocked(transportFetch).mock.calls.some(([, init]) => init?.body !== undefined)).toBe(false)
    expect(vi.mocked(transportFetch).mock.calls.some(([url]) => String(url).includes('/helloworld/protected'))).toBe(false)
  })

  it('really runs the public GET through send, carrying the platform context', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(publicCalls().length).toBeGreaterThan(0))
    const before = publicCalls().length

    await user.click(screen.getByRole('button', { name: /^(公开 GET|公開 GET|Public GET)$/ }))

    await waitFor(() => expect(publicCalls().length).toBeGreaterThan(before))
    const [url, init] = publicCalls().at(-1)!
    expect(String(url)).toContain('/v1/helloworld/public')
    expect(init?.method).toBe('GET')
    // 请求元数据真的来自 i18n：地址带 locale，头带 Accept-Language
    expect(String(url)).toContain('locale=zh-CN')
    expect(new Headers(init?.headers).get('Accept-Language')).toBe('zh-CN')
    // 返回值真上了屏（MESSAGE 是引擎线上形状的大写键）
    expect((await screen.findAllByText(new RegExp(MESSAGE))).length).toBeGreaterThan(0)
  })

  it('really runs the public POST with a body', async () => {
    const user = userEvent.setup()
    const withBody = () => vi.mocked(transportFetch).mock.calls.filter(([, init]) => init?.body !== undefined)
    renderPage()
    // manual：挂载时只有四态那节的公开 GET，没有带 body 的 POST
    await waitFor(() => expect(publicCalls().length).toBeGreaterThan(0))
    const before = withBody().length
    expect(before).toBe(0)

    await user.click(screen.getByRole('button', { name: /^(公开 POST|公開 POST|Public POST)$/ }))

    await waitFor(() => expect(withBody().length).toBeGreaterThan(before))
    const [url, init] = withBody().at(-1)!
    expect(String(url)).toContain('/v1/helloworld/public')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({ from: 'data-check' })
  })

  it('keeps the button disabled while its request is in flight, then re-enables it', async () => {
    // 可控的**挂起 promise**：请求发出去后停在这里，直到用例放行 —— 不靠真实延迟
    let release = () => {}
    const gate = new Promise<void>((resolve) => { release = resolve })
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      if (target.includes('/.well-known/yao')) return json(SERVICE)
      if (target.includes('/helloworld/public')) {
        await gate
        return json({ MESSAGE, SERVER_TIME: '2026-01-01T00:00:00Z' })
      }
      return json({ error: 'unauthorized', error_description: 'login is not wired' }, 401)
    })

    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(publicCalls().length).toBeGreaterThan(0))
    const before = publicCalls().length
    const button = screen.getByRole('button', { name: /^(公开 GET|公開 GET|Public GET)$/ })
    await expect(button).toBeEnabled()

    await user.click(button)

    // 请求已在飞（这次调用真的发出去了）：按钮必须先禁用，防止重复提交
    await waitFor(() => expect(publicCalls().length).toBe(before + 1))
    expect(button).toBeDisabled()

    // 落定后恢复可点
    release()
    await waitFor(() => expect(button).toBeEnabled())
  })

  it('lets the protected calls run and marks the result as an expected failure', async () => {
    const user = userEvent.setup()
    renderPage()
    // manual：挂载时受保护的那条不跑
    await waitFor(() => expect(publicCalls().length).toBeGreaterThan(0))
    expect(
      vi.mocked(transportFetch).mock.calls.some(([url]) => String(url).includes('/helloworld/protected')),
    ).toBe(false)

    await user.click(screen.getByRole('button', { name: /^(受保护 GET|受保護 GET|Protected GET)$/ }))

    // 预期失败是**页面说清楚的**，不是沉默的报错
    expect(await screen.findByText(/预期失败（还没接登录）/)).toBeInTheDocument()
    expect(
      vi.mocked(transportFetch).mock.calls.some(([url]) => String(url).includes('/helloworld/protected')),
    ).toBe(true)
  })

  it('shows the four request states and lands on ok', async () => {
    renderPage()

    // 挂载即 loading（useRequest 的 effect 同步落到 loading）
    expect(document.querySelector('.data-check__state[data-active="true"]')?.textContent).toBe('加载中')

    await screen.findByText(new RegExp(MESSAGE))
    expect(document.querySelector('.data-check__state[data-active="true"]')?.textContent).toBe('成功')
    for (const status of ['空闲', '加载中', '成功', '失败']) {
      expect(screen.getAllByText(status).length).toBeGreaterThan(0)
    }
  })

  it('reports a failing request as the error state, with a translated message', async () => {
    vi.mocked(transportFetch).mockImplementation(async () => ({
      ok: false as const,
      code: 'transport.network',
      params: { url: '/v1/helloworld/public' },
      message: 'request failed',
    }))
    renderPage()

    await waitFor(() =>
      expect(document.querySelector('.data-check__state[data-active="true"]')?.textContent).toBe('失败'),
    )
    expect(await screen.findByText(/连不上/)).toBeInTheDocument()
  })

  it('reads the current language and theme from the platform stores', async () => {
    useThemeStore.getState().setPreference('dark')
    renderPage()

    await screen.findByText(new RegExp(MESSAGE))
    // 请求元数据显示的就是 store 里的解析结果（语言 zh-CN · 主题 dark）
    expect(screen.getByText('zh-CN')).toBeInTheDocument()
    expect(screen.getByText('dark')).toBeInTheDocument()
  })
})
