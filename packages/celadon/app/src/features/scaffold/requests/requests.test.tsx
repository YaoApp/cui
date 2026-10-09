/* **这一页的页面级用例**：钉住**调用点**的接线（不只是那些纯函数）。
 *
 * 与 `requests 页` 同一套写法：mock 平台层、挂真页面、断言关键行为。
 * 这里连 `@/platform/transport/fetch` 一起换掉 —— 于是走的是**真的 `send`**：
 * 服务信息（`/.well-known/yao`）→ 地址（service.endpoint）→ 出口（transportFetch）→ 解包裹（unwrap）；
 * 受保护的两条在假出口上回 401，页面照预期把结果标注成"预期失败"。 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

const capsMock = vi.hoisted(() =>
  vi.fn(() => ({
    clipboard: false,
    files: false,
    notifications: false,
    externalOpen: true,
    serviceAddress: false,
  })),
)
const readAddress = vi.hoisted(() => vi.fn(async () => ({ ok: true as const, value: '' })))
const writeAddress = vi.hoisted(() => vi.fn(async () => ({ ok: true as const, value: '' })))
vi.mock('@/platform/service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/platform/service')>()
  return { ...actual, readServiceAddress: readAddress, writeServiceAddress: writeAddress }
})
vi.mock('@/platform/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/platform/client')>()
  return {
    ...actual,
    // 能力**读时再取**（用例里可改），其余事实照真值
    client: {
      ...actual.client,
      // 动态读数照旧走真值（用例会改偏好），能力读时可换
      get capabilities() { return capsMock() },
      get preferences() { return actual.client.preferences },
      get metadata() { return actual.client.metadata },
    },
  }
})

vi.mock('@/platform/transport/fetch', () => ({ transportFetch: vi.fn() }))

import { transportFetch } from '@/platform/transport/fetch'
import { useThemeStore } from '@/platform/theme/theme.store'
import { RequestsPage } from './requests'

function json(value: unknown, status = 200) {
  return { ok: true as const, value: new Response(JSON.stringify(value), { status }) }
}

/** 公开那条的调用（挂载时四态那节也会打一次，所以按 URL 过滤而不是数次数）。 */
const publicCalls = () =>
  vi.mocked(transportFetch).mock.calls.filter(([url]) => String(url).includes('/helloworld/public'))

/** 结果排里某一格的可见文字（页面用例与拟人脚本同一读法）。 */
const cellText = (label: string) =>
  [...document.querySelectorAll('.requests__cell')]
    .find((el) => el.querySelector('.requests__label')?.textContent === label)?.textContent ?? ''

function renderPage() {
  render(
    <MemoryRouter>
      <RequestsPage />
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
      // 受保护的两条：未登录 → 假出口回 401（页面按码翻成「需要登录」，并标「未登录（缺凭据）」）
      if (target.includes('/helloworld/protected')) {
        return json({ error: 'unauthorized', error_description: 'no credential was sent' }, 401)
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
    // 请求元数据真的来自 i18n：**query 已关闭**，语言只走头
    expect(String(url)).not.toContain('locale=')
    expect(String(url)).not.toContain('accept=')
    expect(new Headers(init?.headers).get('Accept-Language')).toBe('zh-CN')
    expect(new Headers(init?.headers).get('X-Locale')).toBe('zh-CN')
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
      return json({ error: 'unauthorized', error_description: 'no credential was sent' }, 401)
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
    expect(document.querySelector('.requests__state[data-active="true"]')?.textContent).toBe('加载中')

    await screen.findByText(new RegExp(MESSAGE))
    expect(document.querySelector('.requests__state[data-active="true"]')?.textContent).toBe('成功')
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
      expect(document.querySelector('.requests__state[data-active="true"]')?.textContent).toBe('失败'),
    )
    // 数据层按码翻译：`data.error.transport.network`（app/src/locales/zh-CN.json）
        expect(await screen.findByText(/网络不通/)).toBeInTheDocument()
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
      return json({ error: 'unauthorized', error_description: 'no credential was sent' }, 401)
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
          : json({ error: 'unauthorized', error_description: 'no credential was sent' }, 401)
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

    await user.click(screen.getByRole('button', { name: '登录' }))

    // 登录结果上屏：状态与分钟数（值不上屏，见下一条用例）
    expect(await screen.findByText(/已登录 ada@example\.com/)).toBeInTheDocument()
    expect(screen.getByText(/expires 3600/)).toBeInTheDocument()
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

    await user.click(screen.getByRole('button', { name: '登录' }))
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

  it('lets a sign-in follow a sign-out, so the page stops claiming the old one', async () => {
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

  await user.click(screen.getByRole('button', { name: '登录' }))
  expect(await screen.findByText(/已登录 ada@example\.com/)).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '退出登录' }))
  expect(await screen.findByText(/已退出/)).toBeInTheDocument()

  // 再登录：上一次"已退出"必须让位，否则页面在说谎
  await user.click(screen.getByRole('button', { name: '登录' }))
  expect(await screen.findByText(/已登录 ada@example\.com/)).toBeInTheDocument()
  expect(screen.queryByText(/已退出/)).toBeNull()
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

    await user.click(screen.getByRole('button', { name: '登录' }))
    expect(await screen.findByText(/已登录 ada@example\.com/)).toBeInTheDocument()

    // 登录成功但带凭据仍被拒：标注换成"已认证但未被授权"，（引擎原文不上屏）
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
      return json({ error: 'unauthorized', error_description: 'no credential was sent' }, 401)
    })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(publicCalls().length).toBeGreaterThan(0))

    await user.click(screen.getByRole('button', { name: '列出用户' }))
    await screen.findByText('ada@example.com')
    await user.click(screen.getByRole('button', { name: '登录' }))
    expect(await screen.findByText(/已登录 ada@example\.com/)).toBeInTheDocument()

    // 安全断言：假出口返回的凭据串一个都没上屏，上屏的只有长度
    const body = document.body.textContent ?? ''
    for (const secret of [SESSION, ID_TOKEN, ACCESS, REFRESH]) expect(body).not.toContain(secret)
    expect(body).toContain(`access ${ACCESS.length}`)
  })
})

