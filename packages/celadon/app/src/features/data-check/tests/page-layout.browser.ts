import { expect, test, type Page } from '@playwright/test'

/* 场景：长返回值下的页面布局 —— 值再长也只能在自己的格子里换行，不许压到隔壁；
   请求在飞时按钮要先禁用，不许重复提交。两项都在真实渲染下验证。 */

const SERVICE = { name: 'Yao Agents', version: '1.0.0', openapi: '/v1' }
/** 单个值 550 字符且**不带空格**：只有 `overflow-wrap: anywhere` 收得住（这是刚修掉的 bug） */
const LONG_MESSAGE = 'long-value-'.repeat(50)
const PAYLOAD = { MESSAGE: LONG_MESSAGE, SERVER_TIME: '2026-01-01T00:00:00Z' }

/** 桩住服务信息与接口：断言不依赖真后端。`holdMs` 让请求可控地停一会儿，便于观察在飞态。 */
async function stubApi(page: Page, { holdMs = 0 } = {}) {
  await page.route('**/.well-known/yao', (route) => route.fulfill({ json: SERVICE }))
  await page.route('**/v1/**', async (route) => {
    if (holdMs) await new Promise((resolve) => setTimeout(resolve, holdMs))
    const url = route.request().url()
    if (url.includes('/helloworld/protected')) {
      return route.fulfill({
        status: 401,
        json: { error: 'unauthorized', error_description: 'no credential was sent' },
      })
    }
    return route.fulfill({ json: PAYLOAD })
  })
}

test('a long value wraps inside its cell and never overlaps a neighbour', async ({ page }) => {
  await stubApi(page)
  await page.goto('/app/data-check')
  await expect(page.getByRole('heading', { name: '接口验证' })).toBeVisible()

  // 点两条公开的（各自跑一次），受保护的两条留空 —— 只看返回值那一排
  await page.getByRole('button', { name: '公开 GET' }).click()
  await page.getByRole('button', { name: '公开 POST' }).click()
  const resultRow = page.locator('.data-check__row').nth(1)
  await expect(resultRow).toContainText(LONG_MESSAGE)

  const measured = await page.evaluate(() => {
    const row = [...document.querySelectorAll<HTMLElement>('.data-check__row')].find(
      (el) => el.querySelectorAll('.data-check__cell').length === 4,
    )!
    const cells = [...row.querySelectorAll<HTMLElement>('.data-check__cell')].map((el) => {
      const rect = el.getBoundingClientRect()
      // 值（`<code>`）的矩形 —— 不换行时它会被居中后**画到邻居身上**，而格子本身的盒子不动。
      // 所以只量格子盒子会漏掉这个 bug，必须同时约束内容的实际范围。
      const value = el.querySelector('code')!.getBoundingClientRect()
      return {
        left: rect.left,
        right: rect.right,
        width: rect.width,
        contentLeft: value.left,
        contentRight: value.right,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        text: el.textContent?.trim() ?? '',
      }
    })
    return { rowWidth: row.getBoundingClientRect().width, rowScrollWidth: row.scrollWidth, rowClientWidth: row.clientWidth, cells }
  })

  // 同排任意两格**横向不重叠**
  const sorted = [...measured.cells].sort((a, b) => a.left - b.left)
  for (let i = 1; i < sorted.length; i++) {
    expect(sorted[i].left).toBeGreaterThanOrEqual(sorted[i - 1].right - 0.5)
  }
  // 每格宽度不超过容器宽度
  for (const cell of measured.cells) expect(cell.width).toBeLessThanOrEqual(measured.rowWidth + 0.5)
  // 长值必须收在自己的格子里：内容不溢出格子，整排也不横向溢出
  for (const cell of measured.cells) {
    expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth + 1)
    expect(cell.contentLeft).toBeGreaterThanOrEqual(cell.left - 0.5)
    expect(cell.contentRight).toBeLessThanOrEqual(cell.right + 0.5)
  }
  expect(measured.rowScrollWidth).toBeLessThanOrEqual(measured.rowClientWidth + 1)
  // 长值确实落在被量的这一排里（防止选错排导致假绿）
  expect(measured.cells.some((cell) => cell.text.includes(LONG_MESSAGE))).toBe(true)
})

test('a button is disabled while its request is in flight, then re-enables', async ({ page }) => {
  await stubApi(page, { holdMs: 500 })
  await page.goto('/app/data-check')
  const button = page.getByRole('button', { name: '公开 GET' })
  await expect(button).toBeEnabled()

  await button.click()

  // 请求被桩数据停住：按钮此时必须禁用
  await expect(button).toBeDisabled()
  await expect(button).toBeEnabled()
})
