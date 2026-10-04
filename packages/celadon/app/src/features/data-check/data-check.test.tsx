/* **这一页的页面级用例**：钉住**调用点**的接线（不只是那些纯函数）。
 *
 * 与 `verify.test.tsx` 同一套写法：mock 平台层、挂真页面、断言关键行为。
 * 这里连 `@/platform/transport/fetch` 一起换掉 —— 于是走的是**真的 `send`**：
 * 服务信息（`/.well-known/yao`）→ 地址（service.endpoint）→ 出口（transportFetch）→ 解包裹（unwrap）；
 * 受保护的两条在假出口上回 401，页面照预期把结果标注成"预期失败"。 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const MESSAGE = 'hello from the scaffold'
const SERVICE = { name: 'Yao Agents', version: '1.0.0', openapi: '/v1' }

/* 假出口返回的**假凭据**（不是真值）：只用来断言"值不上屏、只上长度"。 */
const SESSION = 'fake-session-value'
const ID_TOKEN = 'fake-id-value'
const ACCESS = 'fake-access-value'
const REFRESH = 'fake-refresh-value'
const LOGIN = {
  session_id: SESSION,
  id_token: ID_TOKEN,
  access_token: ACCESS,
  refresh_token: REFRESH,
  expires_in: 3600,
  refresh_token_expires_in: 86400,
  status: 'active',
}

/** `/test/users` 的分页回应：把用户行包成引擎的线上形状（12 个字段里页面要展示的那几个）。 */
function userPage(emails: readonly string[]) {
  return {
    data: emails.map((email, index) => ({
      id: `id-${index}`,
      user_id: `user-${index}`,
      email,
      name: `Name ${index}`,
      preferred_username: `username-${index}`,
      status: 'active',
      role_id: `role-${index}`,
      type_id: `type-${index}`,
      email_verified: index % 2 === 0,
    })),
    page: 1,
    pagesize: 20,
    pagecnt: 1,
    total: emails.length,
    next: null,
    prev: null,
  }
}

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

