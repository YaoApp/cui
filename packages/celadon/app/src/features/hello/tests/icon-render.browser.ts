import { expect, test } from '@playwright/test'

/* 图标在**真实渲染**里的两件事，单元测试测不到（jsdom 不跑样式）：与文字垂直居中、颜色随主题。
   一个场景一个文件（见 architecture/14-testing.md §1）。 */
test('the icon sits on the text line and takes its colour from the theme', async ({ page }) => {
  await page.goto('/main/hello')

  const measure = () =>
    page.evaluate(() => {
      const center = (el: Element | null | undefined) => {
        const box = el?.getBoundingClientRect()
        return box ? (box.top + box.bottom) / 2 : null
      }
      const button = document.querySelector('header.header > button')
      const buttonIcon = button?.querySelector('svg.icon')
      const buttonText = button?.querySelector('span')
      const navLink = document.querySelector('nav.nav a.nav__link')
      return {
        theme: document.documentElement.dataset.theme,
        buttonIconCenter: center(buttonIcon),
        buttonTextCenter: center(buttonText),
        navIconCenter: center(navLink?.querySelector('svg.icon')),
        navLinkCenter: center(navLink),
        stroke: buttonIcon ? getComputedStyle(buttonIcon).stroke : null,
        fill: buttonIcon ? getComputedStyle(buttonIcon).fill : null,
      }
    })

  const light = await measure()
  // 与文字同一条中线（差 < 0.5px 视为居中）
  expect(Math.abs((light.buttonIconCenter ?? 0) - (light.buttonTextCenter ?? 99))).toBeLessThan(0.5)
  expect(Math.abs((light.navIconCenter ?? 0) - (light.navLinkCenter ?? 99))).toBeLessThan(0.5)
  // 图标是描边画法，不是实心块 —— 否则深浅色下都是黑的
  expect(light.fill).toBe('none')
  expect(light.stroke).not.toBe('none')

  // 系统切深色：描边颜色必须跟着换（这条正是"看起来不响应深浅"的那个 bug）
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  const dark = await measure()
  expect(dark.stroke).not.toBe('none')
  expect(dark.stroke).not.toBe(light.stroke)
})
