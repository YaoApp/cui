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

/* 图标一览：品牌标识与界面图标都能渲染出来（符号指得到）。
   品牌标识**不套用界面图标的描边规则** —— 它是"只整体使用"的另一类（design/icons.md §1）。 */
test('the demo lists a brand mark beside interface icons, all resolving', async ({ page }) => {
  await page.goto('/main/hello')
  const list = await page.evaluate(() =>
    [...document.querySelectorAll('.hello__icons .hello__icon')].map((cell) => {
      const svg = cell.querySelector('svg')
      const href = svg?.querySelector('use')?.getAttribute('href')
      return {
        name: cell.querySelector('code')?.textContent,
        href,
        symbol: href ? !!document.querySelector(href) : false,
        stroke: svg ? getComputedStyle(svg).stroke : null,
      }
    }),
  )
  expect(list.length).toBe(8)
  expect(list.every((x) => x.symbol)).toBe(true)
  const brand = list.find((x) => x.name?.startsWith('brand-'))
  expect(brand, 'the list shows a brand mark').toBeTruthy()
  // 品牌标识不吃界面图标的 stroke；界面图标必须吃（否则又是黑块那个坑）
  expect(brand?.stroke).toBe('none')
  expect(list.filter((x) => x.name?.startsWith('i-')).every((x) => x.stroke !== 'none')).toBe(true)
})

/* 描边按档位缩放：24 网格规范值 2，小档按比例变细（design/icons.md §2）。
   不设就是 SVG 初始值 1 —— 会"比设计页细一圈"，用户实测发现过。 */
test('the stroke scales with the icon size instead of staying at the default', async ({ page }) => {
  await page.goto('/main/hello')
  const widths = await page.evaluate(() => {
    const read = (sel: string) => {
      const svg = document.querySelector(sel)
      return svg ? Number.parseFloat(getComputedStyle(svg).strokeWidth) : null
    }
    return {
      fourteen: read('header.header > button svg.icon--14'),
      sixteen: read('nav.nav a.nav__link svg.icon--16'),
      twenty: read('.hello__icons svg.icon--20'),
    }
  })
  expect(widths.fourteen).toBeGreaterThan(1)
  expect(widths.sixteen).toBeGreaterThan(1)
  expect(widths.twenty).toBeGreaterThan(1)
  // 按 2 × size/24 缩放（24 档 = 2）
  expect(widths.fourteen).toBeCloseTo(2 * (14 / 24), 2)
  expect(widths.sixteen).toBeCloseTo(2 * (16 / 24), 2)
  expect(widths.twenty).toBeCloseTo(2 * (20 / 24), 2)
})
