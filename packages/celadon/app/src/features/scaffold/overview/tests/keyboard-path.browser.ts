import { expect, test } from '@playwright/test'

/* 场景：全键盘 —— 不用鼠标走到页头「刷新」，且焦点环可见；回车触发的是路由重载。 */
test('the same path on the keyboard alone, with a visible focus ring', async ({ page }) => {
  await page.goto('/app/scaffold')
  await expect(page.getByRole('button', { name: '刷新' })).toBeVisible()

  // 头部导航链接在前，用 Tab **走到**「刷新」—— 全程不用鼠标
  const button = page.getByRole('button', { name: '刷新' })
  for (let i = 0; i < 16; i++) {
    if (await button.evaluate((el) => el === document.activeElement)) break
    await page.keyboard.press('Tab')
  }
  await expect(button).toBeFocused()

  const ring = await button.evaluate((el) => getComputedStyle(el).boxShadow)
  expect(ring).not.toBe('none')

  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: '刷新' })).toBeVisible()
  await expect(page.getByText('已刷新 0 次')).toBeVisible()
})
