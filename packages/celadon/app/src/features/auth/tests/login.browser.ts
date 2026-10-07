import { join } from 'node:path'
import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { capturePage, shotDir } from '../../../../../scripts/shots.mjs'

/* 登录页的真实渲染：入口配置、验证码图与入口判定都来自开发服务，因此这一层同时充当活体走查。
   只打桩"失败路径"与需要口令的那一段：邮件口令是服务端发给用户的，接口读不到。 */
const SHOTS = shotDir('login-page')
const shot = (page: Page, name: string) => capturePage(page, join(SHOTS, `${name}.png`))

/* 依赖真实服务的用例先探一下：服务不在（例如 CI 只起了前端）就整条跳过，不当失败。
   探入口配置，它同时说明服务信息与入口一线都可用。 */
async function hasLiveService(request: APIRequestContext): Promise<boolean> {
  try {
    return (await request.get('/v1/user/entry?locale=zh-CN')).ok()
  } catch {
    return false
  }
}

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

  /* 协议这一行与主按钮是一组：勾选框本体走基础件的中档（方框 16），这一段文字取说明档 12、行高 20，
     勾选行与按钮同宽同左，上下各隔一个半档（24） */
  const terms = await page.evaluate(() => {
    const box = document.querySelector('.terms-note .checkbox__box') as HTMLElement
    const text = document.querySelector('.terms-note__text') as HTMLElement
    const round = (n: number) => Math.round(n * 10) / 10
    const rect = (el: Element) => (el as HTMLElement).getBoundingClientRect()
    const cs = getComputedStyle(text)
    const row = rect(document.querySelector('.terms-note .checkbox__row')!)
    const button = rect(document.querySelector('.auth__card button[type="submit"]')!)
    const fieldBox = rect(document.querySelector('.login__form .field__box')!)
    const note = rect(document.querySelector('.terms-note')!)
    return {
      medium: (box.closest('.checkbox') as HTMLElement).classList.contains('checkbox--medium'),
      box: `${round(box.getBoundingClientRect().width)}×${round(box.getBoundingClientRect().height)}`,
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
      linkColor: getComputedStyle(document.querySelector('.terms-note__link') as HTMLElement).color,
      sameWidthAsButton: round(row.width) === round(button.width),
      sameStartAsButton: round(row.x) === round(button.x),
      gapAbove: round(note.top - fieldBox.bottom),
      gapBelow: round(button.top - note.bottom),
    }
  })
  expect(terms.medium).toBe(true)
  expect(terms.box).toBe('16×16')
  expect(terms.fontSize).toBe('12px')
  expect(terms.lineHeight).toBe('20px')
  /* 与主按钮同宽同左；上面隔两个档（24）、下面隔一个档（8），间距层次把这一组与字段分开 */
  expect(terms.sameWidthAsButton).toBe(true)
  expect(terms.sameStartAsButton).toBe(true)
  expect(terms.gapAbove).toBe(24)
  expect(terms.gapBelow).toBe(8)
  /* 链接取品牌墨色，不用浏览器默认蓝 */
  expect(terms.linkColor).not.toBe('rgb(0, 0, 238)')

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
  await page.locator('.terms-note .checkbox__box').click()
  await page.locator('.auth__card button[type="submit"]').click()

  const notice = page.locator('.status-notice--danger')
  await expect(notice).toBeVisible()
  await expect(notice).toHaveText('请求不合法')
  await expect(notice).not.toHaveText(/request body is not acceptable/)

  await shot(page, 'verify-failure')
})

test('walks the registration branch up to the one-time code and back to the account step', async ({ page }) => {
  const bodies: Record<string, unknown>[] = []
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
          secure_cookie: false,
          verification_code_required: true,
          form: {
            username: { placeholder: '请输入邮箱' },
            password: { placeholder: '登录密码' },
            confirm_password: { placeholder: '确认密码' },
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
    if (path.endsWith('/entry/register')) {
      bodies.push(route.request().postDataJSON() as Record<string, unknown>)
      /* 注册成功但没给 id_token：这是 auto_login 为假时的正常分支，页面应回到第一步并给提示 */
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok', user_id: 'u-new', message: 'registered' }),
      })
    }
    return route.fallback()
  })

  await page.goto('/app/login')
  await page.getByLabel('邮箱或手机号').fill('new-user@example.com')
  await page.locator('.terms-note .checkbox__box').click()
  await page.locator('.auth__card button[type="submit"]').click()

  /* 第二步：确认密码与六位口令，且口令由六格组成 */
  await expect(page.getByPlaceholder('确认密码')).toBeVisible()
  await expect(page.locator('.otp-field input')).toHaveCount(6)
  await page.getByPlaceholder('登录密码').fill('one-two-three')
  await page.getByPlaceholder('确认密码').fill('one-two-three')
  await page.locator('.otp-field__cell').first().click()
  await page.keyboard.type('123456')
  await shot(page, 'register-step')
  await page.locator('.auth__card button[type="submit"]').click()

  await expect(page.getByRole('status')).toHaveText('注册成功，请登录')
  expect(bodies[0]).toMatchObject({ password: 'one-two-three', confirm_password: 'one-two-three', otp_id: 'otp-1', verification_code: '123456' })
  await expect(page.getByLabel('邮箱或手机号')).toBeVisible()
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

test('walks the first step against the live service with the captcha read from the test interface', async ({ page, request }) => {
  /* 人机验证改为点「下一步」之后的独立一步，这一步的界面与弹窗尚未落地，走查暂时挂起 */
  test.fixme(true, 'the captcha moves to its own step after Next; reopen once that step lands')
  test.skip(!(await hasLiveService(request)), 'the development service is not reachable')

  /* 图形验证码的答案由测试接口按 `captcha_id` 给：页面向服务取图时记下那个 id，
     再用 `/test/captcha` 读答案回填，因此这条用例走的是真实的判定，不打桩。 */
  const captchaCall = page.waitForResponse((response) => response.url().includes('/user/entry/captcha'))
  await page.goto('/app/login')
  const captchaBody = (await (await captchaCall).json()) as { captcha_id: string }
  expect(captchaBody.captcha_id).toBeTruthy()

  const answerResponse = await request.get(`/v1/test/captcha?id=${encodeURIComponent(captchaBody.captcha_id)}`)
  expect(answerResponse.ok()).toBe(true)
  const answer = (await answerResponse.json()) as { answer: string }
  expect(answer.answer).toMatch(/^[0-9a-zA-Z]+$/)

  const account = `walk-${Date.now()}@example.com`
  await page.getByLabel('邮箱或手机号').fill(account)
  await page.getByPlaceholder('验证码').fill(answer.answer)
  await page.locator('.terms-note .checkbox__box').click()

  const verifyCall = page.waitForResponse((response) => response.url().includes('/user/entry/verify'))
  await page.locator('.auth__card button[type="submit"]').click()
  const verifyBody = (await (await verifyCall).json()) as { status: string; otp_id?: string; verification_sent?: boolean }

  /* 新邮箱：服务端判为注册，并说口令已发出；页面应走到密码步并给出确认密码与六位口令 */
  expect(verifyBody.status).toBe('register')
  expect(verifyBody.verification_sent).toBe(true)
  await expect(page.getByPlaceholder('确认密码')).toBeVisible()
  await expect(page.locator('.otp-field')).toBeVisible()

  await shot(page, 'live-walk-register-step')
  console.log('[login] live walk reached', verifyBody.status, 'otp_id', verifyBody.otp_id ?? '(none)', 'for', account)
})
