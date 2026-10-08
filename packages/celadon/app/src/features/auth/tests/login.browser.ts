import { join } from 'node:path'
import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { capturePage, shotDir } from '../../../../../scripts/shots.mjs'

/* 登录页的真实渲染：入口配置、验证码图与入口判定都来自开发服务，因此这一层同时充当活体走查。
   只打桩"失败路径"与需要口令的那一段：邮件口令是服务端发给用户的，接口读不到。 */
const SHOTS = shotDir('login-page')
const shot = (page: Page, name: string) => capturePage(page, join(SHOTS, `${name}.png`))

/* 依赖真实服务的用例先探一下：服务不在（例如 CI 只起了前端）就整条跳过，不当失败。
   探入口配置，它同时说明服务信息与入口一线都可用。
   **必须要求 JSON**：没有配代理时（`YAO_SERVER_HOST` 没给）开发服务的 SPA 回退会拿 `index.html`
   回一个 200，只看状态码会把「服务不可达」当成可用，用例随后挂在等表单上。 */
async function hasLiveService(request: APIRequestContext): Promise<boolean> {
  try {
    const response = await request.get('/v1/user/entry?locale=zh-CN')
    return response.ok() && (response.headers()['content-type'] ?? '').includes('application/json')
  } catch {
    return false
  }
}

/* 服务信息统一打桩：真实部署里它就是宿主或站点给的一份固定应答，测试没有理由依赖它的可达性。
   **缺这一条会让入口配置的请求发不出去**：基址来自它，页面于是永远停在加载态 ——
   CI 上只有前端时正是如此，表现为一批用例超时（本地有后端，看不出来）。 */
test.beforeEach(async ({ page }) => {
  await page.route('**/.well-known/yao', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: 'development', version: '0.0.0', openapi: '/v1' }),
    }),
  )
})

test('renders the entry configuration, the account field and the provider rows', async ({ page, request }) => {
  test.skip(!(await hasLiveService(request)), 'the development service is not reachable')
  await page.goto('/app/login')

  const title = page.getByRole('heading', { level: 1 })
  await expect(title).toBeVisible()
  await expect(page.getByLabel('邮箱或手机号')).toBeVisible()
  await expect(page.locator('.auth__card button[type="submit"]')).toHaveText('下一步')

  /* 人机验证在点「下一步」之后单独一步给出：进入页面时卡片里只有第三方、字段、协议与主操作 */
  await expect(page.locator('.captcha-field')).toHaveCount(0)
  await expect(page.locator('.provider-list__item').first()).toBeVisible()

  /* 进入页面不给任何输入框焦点：草稿里没有自动聚焦 */
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? '')
  expect(['BODY', 'HTML']).toContain(focusedTag)

  /* 按钮是原生 `<button>`：组件必须把字族接过来，否则切语言后按钮里的字掉回浏览器默认族 */
  const fonts = await page.evaluate(() => {
    const scope = getComputedStyle(document.body).fontFamily
    const button = document.querySelector('.auth__card button[type="submit"]') as HTMLElement
    const field = document.querySelector('.login__form .input') as HTMLElement
    return { scope, button: getComputedStyle(button).fontFamily, field: getComputedStyle(field).fontFamily }
  })
  expect(fonts.button).toBe(fonts.scope)
  expect(fonts.field).toBe(fonts.scope)

  /* 同意条款属于注册行为：登录页不出现这一行（它在注册页上，那一页的用例量它的取值） */
  expect(await page.locator('.terms-note').count()).toBe(0)

  await shot(page, 'account-step')
})

test('switches the visible wording with the language', async ({ page, request }) => {
  test.skip(!(await hasLiveService(request)), 'the development service is not reachable')
  await page.goto('/app/login')
  const submit = page.locator('.auth__card button[type="submit"]')
  await expect(submit).toHaveText('下一步')

  /* 语言分栈要真的进到原生控件里：切到日文后按钮的字族应出现日文字体 */
  const buttonFont = () => submit.evaluate((el) => getComputedStyle(el).fontFamily)

  /* 语言控件在卡片右上角：切到 english 之后按钮文案真的换内容，不只是字体 */
  await page.locator('.select-trigger.locale-switch').first().click()
  await page.getByRole('option', { name: 'English' }).click()
  await expect(submit).toHaveText('Next')

  await page.locator('.select-trigger.locale-switch').first().click()
  await page.getByRole('option', { name: '日本語' }).click()
  /* 语言切换要等应用把配置与语言都换到位：轮询到日文字族出现为止 */
  await expect.poll(buttonFont, { timeout: 10000 }).toContain('Hiragino')
  /* 与作用域同一个字族：说明按钮没有掉回浏览器默认族 */
  const scopeFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
  expect(await buttonFont()).toBe(scopeFont)

  await shot(page, 'english')
})

