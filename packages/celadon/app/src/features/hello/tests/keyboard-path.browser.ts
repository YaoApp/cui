import { expect, test } from '@playwright/test'

/* 场景：全键盘 —— 不用鼠标走完同一条路径，且焦点环可见。 */
test('the same path on the keyboard alone, with a visible focus ring', async ({ page }) => {
  await page.goto('/')
  // 等应用真的渲染出来：/ 会重定向到 /main/hello，抢在重定向之前按 Tab 会丢焦点
  await expect(page.getByRole('button', { name: '刷新' })).toBeVisible()

  // 头部还有导航链接在前，用 Tab **走到**「刷新」——仍然全程不用鼠标
  const button = page.getByRole('button', { name: '刷新' })
  for (let i = 0; i < 12; i++) {
    if (await button.evaluate((el) => el === document.activeElement)) break
    await page.keyboard.press('Tab')
  }
  await expect(button).toBeFocused()

  const ring = await button.evaluate((el) => getComputedStyle(el).boxShadow)
  expect(ring).not.toBe('none')

  await page.keyboard.press('Enter')
  await expect(page.getByText('已刷新 1 次')).toBeVisible()

  await page.keyboard.press('Space')
  await expect(page.getByText('已刷新 2 次')).toBeVisible()
})
