import { expect, test } from '@playwright/test'

test('主路径：打开 → 点刷新 → 次数增加', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('已刷新 0 次')).toBeVisible()

  await page.getByRole('button', { name: '刷新' }).click()
  await page.getByRole('button', { name: '刷新' }).click()

  await expect(page.getByText('已刷新 2 次')).toBeVisible()
})

test('全键盘走完同一条路径，且焦点环可见', async ({ page }) => {
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
