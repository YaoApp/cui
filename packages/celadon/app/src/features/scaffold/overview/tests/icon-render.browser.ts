import { expect, test } from '@playwright/test'

/* 图标在**真实渲染**里的两件事，单元测试测不到（jsdom 不跑样式）：与文字垂直居中、颜色随主题。
   一个场景一个文件（见 architecture/14-testing.md §1）。 */
test('the icon sits on the text line and takes its colour from the theme', async ({ page }) => {
  await page.goto('/app/scaffold')

  const measure = () =>
    page.evaluate(() => {
      const center = (el: Element | null | undefined) => {
        const box = el?.getBoundingClientRect()
        return box ? (box.top + box.bottom) / 2 : null
      }
      const button = document.querySelector('header.header .header__actions button')
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
/* 底座必须是 `body` 的直接子 `<svg>` —— 与设计页同构。包一层 / 设 hidden / display:none，
   品牌标识的身体（靠 url(#渐变) 填充）就不画：只留眼睛（2026-10-02 实测）。 */
test('the sprite is a direct child of the body, like the design page', async ({ page }) => {
  await page.goto('/app/scaffold')
  const sprite = await page.evaluate(() => {
    const svg = document.querySelector('body > svg[width="0"]')
    return svg
      ? { direct: true, hidden: svg.hasAttribute('hidden'), display: getComputedStyle(svg).display, symbols: svg.querySelectorAll('symbol').length }
      : { direct: false }
  })
  expect(sprite.direct, 'sprite must be a direct child of body').toBe(true)
  expect(sprite.hidden).toBe(false)
  expect(sprite.display).not.toBe('none')
  expect(sprite.symbols).toBeGreaterThan(60)
})

test('the demo lists a brand mark beside interface icons, all resolving', async ({ page }) => {
  await page.goto('/app/scaffold')
  const list = await page.evaluate(() =>
    [...document.querySelectorAll('.overview__row .overview__cell')].map((cell) => {
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
  expect(list.length).toBe(42)   /* 自有品牌 4 + 其他品牌 12 + 界面图标 26 */
  expect(list.every((x) => x.symbol)).toBe(true)
  const brand = list.find((x) => x.name?.startsWith('brand-'))
  expect(brand, 'the list shows a brand mark').toBeTruthy()
  // 品牌标识不吃界面图标的 stroke；界面图标必须吃（否则又是黑块那个坑）
  expect(brand?.stroke).toBe('none')
  expect(list.filter((x) => x.name?.startsWith('i-')).every((x) => x.stroke !== 'none')).toBe(true)
})

/* 描边与缩放：**与设计页 design/icons.html 的 icon() 逐字一致** ——
   描边固定 2（24 网格规范值），"小档按比例变细"由 `viewBox` 缩放自动完成。
   手工再按档位换算就是双重缩放（16 档会变成 0.889px，比设计页细 1/3）。 */
test('icons scale through the viewBox with a constant stroke, like the design page', async ({ page }) => {
  await page.goto('/app/scaffold')
  const icons = await page.evaluate(() => {
    const read = (sel: string) => {
      const svg = document.querySelector(sel)
      if (!svg) return null
      const style = getComputedStyle(svg)
      return {
        viewBox: svg.getAttribute('viewBox'),
        strokeWidth: style.strokeWidth,
        stroke: style.stroke,
        fill: style.fill,
        width: svg.getAttribute('width'),
      }
    }
    return {
      button: read('header.header .header__actions button svg.icon'),
      nav: read('nav.nav a.nav__link svg.icon'),
      gallery: read('.overview__row svg.icon'),
      brand: read('.overview__row svg.brand-mark'),
    }
  })
  for (const key of ['button', 'nav', 'gallery', 'brand'] as const) {
    expect(icons[key]?.viewBox, `${key} needs a viewBox or nothing scales`).toBe('0 0 24 24')
  }
  // 界面图标：固定描边 2（设备像素的细由 viewBox 缩放给）
  for (const key of ['button', 'nav', 'gallery'] as const) {
    expect(icons[key]?.strokeWidth, key).toBe('2px')
    expect(icons[key]?.fill).toBe('none')
    expect(icons[key]?.stroke).not.toBe('none')
  }
  // 品牌标识：只整体使用 —— 不套界面图标的 stroke / fill
  expect(icons.brand?.strokeWidth).not.toBe('2px')
})
