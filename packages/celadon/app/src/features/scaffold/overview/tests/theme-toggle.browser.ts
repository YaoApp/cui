import { expect, test } from '@playwright/test'

/* 场景：切换主题 —— 工具条上的方形图标按钮。图标反转：浅色下画月亮（点击变深色），深色下画太阳。
   可访问名写的是动作，所以按动作名定位，顺带证明读屏听到的是「按下去会发生什么」。 */
test('the icon button switches the theme, and the icon and name invert with it', async ({ page }) => {
  await page.goto('/app/scaffold')

  const theme = () => page.evaluate(() => document.documentElement.dataset.theme ?? 'light')
  const toDark = (await theme()) !== 'dark'
  const currentName = toDark ? '切换到深色' : '切换到浅色'
  const nextName = toDark ? '切换到浅色' : '切换到深色'
  const button = page.getByRole('button', { name: currentName })

  await expect(button).toBeVisible()
  await expect(button.locator('use')).toHaveAttribute('href', toDark ? '#i-moon' : '#i-sun')
  const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)

  await button.click()

  await expect(page.locator('html')).toHaveAttribute('data-theme', toDark ? 'dark' : 'light')
  /* 反转：动作名与图标一起换成另一档 */
  const flipped = page.getByRole('button', { name: nextName })
  await expect(flipped).toBeVisible()
  await expect(flipped.locator('use')).toHaveAttribute('href', toDark ? '#i-sun' : '#i-moon')

  const after = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(after).not.toBe(before)
})

test('the choice survives a reload', async ({ page }) => {
  await page.goto('/app/scaffold')

  const theme = () => page.evaluate(() => document.documentElement.dataset.theme ?? 'light')
  const toDark = (await theme()) !== 'dark'
  await page.getByRole('button', { name: toDark ? '切换到深色' : '切换到浅色' }).click()

  const next = toDark ? 'dark' : 'light'
  await page.reload()

  await expect(page.locator('html')).toHaveAttribute('data-theme', next)
  /* 重新载入后按钮仍指向另一档，也就是动作名与当前档相反 */
  await expect(page.getByRole('button', { name: next === 'dark' ? '切换到浅色' : '切换到深色' })).toBeVisible()
})