test('shows the failure note from the language pack when the account judgement fails', async ({ page }) => {
  /* 这一条要走到"判定失败"，因此把入口配置也换成不带图形验证码的一份：
     真实配置要求人机验证，而验证码是一次性的，不适合拿来做断言。 */
  /* 通配要盖住子路径：`*` 不跨 `/`，只用 `*` 会漏掉 `/entry/verify` 而打到真服务，
     那样用例会"因为真服务的错误码恰好同形"而通过，属假通过。 */
  await page.route('**/v1/user/entry**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/entry')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          title: '欢迎使用 Yao Agents',
          description: '请输入邮箱以继续',
          success_url: '/app/done',
          form: {
            username: { placeholder: '请输入邮箱' },
            password: { placeholder: '登录密码' },
            terms_of_service_link: 'https://example.com/terms',
            privacy_policy_link: 'https://example.com/privacy',
          },
          third_party: { providers: [] },
        }),
      })
    }
    if (path.endsWith('/entry/verify')) {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_request', error_description: 'the request body is not acceptable' }),
      })
    }
    return route.fallback()
  })
  await page.goto('/app/login')
  await page.getByLabel('邮箱或手机号').fill('max@example.com')
  const heightBefore = await page.locator('.auth__card').evaluate((el) => (el as HTMLElement).offsetHeight)
  await page.locator('.auth__card button[type="submit"]').click()

  /* 失败落在**账号字段**上（表单的错误提示），不是页面顶端的通知条；
     文案取语言包，不用服务端的诊断原文。 */
  const error = page.locator('#auth-account ~ .field__message, .login__form .field__message').first()
  await expect(error).toBeVisible()
  await expect(error).toHaveText('请求不合法')
  await expect(error).not.toHaveText(/request body is not acceptable/)
  await expect(page.locator('.status-notice--danger')).toHaveCount(0)
  /* 消息位预留了一行：错误出现时卡片高度不变，按钮不会被挪走 */
  expect(await page.locator('.auth__card').evaluate((el) => (el as HTMLElement).offsetHeight)).toBe(heightBefore)

  await shot(page, 'verify-failure')
})

