import { expect, test } from '@playwright/test'

/* 应用级：首帧占位、站点图标与文档标题。 */

/* 服务信息统一打桩：真实部署里它就是宿主或站点给的一份固定应答。缺了它，
   入口配置的请求发不出去，页面永远停在加载态 —— 这两条就不该依赖真实服务。 */
test.beforeEach(async ({ page }) => {
  await page.route('**/.well-known/yao', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: 'development', version: '0.0.0', openapi: '/v1' }),
    }),
  )
})

test('paints the first-paint placeholder from the HTML, before any bundle runs', async ({ page }) => {
  /* 把应用包全部挡住：这正是网络慢时的情形 —— 先到的只有 HTML。
     占位必须在这时已经可见（写在 `index.html` 里），而不是等包下载完才画出来。 */
  await page.route('**/src/**', (route) => route.abort())
  await page.route('**/@vite/**', (route) => route.abort())
  await page.goto('/app/login', { waitUntil: 'domcontentloaded' })

  const boot = page.locator('.boot')
  await expect(boot).toBeVisible()
  await expect(boot.locator('.boot__mark')).toBeVisible()
  await expect(boot.locator('.boot__ring')).toBeVisible()
  /* 文字按浏览器语言就近取（语言包还没到），这里是用例环境的 zh-CN；不带省略号 */
  await expect(boot.locator('.boot__text')).toHaveText('正在启动')

  /* 指示器一周 1600ms（token `--duration-loop`）；文字流光照 1.0 的加载消息：2s 一来回 */
  const motion = await page.evaluate(() => {
    const ring = getComputedStyle(document.querySelector('.boot__ring') as Element)
    const text = getComputedStyle(document.querySelector('.boot__text') as Element)
    return {
      指示器: `${ring.animationName} ${ring.animationDuration}`,
      流光: `${text.animationName} ${text.animationDuration}`,
      缓动: text.animationTimingFunction,
      裁进文字: text.webkitBackgroundClip || text.backgroundClip,
      背景宽: text.backgroundSize,
    }
  })
  expect(motion.指示器).toBe('celadon-boot-spin 1.6s')
  expect(motion.流光).toBe('celadon-boot-shimmer 2s')
  expect(motion.缓动).toBe('ease-in-out')
  expect(motion.裁进文字).toBe('text')
  expect(motion.背景宽).toBe('200% 100%')
  /* 高光与底色要真的不同色，否则「在动」也看不出来（踩过：两色几乎同色） */
  const stops = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.boot__text') as Element).backgroundImage,
  )
  expect(stops).toContain('rgb(201, 199, 192)')
  expect(stops).toContain('rgb(94, 90, 82)')

  /* 标记在屏幕中间：整组（标记 + 底下一行指示与说明）的竖向中心 = 视口中心 */
  const center = await page.evaluate(() => {
    const mark = document.querySelector('.boot__mark') as HTMLElement
    const text = document.querySelector('.boot__text') as HTMLElement
    const top = mark.getBoundingClientRect().top
    const bottom = text.getBoundingClientRect().bottom
    return { group: Math.round((top + bottom) / 2), viewport: Math.round(window.innerHeight / 2) }
  })
  expect(Math.abs(center.group - center.viewport)).toBeLessThanOrEqual(4)
})

test('replaces the placeholder with the page once the bundle runs', async ({ page }) => {
  /* 入口配置也打桩：这一条只说「占位被页面替换」，不该依赖真实服务 */
  await page.route('**/v1/user/entry**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (!path.endsWith('/entry')) return route.fallback()
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        title: 'Sign up or sign in',
        description: 'Enter your account',
        success_url: '/app/done',
        secure_cookie: false,
        form: { username: { placeholder: '请输入邮箱' }, password: { placeholder: '登录密码' } },
      }),
    })
  })
  await page.goto('/app/login')
  await expect(page.getByLabel('邮箱或手机号')).toBeVisible()
  await expect(page.locator('.boot')).toHaveCount(0)
})

test('serves the brand mark as the site icon and names the tab per page', async ({ page }) => {
  await page.goto('/app/login')
  const href = await page.locator('link[rel="icon"]').getAttribute('href')
  expect(href).toBe('/app/favicon.svg')

  const icon = await page.request.get(new URL(href ?? '', page.url()).toString())
  expect(icon.ok()).toBe(true)
  expect(icon.headers()['content-type']).toContain('image/svg+xml')
  /* 图标的可见范围要盖住整幅标记，否则会被裁掉一部分 */
  expect(await icon.text()).toContain('viewBox="0 0 719.664453 610.367745"')

  /* 标签页名字 = 这一页的名字 + 应用名；语言一换跟着换，不必刷新 */
  await expect(page).toHaveTitle('登录 · Yao Agents')

  const trigger = page.locator('.select-trigger.locale-switch').first()
  await trigger.click()
  await page.getByRole('option', { name: 'English' }).click()
  await expect(page).toHaveTitle('Sign in · Yao Agents')
})
