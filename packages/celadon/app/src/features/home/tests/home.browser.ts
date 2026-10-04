import { expect, test } from '@playwright/test'

/* 首页第一行是语言与主题：左对齐、同一行，且在版本信息之上（2026-10-04 用户指出的位置）。 */
test('the two switches sit on the first row, left aligned', async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 700 })
  await page.goto('/app/')

  const locale = page.getByRole('combobox')
  const theme = page.getByRole('button', { name: '浅色' })
  const version = page.getByRole('heading', { name: '版本信息' })
  await expect(locale).toBeVisible()
  await expect(theme).toBeVisible()

  const [localeBox, themeBox, versionBox] = await Promise.all([
    locale.boundingBox(),
    theme.boundingBox(),
    version.boundingBox(),
  ])
  expect(localeBox).not.toBeNull()
  expect(themeBox).not.toBeNull()
  expect(versionBox).not.toBeNull()
  const [l, t, v] = [localeBox!, themeBox!, versionBox!]

  // 同一行（纵向重叠）
  expect(Math.abs(l.y - t.y)).toBeLessThan(24)
  // **靠左**：语言控件贴着页面左边距（`flex-end`/`center` 都过不了这一条）
  expect(l.x).toBeLessThan(120)
  // 只留间距：主题紧跟在语言右边，而不是被推到页面另一头
  expect(t.x).toBeGreaterThan(l.x)
  expect(t.x - (l.x + l.width)).toBeLessThan(80)
  // 在版本信息**之上**
  expect(l.y).toBeLessThan(v.y)
})