describe('the service address, which only a client holds', () => {
  it('is not rendered in a browser', async () => {
    renderPage()
    await waitFor(() => expect(publicCalls().length).toBeGreaterThan(0))
    expect(document.querySelector('input[aria-label]')).toBeNull()
  })

  it('reads the address the host holds, and saves a typed one', async () => {
    capsMock.mockReturnValue({
      clipboard: false,
      files: false,
      notifications: false,
      externalOpen: true,
      serviceAddress: true,
    })
    readAddress.mockResolvedValue({ ok: true, value: 'http://host:5099' })
    writeAddress.mockResolvedValue({ ok: true, value: 'http://typed:5099' })
    renderPage()

    const input = await screen.findByLabelText('服务地址')
    // 地址**不在进来时偷偷读**（不在 useEffect 取数）：点"读当前地址"这个动作才知道
    fireEvent.click(screen.getByText('读当前地址'))
    await waitFor(() => expect((input as HTMLInputElement).value).toBe('http://host:5099'))

    fireEvent.change(input, { target: { value: 'http://typed:5099' } })
    fireEvent.click(screen.getByText('校验并写入'))
    await waitFor(() => expect(writeAddress).toHaveBeenCalledWith('http://typed:5099'))
  })
})

/* 换地址 = 换服务：新服务还没请求，屏上**不许**留着旧服务的结果（2026-10-04 复核要求钉住）。 */
describe('saving a new service address', () => {
  it('drops the results the old service produced', async () => {
    capsMock.mockReturnValue({
      clipboard: false,
      files: false,
      notifications: false,
      externalOpen: true,
      serviceAddress: true,
    })
    writeAddress.mockResolvedValue({ ok: true, value: 'http://typed:5099' })
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      if (target.includes('/.well-known/yao')) return json(SERVICE)
      return json({ MESSAGE, SERVER_TIME: '2026-01-01T00:00:00Z' })
    })
    renderPage()

    // 先让公开 GET 真跑出结果（假出口回了 MESSAGE）
    await waitFor(() => expect(publicCalls().length).toBeGreaterThan(0))
    await waitFor(() => expect(document.body.textContent ?? '').toContain(MESSAGE))

    const input = await screen.findByLabelText('服务地址')
    fireEvent.change(input, { target: { value: 'http://typed:5099' } })
    fireEvent.click(screen.getByText('校验并写入'))
    await waitFor(() => expect(writeAddress).toHaveBeenCalledWith('http://typed:5099'))

    // 旧结果必须从屏上消失（不清就是"换服务后还在宣称旧数据"）
    await waitFor(() => expect(document.body.textContent ?? '').not.toContain(MESSAGE))
  })
})