test('opens the password step in the dialog for an account that exists, drawn from the tokens', async ({ page }) => {
  /* 判定走桩：这一条核的是「账号存在」这一支的界面与取值，不是真服务的判定 */
  await page.route('**/v1/user/entry**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/entry')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          title: '欢迎使用 Yao Agents',
          description: '请输入邮箱以继续',
          success_url: '/app/done',
          secure_cookie: false,
          form: {
            username: { placeholder: '请输入邮箱' },
            password: { placeholder: '登录密码' },
            remember_me: true,
            terms_of_service_link: 'https://example.com/terms',
          },
          third_party: { providers: [] },
        }),
      })
    }
    if (path.endsWith('/entry/verify')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'login',
          access_token: 'temp-login',
          expires_in: 900,
          token_type: 'Bearer',
          scope: 'entry',
          user_exists: true,
        }),
      })
    }
    return route.fallback()
  })

  await page.goto('/app/login')
  await page.getByLabel('邮箱或手机号').fill('max@example.com')
  await page.locator('.auth__card button[type="submit"]').click()

  /* 这一份配置不要求验证码，因此判定直接跑完：验证通过后回到页面，邮箱锁定、出现密码表单 */
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const locked = page.locator('#auth-account-locked')
  await expect(locked).toBeVisible()
  await expect(locked).toHaveAttribute('readonly', '')
  await expect(page.getByPlaceholder('登录密码')).toBeVisible()
  await expect(page.getByRole('checkbox', { name: '记住我' })).toBeVisible()
  await expect(page.locator('.auth__card button[type="submit"]')).toHaveText('登录')

  /* 「修改」叠在账号字段的右端：字段长度与密码字段一致，按钮浮在它上面、不占它的宽度 */
  const change = page.getByRole('button', { name: '修改' })
  await expect(change).toBeVisible()

  const slot = await page.evaluate(() => {
    const field = document.querySelector('#auth-account-locked')?.closest('.field__box') as HTMLElement
    const password = document.querySelector('#auth-password')?.closest('.field__box') as HTMLElement
    const button = document.querySelector('.locked-account button') as HTMLElement
    const fieldBox = field.getBoundingClientRect()
    const passwordBox = password.getBoundingClientRect()
    const buttonBox = button.getBoundingClientRect()
    const style = getComputedStyle(button)
    return {
      小档: button.classList.contains('button--small'),
      反色: button.classList.contains('button--inverse'),
      底色: style.backgroundColor,
      反色token: getComputedStyle(document.body).getPropertyValue('--background-inverse').trim(),
      字号: style.fontSize,
      按钮高: Math.round(buttonBox.height),
      账号框宽: Math.round(fieldBox.width),
      密码框宽: Math.round(passwordBox.width),
      叠在框内:
        buttonBox.right <= fieldBox.right + 1 &&
        buttonBox.top >= fieldBox.top &&
        buttonBox.bottom <= fieldBox.bottom,
      右边距: Math.round(fieldBox.right - buttonBox.right),
      上边距: Math.round(buttonBox.top - fieldBox.top),
      下边距: Math.round(fieldBox.bottom - buttonBox.bottom),
      中心差: Math.round(((buttonBox.top + buttonBox.bottom) / 2 - (fieldBox.top + fieldBox.bottom) / 2) * 10) / 10,
    }
  })
  expect(slot.小档).toBe(true)
  expect(slot.反色).toBe(true)
  /* token 给的是十六进制，计算值给的是 rgb()：归一化后按同一颜色比 */
  const rgbOf = (hex: string) => {
    const value = Number.parseInt(hex.replace('#', ''), 16)
    return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`
  }
  expect(slot.底色).toBe(rgbOf(slot.反色token))
  expect(slot.字号).toBe('12px')
  expect(slot.按钮高).toBe(24)
  /* 输入框长度不变：与密码字段一样宽（按钮叠上去，不占宽度） */
  expect(slot.账号框宽).toBe(slot.密码框宽)
  /* 按钮叠在框内，四个方向的留白一致（右边距与上下相同），且对本体居中 */
  expect(slot.叠在框内).toBe(true)
  expect(slot.右边距).toBe(slot.上边距)
  expect(slot.右边距).toBe(slot.下边距)

  /* 账号与密码是同一组输入：间距取标准的一个档，锁定行那个只读字段的消息位不预留 */
  const group = await page.evaluate(() => {
    const account = document.querySelector('#auth-account-locked')?.closest('.field__box') as HTMLElement
    const password = document.querySelector('#auth-password')?.closest('.field__box') as HTMLElement
    const lockedMessage = document.querySelector('.locked-account .field__message') as HTMLElement
    return {
      账号到密码: Math.round(password.getBoundingClientRect().top - account.getBoundingClientRect().bottom),
      锁定行消息位: lockedMessage.offsetHeight,
      锁定行消息位显示: getComputedStyle(lockedMessage).display,
    }
  })
  expect(group.账号到密码).toBe(16)
  expect(group.锁定行消息位).toBe(0)
  expect(group.锁定行消息位显示).toBe('none')
  expect(Math.abs(slot.中心差)).toBeLessThanOrEqual(1)

  /* 密码的可见性切换是标准图标按钮：小档方形，四周留白一致（右边距与上下相同），不被拉满整格 */
  const eye = await page.evaluate(() => {
    const field = document.querySelector('#auth-password')?.closest('.field__box') as HTMLElement
    const toggle = document.querySelector('.password-input__toggle') as HTMLElement
    const fieldBox = field.getBoundingClientRect()
    const toggleBox = toggle.getBoundingClientRect()
    return {
      宽高: `${Math.round(toggleBox.width)}×${Math.round(toggleBox.height)}`,
      右边距: Math.round(fieldBox.right - toggleBox.right),
      上边距: Math.round(toggleBox.top - fieldBox.top),
      下边距: Math.round(fieldBox.bottom - toggleBox.bottom),
      圆角: getComputedStyle(toggle).borderTopLeftRadius,
      圆角token: getComputedStyle(document.body).getPropertyValue('--radius-xs').trim(),
    }
  })
  expect(eye.宽高).toBe('24×24')
  expect(eye.右边距).toBe(eye.上边距)
  expect(eye.右边距).toBe(eye.下边距)
  expect(eye.圆角).toBe(eye.圆角token)

  /* 记住我这一行与主按钮之间留出一个档：它的悬停表面向上下各伸 4，贴太近会压在按钮上 */
  const gap = await page.evaluate(() => {
    const row = document.querySelector('.login__form .checkbox__row') as HTMLElement
    const button = document.querySelector('.auth__card button[type="submit"]') as HTMLElement
    const password = document.querySelector('#auth-password') as HTMLElement
    const rowBox = row.getBoundingClientRect()
    const buttonBox = button.getBoundingClientRect()
    const passwordBox = password.getBoundingClientRect()
    return {
      到按钮: Math.round(buttonBox.top - rowBox.bottom),
      离字段: Math.round(rowBox.top - passwordBox.bottom),
    }
  })
  expect(gap.到按钮).toBeGreaterThanOrEqual(16)
  expect(gap.离字段).toBeGreaterThanOrEqual(24)

  /* 勾选行与字段同一左缘：勾选框方框的左边缘应等于字段盒子的左边缘 */
  const align = await page.evaluate(() => {
    const field = document.querySelector('#auth-password')?.closest('.field__box') as HTMLElement
    const box = document.querySelector('.login__form .checkbox__box') as HTMLElement
    const row = document.querySelector('.login__form .checkbox__row') as HTMLElement
    const surface = getComputedStyle(row, '::before')
    return {
      方框相对字段: Math.round(box.getBoundingClientRect().left - field.getBoundingClientRect().left),
      方框相对行: Math.round(box.getBoundingClientRect().left - row.getBoundingClientRect().left),
      行内距: getComputedStyle(row).paddingInlineStart,
      表面内缩: `${surface.insetInlineStart} / ${surface.insetInlineEnd}`,
    }
  })
  expect(align.方框相对字段).toBe(0)
  expect(align.方框相对行).toBe(0)

  await shot(page, 'password-step-locked')

  /* 「点修改回到账号步」这条状态转换由单元用例持住（jsdom 里确定可复现）；
     这里只核它画出来的形态与位置。 */
})

test('sends an account that does not exist to the register form with the account in the query', async ({ page }) => {
  /* 判定走桩：这一条核的是「账号不存在」这一支的结果，不是真服务的判定 */
  await page.route('**/v1/user/entry**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/entry')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          title: '欢迎使用 Yao Agents',
          description: '请输入邮箱以继续',
          success_url: '/app/done',
          secure_cookie: false,
          verification_code_required: true,
          form: {
            username: { placeholder: '请输入邮箱' },
            password: { placeholder: '登录密码' },
            terms_of_service_link: 'https://example.com/terms',
          },
          third_party: { providers: [] },
        }),
      })
    }
    if (path.endsWith('/entry/verify')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'register',
          access_token: 'temp-register',
          expires_in: 900,
          token_type: 'Bearer',
          scope: 'entry',
          user_exists: false,
          verification_sent: true,
          otp_id: 'otp-1',
        }),
      })
    }
    return route.fallback()
  })

  await page.goto('/app/login')
  await page.getByLabel('邮箱或手机号').fill('new-user@example.com')
  await page.locator('.auth__card button[type="submit"]').click()

  /* 账号不存在：跳到注册地址，账号带在查询里，注册页把它锁定展示出来 */
  await expect(page).toHaveURL(/\/app\/register\?username=new-user%40example\.com$/)
  await expect(page.getByLabel('邮箱或手机号')).toHaveValue('new-user@example.com')
  await shot(page, 'register-channel')
})

test('keeps the boundary compliant inside the client and intentionally light on the standalone page', async ({ page, request }) => {
  test.skip(!(await hasLiveService(request)), 'the development service is not reachable')
  /* 主题与语言都会落进本机存储，别的用例切过之后会带进这一条：
     先清掉存储并固定浅色，量到的两档才是这一条要核的静止档。 */
  await page.addInitScript(() => window.localStorage.clear())
  await page.emulateMedia({ colorScheme: 'light' })
  /* 独立访问的边界是**有意弱化**的（与草稿一致：对外入口页追求轻观感，规范里按豁免处理）；
     客户端内是软件内页，边界必须过 WCAG 1.4.11 的 3:1。量的是画出来的描边与它背后的卡片底。 */
  const measure = () =>
    page.evaluate(() => {
      /* 量账号字段：它挂载即聚焦（描边走品牌色），而空值失焦又会触发必填错误（走危险色），
         两种都不是要核的静止档。因此用例先填一个合法账号再让它失焦，量到的才是静止边界。 */
      const input = document.querySelector('.login__form .input') as HTMLInputElement
      const card = document.querySelector('.auth__card') as HTMLElement
      const parse = (value: string) => (value.match(/[\d.]+/g) ?? []).map(Number)
      const luminance = (value: string) => {
        const [r, g, b] = parse(value)
          .slice(0, 3)
          .map((channel) => {
            const part = channel / 255
            return part <= 0.03928 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4
          })
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
      }
      const border = getComputedStyle(input).borderTopColor
      const background = getComputedStyle(card).backgroundColor
      const [one, two] = [luminance(border), luminance(background)]
      return {
        border,
        background,
        focused: document.activeElement === input,
        ratio: (Math.max(one, two) + 0.05) / (Math.min(one, two) + 0.05),
      }
    })

  /** 填一个合法账号并失焦：既避开聚焦描边（走品牌色），也避开空值触发的必填错误描边（走危险色）。
      指针也要移开：上一条用例留下的指针位置可能正落在字段上，悬停档同样不是要核的静止档。 */
  const settle = async () => {
    const field = page.locator('.login__form .input')
    await expect(field).toBeVisible()
    await field.fill('max@example.com')
    await field.blur()
    await page.mouse.move(2, 2)
    await expect(field).not.toBeFocused()
  }

  await page.goto('/app/login')
  await settle()
  /* 描边有过渡：填完值立刻量会读到聚焦色与静止色之间的中间值（实测撞见过 3.378，落在两档之间）。
     先轮询到它落进静止档的范围，再取一次读数用于断言。 */
  await expect.poll(async () => (await measure()).ratio).toBeLessThan(3)
  const standalone = await measure()
  expect(standalone.focused).toBe(false)
  expect(standalone.ratio).toBeLessThan(3)

  await page.goto('/app/login?from=connect')
  await settle()
  await expect.poll(async () => (await measure()).ratio).toBeGreaterThanOrEqual(3)
  const inClient = await measure()
  expect(inClient.ratio).toBeGreaterThanOrEqual(3)

  /* 切主题：先确认真的切过去了，再量第二套 */
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.reload()
  await settle()
  const theme = await page.evaluate(() => document.documentElement.dataset.theme)
  expect(theme).toBe('dark')
  await expect.poll(async () => (await measure()).ratio).toBeGreaterThanOrEqual(3)
  const inClientDark = await measure()
  expect(inClientDark.ratio).toBeGreaterThanOrEqual(3)
  await shot(page, 'dark-in-client')

  console.log('[login] boundary standalone light', standalone.border, 'on', standalone.background, '=', standalone.ratio.toFixed(2))
  console.log('[login] boundary in-client light', inClient.border, 'on', inClient.background, '=', inClient.ratio.toFixed(2))
  console.log('[login] boundary in-client dark', inClientDark.border, 'on', inClientDark.background, '=', inClientDark.ratio.toFixed(2))
})

test('hides the brand and shows the back bar inside the client', async ({ page, request }) => {
  test.skip(!(await hasLiveService(request)), 'the development service is not reachable')
  await page.goto('/app/login?from=connect')
  await expect(page.locator('.auth--in-app')).toBeVisible()
  /* 品牌在 DOM 里但被样式收起；页脚则整块不渲染 */
  await expect(page.locator('.auth__brand')).toBeHidden()
  await expect(page.locator('.auth__bottom')).toHaveCount(0)
  /* 控件移到卡片下方：它的顶边在卡片底边之下 */
  const cardBox = (await page.locator('.auth__card').boundingBox()) ?? { y: 0, height: 0 }
  const ctrlBox = (await page.locator('.auth__ctrl-wrap').boundingBox()) ?? { y: -1, height: 0 }
  expect(ctrlBox.y).toBeGreaterThanOrEqual(cardBox.y + cardBox.height)
  await expect(page.getByRole('button', { name: '返回服务器选择' })).toBeVisible()
  /* 等入口配置到位再截图：客户端栏上的服务器名要等服务信息读回来才有 */
  await expect(page.getByLabel('邮箱或手机号')).toBeVisible()
  const serverName = (await page.locator('.auth__server-name').textContent()) ?? ''
  expect(serverName.trim().length).toBeGreaterThan(0)

  await shot(page, 'in-client')
})

test('keeps the form usable from the keyboard', async ({ page, request }) => {
  test.skip(!(await hasLiveService(request)), 'the development service is not reachable')
  await page.goto('/app/login')
  await page.getByLabel('邮箱或手机号').focus()
  await page.keyboard.press('Tab')
  const focused = await page.evaluate(() => document.activeElement?.className ?? '')
  expect(focused).not.toBe('')
  await page.keyboard.press('Enter')
  /* 空表单回车不提交：仍然停在账号步，并给出字段级提示 */
  await expect(page.locator('.hint-error').first()).toBeVisible()
})

test('walks the captcha step against the live service, driven by the captcha type in its configuration', async ({ page, request }) => {
  test.skip(!(await hasLiveService(request)), 'the development service is not reachable')

  /* 这一条读真服务的入口配置：它声明哪种验证码（`image` 还是 `turnstile`），弹窗里就该出现哪个控件。
     两种控件的令牌都走判定的 `captcha` 字段，因此这里只核「按配置选控件」与「没令牌就不判定」。
     配置要读**应用自己收到的那一份**：同一条地址换语言或换来源会给出不同结果，拿测试自己发的请求去判会判错。 */
  let appCaptchaType: string | undefined
  page.on('response', (received) => {
    const url = received.url()
    if (!url.includes('/user/entry') || url.includes('/user/entry/')) return
    void received
      .json()
      .then((body: unknown) => {
        appCaptchaType = (body as { form?: { captcha?: { type?: string } } }).form?.captcha?.type
      })
      .catch(() => undefined)
  })

  let verifySent = false
  page.on('request', (sent) => {
    if (sent.url().includes('/user/entry/verify')) verifySent = true
  })

  await page.goto('/app/login')
  await expect(page.getByLabel('邮箱或手机号')).toBeVisible()
  /* 进入页面不收验证码：这一步在点「下一步」之后的弹窗里 */
  await expect(page.locator('.captcha-field')).toHaveCount(0)
  await expect(page.locator('.turnstile-field')).toHaveCount(0)
  expect(appCaptchaType === 'image' || appCaptchaType === 'turnstile').toBe(true)

  const account = `walk-${Date.now()}@example.com`
  await page.getByLabel('邮箱或手机号').fill(account)
  await page.locator('.auth__card button[type="submit"]').click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.dialog__title')).toHaveText('输入图形验证码')
  if (appCaptchaType === 'image') {
    await expect(dialog.locator('.captcha-field')).toBeVisible()
    await expect(dialog.locator('.turnstile-field')).toHaveCount(0)
    await shot(page, 'live-walk-captcha-step')

    /* 没有令牌直接提交：不发判定请求，只在弹窗里给字段级提示 */
    await dialog.getByRole('button', { name: '确定' }).click()
    await expect(dialog.locator('.login__dialog-form .hint-error')).toBeVisible()
    expect(verifySent).toBe(false)
  } else {
    /* 人机验证的控件在页面里是 iframe，令牌由它自己给（测试环境用 Cloudflare 的 dummy 站点密钥）。
       提交与判定的整条路径由测试环境上的 `cui-testing/instance-config/walk.mjs` 走查，这里只核控件按配置渲染。 */
    await expect(dialog.locator('.turnstile-field')).toBeVisible()
    await expect(dialog.locator('.captcha-field')).toHaveCount(0)
    await shot(page, 'live-walk-captcha-step')
  }
  console.log('[login] live walk saw captcha type', appCaptchaType, 'for', account)
})

test('walks two rounds of the captcha, each with a fresh code', async ({ page }) => {
  /* 判定通过后回到页面上的密码步；点「修改」回账号步再来一轮。
     两轮的图形验证码与 captcha_id 必须都是新的：一次性令牌不许复用（复用的那枚会被服务端拒绝，
     界面又留在验证码步，读起来就是"循环"）。 */
  const bodies: { captcha?: string; captcha_id?: string }[] = []
  await page.route('**/v1/user/entry**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/entry')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Sign up or sign in',
          description: 'Enter your account',
          success_url: '/app/done',
          secure_cookie: false,
          form: {
            username: { placeholder: 'Enter your email' },
            password: { placeholder: '登录密码' },
            captcha: { type: 'image' },
          },
          third_party: { providers: [] },
        }),
      })
    }
    if (path.endsWith('/entry/captcha')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ captcha_id: `id-${bodies.length.toString()}`, captcha_image: '', expires_in: 600 }),
      })
    }
    if (path.endsWith('/entry/verify')) {
      bodies.push(route.request().postDataJSON() as { captcha?: string; captcha_id?: string })
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'login',
          access_token: 'temp-token',
          expires_in: 600,
          token_type: 'Bearer',
          scope: 'builtin:entry:verification',
          user_exists: true,
        }),
      })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  await page.goto('/app/login')
  await page.getByLabel('邮箱或手机号').fill('max@example.com')
  await page.locator('.auth__card button[type="submit"]').click()

  /* 第一轮 */
  const first = page.getByRole('dialog')
  await expect(first).toBeVisible()
  /* 打开即聚焦到输入框：能直接打字，不必先点一下 */
  await expect(first.locator('.captcha-field input').first()).toBeFocused()
  await first.locator('.captcha-field input').first().fill('abcd')
  await first.getByRole('button', { name: '确定' }).click()
  await expect(page.locator('#auth-account-locked')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  /* 点「修改」回账号步。这里必须是**真实点击**：曾经因为失焦即校验会把错误行插进来、
     按钮在按下与松开之间被挪走，导致这一次点击丢失（`click` 事件根本不发生）。 */
  await page.getByRole('button', { name: '修改' }).click()
  await expect(page.locator('#auth-account')).toBeVisible()
  await expect(page.locator('#auth-account-locked')).toHaveCount(0)

  /* 第二轮 */
  await page.locator('.auth__card button[type="submit"]').click()
  const second = page.getByRole('dialog')
  await expect(second).toBeVisible()
  await second.locator('.captcha-field input').first().fill('efgh')
  await second.getByRole('button', { name: '确定' }).click()
  await expect(page.locator('#auth-account-locked')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  /* 两轮交出的是两枚不同的令牌与两个不同的 captcha_id */
  expect(bodies).toHaveLength(2)
  expect(bodies[0]?.captcha).toBe('abcd')
  expect(bodies[1]?.captcha).toBe('efgh')
  expect(bodies[0]?.captcha_id).not.toBe(bodies[1]?.captcha_id)
})

test('refetches the entry configuration when the language changes', async ({ page }) => {
  /* 入口配置**按语言**给：同一份接口，不同语言返回不同的验证码形态与占位文字。
     因此取配置的一方必须真的订阅语言，切语言时读接口的 key 才会变、才会重取。 */
  await page.route('**/v1/user/entry**', (route) => {
    const url = new URL(route.request().url())
    if (!url.pathname.endsWith('/entry')) return route.fallback()
    const english = (url.searchParams.get('locale') ?? '').startsWith('en')
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        title: english ? 'Sign up or sign in' : '注册或登录',
        description: english ? 'Enter your account' : '请输入账号',
        success_url: '/app/done',
        secure_cookie: false,
        form: {
          username: { placeholder: english ? 'Your email' : '你的邮箱' },
          password: { placeholder: english ? 'Your password' : '登录密码' },
          captcha: english
            ? { type: 'turnstile', options: { sitekey: '1x00000000000000000000AA' } }
            : { type: 'image' },
        },
        third_party: { providers: [] },
      }),
    })
  })

  await page.goto('/app/login')
  await expect(page.getByPlaceholder('你的邮箱')).toBeVisible()

  /* 中文这一份是图形验证码：弹窗里应当是取图的那个控件 */
  await page.getByLabel('邮箱或手机号').fill('max@example.com')
  await page.locator('.auth__card button[type="submit"]').click()
  await expect(page.getByRole('dialog').locator('.captcha-field')).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: '取消' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  /* 切到 English：占位文字与验证码形态都跟着新配置走，页面不刷新 */
  const trigger = page.locator('.select-trigger.locale-switch').first()
  await trigger.click()
  await page.getByRole('option', { name: 'English' }).click()
  await expect(page.getByPlaceholder('Your email')).toBeVisible()

  await page.locator('.auth__card button[type="submit"]').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.turnstile-field')).toBeVisible()
  await expect(dialog.locator('.captcha-field')).toHaveCount(0)

  /* 控件由脚本异步画进来：先有加载指示，控件出现后撤掉 */
  await expect(dialog.locator('.turnstile-field__loading')).toHaveCount(1)
  await expect(dialog.locator('.turnstile-field__loading')).toHaveCount(0, { timeout: 15_000 })

  /* 错误位常驻一行（此刻没有错误文案），弹窗高度因此不随错误出现而变化 */
  const frame = await page.evaluate(() => {
    const field = document.querySelector('.turnstile-field') as HTMLElement
    const widget = document.querySelector('.turnstile-field__widget') as HTMLElement
    const error = document.querySelector('.turnstile-field__error') as HTMLElement
    const child = widget.firstElementChild as HTMLElement | null
    const widgetBox = widget.getBoundingClientRect()
    const childBox = child?.getBoundingClientRect()
    return {
      错误位高: error.offsetHeight,
      错误文案: error.textContent,
      控件子节点: child === null ? 'none' : child.tagName,
      控件居中差: childBox === undefined ? -1 : Math.round((childBox.left + childBox.right) / 2 - (widgetBox.left + widgetBox.right) / 2),
      框高: Math.round(field.getBoundingClientRect().height),
    }
  })
  expect(frame.错误位高).toBe(18)
  expect(frame.错误文案).toBe('')
  expect(frame.控件子节点).not.toBe('none')
  expect(Math.abs(frame.控件居中差)).toBeLessThanOrEqual(1)
})

test('a judgement in flight locks the dialog alone, not the form under it', async ({ page }) => {
  /* 判定属于弹窗里那一步：它在飞的时候只该锁弹窗里的控件。
     曾经它算进页面级的进行中开关，于是下面的「下一步」被置灰、回来又恢复，
     看上去像整块表单刷新了一下。这里用延迟返回把那一瞬间留住，逐个量。 */
  let release = () => undefined as void
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/v1/user/entry**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/entry')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Sign up or sign in',
          description: 'Enter your account',
          success_url: '/app/done',
          secure_cookie: false,
          form: {
            username: { placeholder: '请输入邮箱' },
            password: { placeholder: '登录密码' },
            captcha: { type: 'image' },
          },
          third_party: { providers: [] },
        }),
      })
    }
    if (path.endsWith('/entry/captcha')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ captcha_id: 'id-0', captcha_image: '', expires_in: 600 }),
      })
    }
    if (path.endsWith('/entry/verify')) {
      await held
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_request', error_description: 'Captcha verification failed: invalid captcha' }),
      })
    }
    return route.fallback()
  })

  await page.goto('/app/login')
  await page.getByLabel('邮箱或手机号').fill('max@example.com')
  const pageButton = page.locator('.auth__card button[type="submit"]')
  await pageButton.click()
  await page.locator('.captcha-field input').first().fill('abcd')
  await page.getByRole('dialog').getByRole('button', { name: '确定' }).click()

  /* 判定在飞：弹窗里的确定禁用（它只管弹窗自身），弹窗下面的「下一步」不受影响 */
  const hold = await page.evaluate(() => {
    const dialogButton = document.querySelector('.dialog__foot button:last-child') as HTMLButtonElement
    const formButton = document.querySelector('.auth__card button[type="submit"]') as HTMLButtonElement
    return { dialogDisabled: dialogButton.disabled, formDisabled: formButton.disabled, formOpacity: getComputedStyle(formButton).opacity, cardHeight: (document.querySelector('.auth__card') as HTMLElement).offsetHeight }
  })
  expect(hold.dialogDisabled).toBe(true)
  expect(hold.formDisabled).toBe(false)
  expect(hold.formOpacity).toBe('1')

  release()
  await expect(page.getByRole('dialog').locator('.field__message')).toHaveText('验证码不正确，请重新输入')
  /* 失败后弹窗下面的表单不变：按钮既没禁用，高度也没动 */
  expect(await page.evaluate(() => (document.querySelector('.auth__card button[type="submit"]') as HTMLButtonElement).disabled)).toBe(false)
  expect(await page.evaluate(() => (document.querySelector('.auth__card') as HTMLElement).offsetHeight)).toBe(hold.cardHeight)
})

test('a judgement closed mid-flight is treated as not verified', async ({ page }) => {
  /* 判定还没回来就把弹窗关掉（这里是按「取消」）：当作没验证过 —— 不切步骤、不碰页面。 */
  let release = () => undefined as void
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/v1/user/entry**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/entry')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Sign up or sign in',
          description: 'Enter your account',
          success_url: '/app/done',
          secure_cookie: false,
          form: {
            username: { placeholder: '请输入邮箱' },
            password: { placeholder: '登录密码' },
            captcha: { type: 'image' },
          },
          third_party: { providers: [] },
        }),
      })
    }
    if (path.endsWith('/entry/captcha')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ captcha_id: 'id-0', captcha_image: '', expires_in: 600 }),
      })
    }
    if (path.endsWith('/entry/verify')) {
      await held
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'login',
          access_token: 'temp-token',
          expires_in: 600,
          token_type: 'Bearer',
          scope: 'builtin:entry:verification',
          user_exists: true,
        }),
      })
    }
    return route.fallback()
  })

  await page.goto('/app/login')
  await page.getByLabel('邮箱或手机号').fill('max@example.com')
  await page.locator('.auth__card button[type="submit"]').click()
  await page.locator('.captcha-field input').first().fill('abcd')
  await page.getByRole('dialog').getByRole('button', { name: '确定' }).click()
  /* 判定发出后立刻关掉弹窗 */
  await page.getByRole('dialog').getByRole('button', { name: '取消' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  release()
  await page.waitForTimeout(600)
  /* 判定返回的是「通过」，但弹窗已经关了：仍然停在账号步，邮箱不锁定 */
  await expect(page.locator('#auth-account')).toBeVisible()
  await expect(page.locator('#auth-account-locked')).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('walks a third-party sign-in through the callback page when the instance declares the test provider', async ({
  page,
  request,
}) => {
  test.skip(!(await hasLiveService(request)), 'the development service is not reachable')
  /* 第三方登录的活体走查要一个不经过外部身份提供方的提供方：实例里声明了 id 为 `test` 的那一个
     （端点指向开发机上的 mock，见工作区 `cui-testing/oauth-mock/`）才跑，别的环境按跳过处理。 */
  const entry = await request.get('/v1/user/entry?locale=zh-CN')
  const config = (await entry.json()) as { third_party?: { providers?: { id: string }[] } }
  const providers = config.third_party?.providers ?? []
  const index = providers.findIndex((provider) => provider.id === 'test')
  test.skip(index < 0, 'the instance does not declare the test provider')

  await page.goto('/app/login')
  const providerRow = page.locator('.provider-list__item').nth(index)
  await expect(providerRow).toBeVisible()

  /* Web 下整页跳转到授权地址：授权、回跳与换会话都发生在同一页上 */
  const callbackRequest = page.waitForRequest(
    (sent) => sent.url().includes('/user/oauth/test/callback') && sent.method() === 'POST',
  )
  const callbackResponse = page.waitForResponse((received) => received.url().includes('/user/oauth/test/callback'))
  await providerRow.click()

  /* 回调的请求与回应都要真的发生：请求里应带一次性 code 与 state，回应是 200 */
  const sent = await callbackRequest
  const body = sent.postDataJSON() as { code?: string; state?: string }
  expect(body.code).toBeTruthy()
  expect(body.state).toBeTruthy()
  expect((await callbackResponse).status()).toBe(200)

  /* 换到会话后按入口配置的成功地址跳走：地址在应用命名空间之外，因此是整页跳转 */
  await expect.poll(() => page.url(), { timeout: 15_000 }).not.toContain('/auth/back/')
  await shot(page, 'third-party-callback')
})

test('reserves two third-party slots while the entry configuration loads', async ({ page }) => {
  /* 配置没回来之前卡片就按两个三方入口的高度占位，加载指示居中且有动画 */
  let release = () => undefined as void
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/v1/user/entry**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/entry')) {
      await held
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Sign up or sign in',
          description: 'Enter your account',
          success_url: '/app/done',
          secure_cookie: false,
          form: {
            username: { placeholder: '请输入邮箱' },
            password: { placeholder: '登录密码' },
          },
          third_party: {
            providers: [
              { id: 'google', label: 'Google', title: 'Google' },
              { id: 'github', label: 'GitHub', title: 'GitHub' },
            ],
          },
        }),
      })
    }
    return route.fallback()
  })

  await page.goto('/app/login')
  const loading = page.locator('.login__loading')
  await expect(loading).toBeVisible()

  const cardBox = () =>
    page.evaluate(() => {
      const rect = (document.querySelector('.auth__card') as HTMLElement).getBoundingClientRect()
      return { 高: Math.round(rect.height), 顶: Math.round(rect.top), 底: Math.round(rect.bottom) }
    })

  const during = await page.evaluate(() => {
    const box = document.querySelector('.login__loading') as HTMLElement
    const spinner = document.querySelector('.login__loading .spinner') as Element
    const boxRect = box.getBoundingClientRect()
    const spinnerRect = spinner.getBoundingClientRect()
    const style = getComputedStyle(spinner)
    return {
      入口块高: Math.round(boxRect.height),
      水平居中差: Math.round((spinnerRect.left + spinnerRect.right) / 2 - (boxRect.left + boxRect.right) / 2),
      动画: `${style.animationName} ${style.animationDuration}`,
    }
  })
  /* 入口块占的正是两个入口的高度：每行一个 --row-height（40）加行间 8 */
  expect(during.入口块高).toBe(88)
  expect(Math.abs(during.水平居中差)).toBeLessThanOrEqual(1)
  /* 有动画：基础件的旋转指示器，一周 1.6 秒 */
  expect(during.动画).toBe('spinner-spin 1.6s')

  /* 判据在这里：卡片**整体预制**，配置到达前后盒子一动不动 */
  const before = await cardBox()

  release()
  /* 配置到达后三方列表真的占这么高，占位与实物一致 */
  await expect(page.locator('.provider-list')).toBeVisible()
  const loaded = await page.evaluate(() =>
    Math.round((document.querySelector('.provider-list') as HTMLElement).getBoundingClientRect().height),
  )
  expect(loaded).toBe(during.入口块高)
  await expect(page.locator('.login__loading')).toHaveCount(0)

  const after = await cardBox()
  expect(after).toEqual(before)
})

test('goes to the sign-up page in place, without reloading the app', async ({ page }) => {
  /* 每次**真实导航**（整页加载）都会重新初始化一遍，于是这个计数只加在整页加载上。
     站内锚点若交给浏览器，计数会变成 2，并且客户端事实（含 `/.well-known/yao`）要重读一次。 */
  await page.addInitScript(() => {
    const scope = window as unknown as { __documentStarts?: number }
    scope.__documentStarts = (scope.__documentStarts ?? 0) + 1
  })
  /* 服务信息由文件级 beforeEach 打桩：这一条不该依赖真实服务，CI 上只有前端时同样要能跑 */
  await page.route('**/v1/user/entry**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/entry')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Sign up or sign in',
          description: 'Enter your account',
          success_url: '/app/done',
          secure_cookie: false,
          form: { username: { placeholder: '请输入邮箱' }, password: { placeholder: '登录密码' } },
          third_party: {
            providers: [
              { id: 'google', label: 'Google', title: 'Google' },
              { id: 'github', label: 'GitHub', title: 'GitHub' },
            ],
          },
        }),
      })
    }
    return route.fallback()
  })

  await page.goto('/app/login')
  await expect(page.locator('.provider-list')).toBeVisible()
  const starts = () =>
    page.evaluate(() => (window as unknown as { __documentStarts?: number }).__documentStarts ?? 0)
  expect(await starts()).toBe(1)

  await page.getByRole('link', { name: '立即注册' }).click()
  await expect(page).toHaveURL(/\/app\/register/)
  expect(await starts()).toBe(1)

  /* 回来的那一跳同样在应用内 */
  await page.getByRole('link', { name: '返回登录' }).click()
  await expect(page).toHaveURL(/\/app\/login/)
  expect(await starts()).toBe(1)
})
