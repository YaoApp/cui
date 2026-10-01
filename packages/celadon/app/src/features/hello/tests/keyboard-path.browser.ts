import { expect, test } from '@playwright/test'

/* 场景：全键盘 —— 不用鼠标走完同一条路径，且焦点环可见。 */
test('the same path on the keyboard alone, with a visible focus ring', async ({ page }) => {
  await page.goto('/')

  await page.keyboard.press('Tab')
  const button = page.getByRole('button', { name: '刷新' })
  await expect(button).toBeFocused()

  const ring = await button.evaluate((el) => getComputedStyle(el).boxShadow)
  expect(ring).not.toBe('none')

  await page.keyboard.press('Enter')
  await expect(page.getByText('已刷新 1 次')).toBeVisible()

  await page.keyboard.press('Space')
  await expect(page.getByText('已刷新 2 次')).toBeVisible()
})