/** 结果排里某一格的可见文字（页面用例与拟人脚本同一读法）。 */
const cellText = (label: string) =>
  [...document.querySelectorAll('.data-check__cell')]
    .find((el) => el.querySelector('.data-check__label')?.textContent === label)?.textContent ?? ''

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
      // 服务信息：`send` 第一次需要时读一次，给 openapi 前缀地址才拼得出来
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
    expect(await screen.findByText(/未登录（缺凭据）/)).toBeInTheDocument()
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

  it('lists the first few user emails after the list button is clicked', async () => {
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      if (target.includes('/.well-known/yao')) return json(SERVICE)
      if (target.includes('/test/users')) return json(userPage(['ada@example.com', 'grace@example.com', 'linus@example.com', 'extra@example.com']))
      return json({ error: 'unauthorized', error_description: 'login is not wired' }, 401)
    })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(publicCalls().length).toBeGreaterThan(0))

    await user.click(screen.getByRole('button', { name: '列出用户' }))

    expect(await screen.findByText('ada@example.com')).toBeInTheDocument()
    expect(screen.getByText('grace@example.com')).toBeInTheDocument()
    expect(screen.getByText('linus@example.com')).toBeInTheDocument()
    // 只列前几个：第 4 个不上屏（邮箱是用户可见的事实，不是凭据）
    expect(screen.queryByText('extra@example.com')).not.toBeInTheDocument()
    // 用户行把关键字段都列出来：id · user_id · 状态 · 角色 · 类型（值都在）
    for (const value of ['id-0', 'user-0', 'role-0', 'type-0']) {
      expect(screen.getByText(value)).toBeInTheDocument()
    }
    expect(screen.getAllByText('active').length).toBeGreaterThan(0)
    // email_verified 用人话上屏，不裸印 true / false
    expect(screen.getAllByText('已验证').length).toBeGreaterThan(0)
    expect(screen.getByText('未验证')).toBeInTheDocument()
    expect(screen.queryByText('true')).not.toBeInTheDocument()
    // 地址真的走了分页查询（域层 query 工厂把参数并进了路径）
    expect(
      vi.mocked(transportFetch).mock.calls.some(([url]) => String(url).includes('/v1/test/users?page=1&pagesize=20')),
    ).toBe(true)
  })

  it('signs in as a listed account and turns the protected cell into a success', async () => {
    let signedIn = false
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      if (target.includes('/.well-known/yao')) return json(SERVICE)
      if (target.includes('/test/users')) return json(userPage(['ada@example.com']))
      if (target.includes('/test/login/web')) {
        signedIn = true
        return json(LOGIN)
      }
      if (target.includes('/helloworld/protected')) {
        return signedIn
          ? json({ MESSAGE, SERVER_TIME: '2026-01-01T00:00:00Z' })
          : json({ error: 'unauthorized', error_description: 'login is not wired' }, 401)
      }
      return json({ MESSAGE, SERVER_TIME: '2026-01-01T00:00:00Z' })
    })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(publicCalls().length).toBeGreaterThan(0))

    await user.click(screen.getByRole('button', { name: '列出用户' }))
    await screen.findByText('ada@example.com')

    // 登录前：受保护那一格点了就是失败（假出口回 401）
    await user.click(screen.getByRole('button', { name: '受保护 GET' }))
    await waitFor(() => expect(cellText('受保护 GET')).toContain('未登录'))

    await user.click(screen.getByRole('button', { name: '以此账号登录' }))

    // 登录结果上屏：状态与分钟数（值不上屏，见下一条用例）
    expect(await screen.findByText(/已登录 ada@example\.com/)).toBeInTheDocument()
    expect(screen.getByText(/有效期 60 分钟/)).toBeInTheDocument()
    const loginCall = vi.mocked(transportFetch).mock.calls.find(([url]) => String(url).includes('/test/login/web'))!
    expect(JSON.parse(String(loginCall[1]?.body))).toEqual({ user: 'ada@example.com' })

    // 受保护那一格：假出口在登录前回 401，登录后回 200 —— 状态来自这次登录的结果
    await user.click(screen.getByRole('button', { name: '受保护 GET' }))
    await waitFor(() => expect(cellText('受保护 GET')).toContain(MESSAGE))
    expect(cellText('受保护 GET')).not.toContain('未登录')
  })

  it('signs out through the engine, since only the server can clear an HttpOnly cookie', async () => {
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      if (target.includes('/.well-known/yao')) return json(SERVICE)
      if (target.includes('/test/users')) return json(userPage(['ada@example.com']))
      if (target.includes('/test/login/web')) return json(LOGIN)
      if (target.includes('/user/logout')) return json({ message: 'Logout successful' })
      return json({ MESSAGE, SERVER_TIME: '2026-01-01T00:00:00Z' })
    })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(publicCalls().length).toBeGreaterThan(0))

    await user.click(screen.getByRole('button', { name: '列出用户' }))
    await screen.findByText('ada@example.com')
    expect(screen.queryByRole('button', { name: '退出登录' })).toBeNull() // 未登录时不给退出按钮

    await user.click(screen.getByRole('button', { name: '以此账号登录' }))
    expect(await screen.findByText(/已登录 ada@example\.com/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '退出登录' }))
    expect(await screen.findByText(/已退出/)).toBeInTheDocument()
    // 退出后不再算登录态：已登录那行与退出按钮都应当消失
    expect(screen.queryByText(/已登录/)).toBeNull()
    expect(screen.queryByRole('button', { name: '退出登录' })).toBeNull()
    const sent = vi.mocked(transportFetch).mock.calls.find(([url]) => String(url).includes('/user/logout'))
    expect(sent?.[1]?.method).toBe('POST')
    expect(document.body.textContent).not.toContain(LOGIN.access_token) // 凭据值永不上屏
  })

    it('marks a protected cell as authenticated but not authorized when the engine policy denies it', async () => {
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      if (target.includes('/.well-known/yao')) return json(SERVICE)
      if (target.includes('/test/users')) return json(userPage(['ada@example.com']))
      if (target.includes('/test/login/web')) return json(LOGIN)
      // 已登录也照拒：引擎侧的授权策略，403 forbidden + reason
      if (target.includes('/helloworld/protected')) {
        return json({ error: 'forbidden', reason: 'no match, default policy: deny' }, 403)
      }
      return json({ MESSAGE, SERVER_TIME: '2026-01-01T00:00:00Z' })
    })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(publicCalls().length).toBeGreaterThan(0))

    await user.click(screen.getByRole('button', { name: '列出用户' }))
    await screen.findByText('ada@example.com')

    // 还没登录：这一格仍然是"预期失败"
    await user.click(screen.getByRole('button', { name: '受保护 GET' }))
    await waitFor(() => expect(cellText('受保护 GET')).toContain('未登录'))
    expect(cellText('受保护 GET')).not.toContain('已认证但未被授权')

    await user.click(screen.getByRole('button', { name: '以此账号登录' }))
    expect(await screen.findByText(/已登录 ada@example\.com/)).toBeInTheDocument()

    // 登录成功但带凭据仍被拒：标注换成"已认证但未被授权"，并附上引擎给的 reason
    await user.click(screen.getByRole('button', { name: '受保护 GET' }))
    await waitFor(() => expect(cellText('受保护 GET')).toContain('已认证但未被授权'))
    expect(cellText('受保护 GET')).not.toContain('no match, default policy: deny') // 引擎原文不上屏
    expect(cellText('受保护 GET')).not.toContain('未登录')
  })

  it('never puts a credential value on screen', async () => {
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      if (target.includes('/.well-known/yao')) return json(SERVICE)
      if (target.includes('/test/users')) return json(userPage(['ada@example.com']))
      if (target.includes('/test/login/web') || target.includes('/test/login/token')) return json(LOGIN)
      return json({ error: 'unauthorized', error_description: 'login is not wired' }, 401)
    })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(publicCalls().length).toBeGreaterThan(0))

    await user.click(screen.getByRole('button', { name: '列出用户' }))
    await screen.findByText('ada@example.com')
    await user.click(screen.getByRole('button', { name: '以此账号登录' }))
    expect(await screen.findByText(/已登录 ada@example\.com/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '只取登录凭据' }))
    expect(await screen.findByText(/已取得登录凭据/)).toBeInTheDocument()

    // 安全断言：假出口返回的凭据串一个都没上屏，上屏的只有长度
    const body = document.body.textContent ?? ''
    for (const secret of [SESSION, ID_TOKEN, ACCESS, REFRESH]) expect(body).not.toContain(secret)
    expect(body).toContain(`长度 ${ACCESS.length}`)
  })
})
