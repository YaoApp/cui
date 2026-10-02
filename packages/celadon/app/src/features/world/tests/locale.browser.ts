import { expect, test } from '@playwright/test'

/* 场景：世界页切换到英文 —— 夹具（我们自己的示例数据）跟语言走：
   世界名 / 摘要 / 实体名与 kind 显示英文，而地址里的对象 id 不变；刷新后仍是英文。 */
test('switching to English localizes the world fixture and keeps the id in the URL', async ({ page }) => {
  await page.goto('/main/world/w1')
  await expect(page.getByRole('heading', { name: 'Alpha 世界' })).toBeVisible()

  await page.getByRole('combobox', { name: '语言' }).click()
  await page.getByRole('option', { name: 'English' }).click()

  await expect(page.getByRole('heading', { name: 'Alpha World' })).toBeVisible()
  await expect(page.getByText('The first world, for checking the list and the detail view.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Origin' })).toBeVisible()
  await expect(page.getByRole('button', { name: '守门人' })).toHaveCount(0)
  // 夹具跟着语言走，但对象 id 不变：地址里仍是 w1
  await expect(page).toHaveURL(/\/main\/world\/w1$/)

  // kind 是系统值：面板里显示英文译文，而不是 code
  await page.getByRole('button', { name: 'Gatekeeper' }).click()
  const panel = page.getByRole('region', { name: 'Entity panel' })
  await expect(panel).toBeVisible()
  await expect(panel.getByText('Role')).toBeVisible()
  await expect(page).toHaveURL(/\/main\/world\/w1\?sideEntity=e2$/)

  await page.reload()

  await expect(page.getByRole('heading', { name: 'Alpha World' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Origin' })).toBeVisible()
  await expect(page).toHaveURL(/\/main\/world\/w1\?sideEntity=e2$/)
})
