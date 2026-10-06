import { expect, test, type Page } from '@playwright/test'
import { join } from 'node:path'
import { capturePage, shotDir } from '../../../../../../scripts/shots.mjs'

/* 基础件清单页：分组卡片、状态覆盖与浅暗两套主题。
   断言只看用户看得见的东西（可见文字、角色、可访问属性与真实计算样式），不看内部结构。
   配色不断言字面色值，而是比较两个变体的计算值：去掉反色类或错误文字类，这里就会红。 */

const SHOTS = shotDir('base-page')
const shot = (page: Page, name: string) => capturePage(page, join(SHOTS, `${name}.png`))

/* 取出一个 CSS 值里的全部数字：计算值会把 .4 补成 0.4，缓动与颜色都按数值比，避免格式差异误判 */
const curveNumbers = (value: string) => (value.match(/-?\d*\.?\d+/g) ?? []).map(Number)

/* 相对亮度与对比度：按 WCAG 的定义算，用来核 1.4.11 要求的 3:1 */
const channel = (value: number) => {
  const s = value / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const relLum = (rgb: string) => {
  const [r, g, b] = (rgb.match(/\d+/g) ?? []).map(Number)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}
const contrast = (a: string, b: string) => {
  const [x, y] = [relLum(a), relLum(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

/* token 读出来是十六进制字面量，计算样式给的是 rgb()，比较前统一换算 */
const hexToRgb = (hex: string) => {
  const value = Number.parseInt(hex.replace('#', ''), 16)
  return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`
}

test('lists the six groups and their states', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1100 })
  await page.goto('/app/scaffold/base')

  /* 分组标题走四语语言包，默认语言是中文；组件名保留英文作为 API 名称（本地化文档的惯例） */
  await expect(page.locator('.base-group__title')).toHaveText([
    '输入 Input',
    '复选框 Checkbox',
    '按钮 Button',
    '选择器 Select',
    '图标与品牌 Icon & BrandMark',
    '主题与语言 Theme & Locale',
  ])
  /* 子组标题同样随语言走，证明页面文案确实接进了语言包 */
  await expect(page.locator('.base-subgroup__title').first()).toHaveText('属性')
  /* 两条消息文案在输入组与复选框组都用：定位要落在输入组里，否则同一个文案命中两处 */
  await expect(page.locator('.field:has(#demo-hint) .field__hint')).toHaveText('显示在字段下方')
  await expect(page.locator('.field:has(#demo-error) .hint-error')).toHaveText('以危险色显示')

  /* 输入：右侧槽位必须落在字段框之内。曾经因为本体没占满弹性行，槽位落到字段框右边界之外 */
  const trailingField = page.locator('#demo-trailing')
  const trail = page.locator('.field__box:has(#demo-trailing) .field__trail')
  const [inputBox, trailBox] = await Promise.all([trailingField.boundingBox(), trail.boundingBox()])
  expect(trailBox).not.toBeNull()
  expect(trailBox!.x + trailBox!.width).toBeLessThanOrEqual(inputBox!.x + inputBox!.width + 1)

  /* 输入：placeholder 这一档必须真的画出来（属性展示漏过它） */
  await expect(page.locator('#demo-placeholder')).toHaveAttribute('placeholder', 'you@example.com')

  /* 输入：错误态要有可见文字，并经 aria-describedby 与控件关联，颜色取危险色的文字档 */
  const errorField = page.locator('#demo-error')
  await expect(errorField).toHaveAttribute('aria-describedby', 'demo-error-error')
  const errorText = page.locator('.field:has(#demo-error) .hint-error')
  await expect(errorText).toBeVisible()
  await expect(errorText).toHaveClass(/hint-error/)
  const [errorColor, hintColor] = await Promise.all([
    errorText.evaluate((el) => getComputedStyle(el).color),
    page.locator('.field:has(#demo-hint) .field__hint').evaluate((el) => getComputedStyle(el).color),
  ])
  expect(errorColor).not.toBe(hintColor)
  /* 提示与错误到字段框下沿的间距必须一致：上游部件自带外边距会得到两个值 */
  const [hintGap, errorGap] = await Promise.all([
    page.locator('.field:has(#demo-hint)').evaluate((el) => {
      const box = el.querySelector('.field__box')!.getBoundingClientRect()
      return Math.round(el.querySelector('.field__hint')!.getBoundingClientRect().y - box.bottom)
    }),
    page.locator('.field:has(#demo-error)').evaluate((el) => {
      const box = el.querySelector('.field__box')!.getBoundingClientRect()
      return Math.round(el.querySelector('.hint-error')!.getBoundingClientRect().y - box.bottom)
    }),
  ])
  expect(Math.abs(hintGap - errorGap)).toBeLessThanOrEqual(1)

  /* 按钮：反色与常规档的计算底色必须不同，加载态禁用并带 aria-busy，整宽档比常规档宽。
     名称用整串比（exact）：否则「inverse」会同时命中「inverse · hover」这类样例。 */
  const inverse = page.getByRole('button', { name: 'inverse', exact: true })
  const soft = page.getByRole('button', { name: 'soft', exact: true })
  await expect(inverse).toBeVisible()
  const [inverseBg, softBg] = await Promise.all([
    inverse.evaluate((el) => getComputedStyle(el).backgroundColor),
    soft.evaluate((el) => getComputedStyle(el).backgroundColor),
  ])
  expect(inverseBg).not.toBe(softBg)

  const loading = page.getByRole('button', { name: 'loading', exact: true })
  await expect(loading).toBeDisabled()
  await expect(loading).toHaveAttribute('aria-busy', 'true')
  await expect(loading).toHaveClass(/is-loading/)
  await expect(loading.locator('.spinner')).toHaveCount(1)

  const block = page.getByRole('button', { name: '整宽（表单主操作）' })
  const [blockBox, inverseBox] = await Promise.all([block.boundingBox(), inverse.boundingBox()])
  expect(blockBox!.width).toBeGreaterThan(inverseBox!.width)

  /* 状态齐：每个样式一行四组（默认 · 悬停 · 按下 · 聚焦），逐样式核对。
     悬停、按下、聚焦都必须与默认不同，按下还要与悬停不同，且按下是规范 F4 的 scale(.94)；
     取值里因此带上 transform，否则"只差缩放"的变体会被误判成与悬停相同。 */
  const paintOfName = (name: string) =>
    page.getByRole('button', { name, exact: true }).evaluate((el) => {
      const cs = getComputedStyle(el)
      return [cs.backgroundColor, cs.color, cs.borderTopColor, cs.boxShadow, cs.transform].join('|')
    })
  const variants = ['solid', 'soft', 'ghost', 'warn', 'success', 'danger', 'inverse'] as const
  for (const variant of variants) {
    const idle = await paintOfName(`${variant} · default`)
    const hover = await paintOfName(`${variant} · hover`)
    expect(hover).not.toBe(idle)
    const active = await paintOfName(`${variant} · active`)
    expect(active).not.toBe(idle)
    expect(active).not.toBe(hover)
    expect(active).toContain('0.94')
    expect(
      await page
        .getByRole('button', { name: `${variant} · focus`, exact: true })
        .evaluate((el) => getComputedStyle(el).boxShadow),
    ).not.toBe('none')
  }
  /* 非品牌样式的聚焦环必须是自己色系，不能借用品牌色环 */
  const brandRing = await paintOfName('solid · focus')
  for (const variant of ['warn', 'success', 'danger'] as const) {
    expect(await paintOfName(`${variant} · focus`)).not.toBe(brandRing)
  }
  await expect(page.getByRole('button', { name: 'disabled', exact: true })).toBeDisabled()

  /* 三档尺寸：高度分别等于 24 / 32 / 40；每档同一行里七个变体高度一致 */
  const heightOf = (name: string) =>
    page.getByRole('button', { name, exact: true }).evaluate((el) => Math.round(el.getBoundingClientRect().height))
  for (const [label, height] of [
    ['small 24', 24],
    ['medium 32', 32],
    ['large 40', 40],
  ] as const) {
    for (const variant of ['solid', 'soft', 'ghost', 'warn', 'success', 'danger', 'inverse'] as const) {
      expect(await heightOf(`${label} · ${variant}`)).toBe(height)
      expect(await heightOf(`pill ${label} · ${variant}`)).toBe(height)
    }
  }

  /* 圆角按规范 F3：**按档位取同名 token**（小 --radius-small · 中 --radius-medium · 大 --radius-large），胶囊取 --radius-pill */
  const radiusOf = (name: string) =>
    page.getByRole('button', { name, exact: true }).evaluate((el) => getComputedStyle(el).borderTopLeftRadius)
  const radiusToken = await page.evaluate(() => {
    const probe = getComputedStyle(document.querySelector('.celadon') ?? document.documentElement)
    return {
      small: probe.getPropertyValue('--radius-small').trim(),
      medium: probe.getPropertyValue('--radius-medium').trim(),
      large: probe.getPropertyValue('--radius-large').trim(),
      pill: probe.getPropertyValue('--radius-pill').trim(),
    }
  })
  expect(await radiusOf('small 24 · solid')).toBe(radiusToken.small)
  expect(await radiusOf('medium 32 · solid')).toBe(radiusToken.medium)
  expect(await radiusOf('large 40 · solid')).toBe(radiusToken.large)
  for (const label of ['small 24', 'medium 32', 'large 40'] as const) {
    expect(await radiusOf(`pill ${label} · solid`)).toBe(radiusToken.pill)
  }
  /* 输入框属中档，与中档按钮同一个 token */
  expect(await page.locator('#demo-state-default').evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).toBe(
    radiusToken.medium,
  )

  /* 图标与品牌：四档图标都真的画出来（有尺寸），品牌标识有可访问名 */
  const icons = page.locator('.base-row svg')
  expect(await icons.count()).toBeGreaterThanOrEqual(4)
  await expect(page.getByRole('img', { name: 'Yao Agents' })).toBeVisible()

  /* 选择器：指示器必须是我们自己的图标 i-down，不再用上游自带的 ▼；
     三档高度与输入框对齐（中档同高）、错误态改边框、禁用不可点；弹层能开能选、禁用项不可选；空态有说明。 */
  const selectTrigger = (label: string) => page.getByRole('combobox', { name: label, exact: true })
  /* 弹层由 portal 渲染，关闭的那些仍留在 DOM 里：打开后先等**可见的那一个**出现，
     之后一律在可见弹层内部查询，避免读到已关闭的节点（它们的尺寸是 0）。 */
  const openSelect = async (label: string) => {
    /* 上一步的弹层可能还在关闭过渡里，它内部的遮罩会拦住下一次点击：先等它彻底消失再点 */
    await page.keyboard.press('Escape')
    await page.waitForFunction(
      () =>
        ![...document.querySelectorAll('.select-popup')].some((el) => el.getBoundingClientRect().height > 0),
    )
    await selectTrigger(label).click()
    /* 弹层有进场动画（200ms 缩放加淡入），起始帧之前还有一次定位，等 600ms 稳定后再量 */
    await page.waitForTimeout(600)
  }
  await expect(selectTrigger('select default')).toBeVisible()
  const indicator = await selectTrigger('select default').evaluate((el) => ({
    href: el.querySelector('svg use')?.getAttribute('href') ?? '',
    上游指示器: el.querySelectorAll('.select__indicator').length,
  }))
  expect(indicator.href).toBe('#i-down')
  expect(indicator.上游指示器).toBe(0)

  const selectHeight = (label: string) =>
    selectTrigger(label).evaluate((el) => (el as HTMLElement).offsetHeight)
  /* 两个字段都在按钮那条 24 / 32 / 40 的梯子上，中档同高 */
  const inputHeights = await page.evaluate(() =>
    ['demo-input-small', 'demo-input-medium', 'demo-input-large'].map((id) =>
      Math.round((document.querySelector(`.field:has(#${id}) .input`) as HTMLElement).getBoundingClientRect().height),
    ),
  )
  expect(inputHeights).toEqual([24, 32, 40])
  expect([await selectHeight('select small'), await selectHeight('select medium'), await selectHeight('select large')]).toEqual([24, 32, 40])
  expect(await selectHeight('select medium')).toBe(
    await page.locator('#demo-state-default').evaluate((el) => Math.round(el.getBoundingClientRect().height)),
  )
  expect(await selectTrigger('select error').evaluate((el) => getComputedStyle(el).borderTopColor)).not.toBe(
    await selectTrigger('select default').evaluate((el) => getComputedStyle(el).borderTopColor),
  )
  await expect(selectTrigger('select disabled')).toBeDisabled()

  /* 图标按钮：方形，边长等于该档的控件高度；带底与不带底分别是 `solid` 与 `plain`。
     plain 静止透明、悬停才给浅底；加载时指示器顶替图标，方形里不同时放两件东西。 */
  const iconButton = (label: string) => page.locator(`button[aria-label="${label}"]`)
  const iconGround = (label: string) => iconButton(label).evaluate((el) => getComputedStyle(el).backgroundColor)
  const iconBoxes = await page.evaluate(() =>
    ['icon small', 'icon medium', 'icon large'].map((label) => {
      const el = document.querySelector(`button[aria-label="${label}"]`) as HTMLElement
      return { 宽: Math.round(el.getBoundingClientRect().width), 高: Math.round(el.getBoundingClientRect().height) }
    }),
  )
  expect(iconBoxes.map((box) => box.宽)).toEqual([24, 32, 40])
  expect(iconBoxes.map((box) => box.高)).toEqual([24, 32, 40])
  expect(await iconGround('icon solid')).not.toBe('rgba(0, 0, 0, 0)')
  expect(await iconGround('icon plain')).toBe('rgba(0, 0, 0, 0)')
  await iconButton('icon plain').hover()
  await page.waitForTimeout(150)
  const hoverGround = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.celadon') ?? document.documentElement).getPropertyValue('--background-hover').trim(),
  )
  expect(await iconGround('icon plain')).toBe(hexToRgb(hoverGround))
  expect(
    await iconButton('icon loading').locator('.button__label').evaluate((el) => getComputedStyle(el).display),
  ).toBe('none')

  /* 打开弹层：选项齐、禁用项标了禁用、选中之后触发器文字跟着变 */
  await selectTrigger('select default').click()
  await expect(page.getByRole('listbox')).toBeVisible()
  expect(
    await page
      .getByRole('option', { name: /Auto/ })
      .evaluate((el) => el.getAttribute('aria-disabled') ?? el.getAttribute('data-disabled') ?? ''),
  ).not.toBe('')
  /* 选项行取列表行高档（点击目标不小于 32），弹层不带外边距（间距归排布者，见 layout.md 第 3 节） */
  const rowHeight = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.celadon') ?? document.documentElement)
      .getPropertyValue('--row-height')
      .trim(),
  )
  expect(
    await page
      .getByRole('option', { name: 'Light' })
      .evaluate((el) => (el as HTMLElement).offsetHeight),
  ).toBe(Math.round(parseFloat(rowHeight)))
  expect(await page.locator('.select-popup').evaluate((el) => getComputedStyle(el).marginBlockStart)).toBe('0px')
  await page.getByRole('option', { name: 'Dark' }).click()
  await expect(selectTrigger('select default')).toContainText('Dark')

  /* 触发器图标槽：带图标的那一档要真的画出图标 */
  expect(
    await selectTrigger('select with icon').evaluate((el) => {
      const svg = el.querySelector('.select__lead svg')
      return svg ? Math.round(svg.getBoundingClientRect().width) : 0
    }),
  ).toBeGreaterThanOrEqual(12)

  /* 分组：组标题与组内选项都在，顺序按数据给 */
  await openSelect('select groups')
  const grouped = await page.evaluate(() => {
    const popup = [...document.querySelectorAll('.select-popup')].find((el) => el.getBoundingClientRect().height > 0)!
    return {
      组: [...popup.querySelectorAll('.select-group-label')].map((el) => el.textContent?.trim() ?? ''),
      项: [...popup.querySelectorAll('[role=option]')].length,
    }
  })
  expect(grouped.组).toEqual(['Appearance', 'Language'])
  expect(grouped.项).toBe(5)
  await page.keyboard.press('Escape')

  /* 选项图标：每个选项真的画出图标，禁用项仍在 */
  await openSelect('select icon options')
  expect(
    await page.evaluate(() => {
      const popup = [...document.querySelectorAll('.select-popup')].find((el) => el.getBoundingClientRect().height > 0)!
      const first = popup.querySelector('.select-item__icon svg')
      return first ? Math.round(first.getBoundingClientRect().width) : 0
    }),
  ).toBeGreaterThanOrEqual(12)
  await page.keyboard.press('Escape')

  /* 异形布局：两行选项（标签加说明）行高大于单行档位，说明真的渲染 */
  await openSelect('select rich options')
  const rich = await page.evaluate(() => {
    const popup = [...document.querySelectorAll('.select-popup')].find((el) => el.getBoundingClientRect().height > 0)!
    return {
      行高: [...popup.querySelectorAll('[role=option]')].map((el) => (el as HTMLElement).offsetHeight),
      说明: popup.querySelectorAll('.select-item__description').length,
    }
  })
  expect(rich.说明).toBe(3)
  for (const height of rich.行高) {
    expect(height).toBeGreaterThan(Math.round(parseFloat(rowHeight)))
  }
  await page.keyboard.press('Escape')

  /* 右侧附加内容：文字在，行高仍是单行档位 */
  await openSelect('select trailing options')
  const trailing = await page.evaluate(() => {
    const popup = [...document.querySelectorAll('.select-popup')].find((el) => el.getBoundingClientRect().height > 0)!
    const first = popup.querySelector('.select-item__trailing')
    return {
      文字: first?.textContent?.trim() ?? '',
      行高: (popup.querySelector('[role=option]') as HTMLElement).offsetHeight,
    }
  })
  expect(trailing.文字).not.toBe('')
  expect(trailing.行高).toBe(Math.round(parseFloat(rowHeight)))
  await page.keyboard.press('Escape')

  /* 长列表：项数齐、高度不超过可用高度、必须对齐整行（内距与边框减掉后是行高档的整数倍），
     溢出时出现滚动箭头，悬停箭头列表真的滚动 */
  await openSelect('select long list')
  const long = await page.evaluate(() => {
    const popup = [...document.querySelectorAll('.select-popup')].find((el) => el.getBoundingClientRect().height > 0)!
    const list = popup.querySelector('.select-list')!
    return {
      项: popup.querySelectorAll('[role=option]').length,
      高: (popup as HTMLElement).offsetHeight,
      内距:
        parseFloat(getComputedStyle(popup).paddingBlockStart) * 2 +
        parseFloat(getComputedStyle(popup).borderTopWidth) * 2,
      可滚: list.scrollHeight > list.clientHeight + 1,
      /* 滚动箭头让出的空档不参与整行取整，断言里要减掉它 */
      让出:
        parseFloat(getComputedStyle(list).marginBlockStart) +
        parseFloat(getComputedStyle(list).marginBlockEnd),
      箭头: [...popup.querySelectorAll('.select-arrow')].map((el) => (el as HTMLElement).offsetHeight),
    }
  })
  expect(long.项).toBe(30)
  expect(long.高).toBeLessThanOrEqual(await page.evaluate(() => window.innerHeight))
  expect((long.高 - long.内距 - long.让出) % Math.round(parseFloat(rowHeight))).toBe(0)
  expect(long.可滚).toBe(true)
  expect(long.箭头.length).toBeGreaterThan(0)
  expect(Math.max(...long.箭头)).toBeGreaterThan(0)
  await page.locator('.select-arrow:not(.select-arrow--up)').first().hover()
  await page.waitForTimeout(400)
  expect(
    await page.evaluate(() => {
      const popup = [...document.querySelectorAll('.select-popup')].find((el) => el.getBoundingClientRect().height > 0)!
      return Math.round(popup.querySelector('.select-list')!.scrollTop)
    }),
  ).toBeGreaterThan(0)
  await page.keyboard.press('Escape')

  /* 多选：点选之后弹层不关，勾选数增加 */
  await openSelect('select multiple')
  const beforeMultiple = await page.evaluate(() => {
    const popup = [...document.querySelectorAll('.select-popup')].find((el) => el.getBoundingClientRect().height > 0)!
    return popup.querySelectorAll('.select-item__check').length
  })
  await page.locator('.select-popup:visible [role=option]', { hasText: 'Dark' }).first().click()
  await page.waitForTimeout(200)
  const afterMultiple = await page.evaluate(() => {
    const popup = [...document.querySelectorAll('.select-popup')].find((el) => el.getBoundingClientRect().height > 0)
    return popup ? popup.querySelectorAll('.select-item__check').length : -1
  })
  expect(afterMultiple).toBe(beforeMultiple + 1)
  await page.keyboard.press('Escape')

  /* 搜索：筛选真的减少选项，无命中时给说明；等行高的长列表加搜索后仍对齐整行 */
  await openSelect('select searchable')
  await page.locator('.select-search__input').fill('zzz')
  await page.waitForTimeout(200)
  const noMatch = await page.evaluate(() => {
    const popup = [...document.querySelectorAll('.select-popup')].find((el) => el.getBoundingClientRect().height > 0)!
    return {
      项: popup.querySelectorAll('[role=option]').length,
      说明: popup.querySelector('.select-popup__empty')?.textContent?.trim() ?? '',
    }
  })
  expect(noMatch.项).toBe(0)
  expect(noMatch.说明).not.toBe('')
  await page.keyboard.press('Escape')

  await openSelect('select searchable long')
  const searched = await page.evaluate(() => {
    const popup = [...document.querySelectorAll('.select-popup')].find((el) => el.getBoundingClientRect().height > 0)!
    const search = popup.querySelector('.select-search')!
    return {
      高: (popup as HTMLElement).offsetHeight,
      内距:
        parseFloat(getComputedStyle(popup).paddingBlockStart) * 2 +
        parseFloat(getComputedStyle(popup).borderTopWidth) * 2,
      搜索高: (search as HTMLElement).offsetHeight,
      让出:
        parseFloat(getComputedStyle(popup.querySelector('.select-list')!).marginBlockStart) +
        parseFloat(getComputedStyle(popup.querySelector('.select-list')!).marginBlockEnd),
      可滚: popup.querySelector('.select-list')!.scrollHeight > popup.querySelector('.select-list')!.clientHeight + 1,
    }
  })
  expect(searched.可滚).toBe(true)
  expect((searched.高 - searched.内距 - searched.搜索高 - searched.让出) % Math.round(parseFloat(rowHeight))).toBe(0)
  await page.keyboard.press('Escape')

  /* 触发器是按钮语义：鼠标选完之后焦点虽在触发器上，也不得留焦点环（与按钮同一规则）；
     键盘聚焦时必须加环。两者用 :focus-visible 区分。 */
  await openSelect('select default')
  await page.locator('.select-popup:visible [role=option]', { hasText: 'Dark' }).first().click()
  await page.waitForTimeout(300)
  const mouseFocus = await selectTrigger('select default').evaluate((el) => ({
    焦点可见: el.matches(':focus-visible'),
    环: getComputedStyle(el).boxShadow,
    边框: getComputedStyle(el).borderTopColor,
  }))
  expect(mouseFocus.焦点可见).toBe(false)
  expect(mouseFocus.环).toBe('none')
  await page.keyboard.press('Tab')
  await selectTrigger('select default').focus()
  await page.waitForTimeout(300)
  const keyFocus = await selectTrigger('select default').evaluate((el) => ({
    焦点可见: el.matches(':focus-visible'),
    环: getComputedStyle(el).boxShadow,
  }))
  expect(keyFocus.焦点可见).toBe(true)
  expect(keyFocus.环).not.toBe('none')

  /* 分段控件：默认档与反色档、图标槽、整组禁用，以及静态的悬停与聚焦态 */
  const segmented = await page.evaluate(() => {
    const token = (name: string) =>
      getComputedStyle(document.querySelector('.celadon') ?? document.documentElement)
        .getPropertyValue(name)
        .trim()
    const read = (label: string) => {
      const group = document.querySelector(`[aria-label="${label}"]`)!
      const on = group.querySelector('button.is-on') as HTMLElement
      return {
        段: group.querySelectorAll('button').length,
        组底: getComputedStyle(group).backgroundColor,
        选中底: getComputedStyle(on).backgroundColor,
        选中环: getComputedStyle(on).boxShadow,
        图标: group.querySelectorAll('.seg__icon svg').length,
        禁用段: [...group.querySelectorAll('button')].filter((button) => button.disabled).length,
      }
    }
    return {
      默认: read('segmented default'),
      反色: read('segmented inverse'),
      图标: read('segmented icons'),
      禁用: read('segmented disabled'),
      悬停: read('segmented hover'),
      聚焦: read('segmented focus'),
      反色底token: token('--background-inverse'),
      悬停底token: token('--brand-soft-hover'),
    }
  })
  expect(segmented.默认.段).toBe(3)
  expect(segmented.默认.组底).not.toBe(segmented.反色.组底)
  expect(segmented.反色.组底).toBe(hexToRgb(segmented.反色底token))
  expect(segmented.图标.图标).toBe(3)
  expect(segmented.禁用.禁用段).toBe(3)
  expect(segmented.悬停.选中底).toBe(hexToRgb(segmented.悬停底token))
  expect(segmented.聚焦.选中环).not.toBe('none')

  /* 纯文字档：不画字段底与边框，悬停给浅底，末尾图标那一档不带指示器；
     第一个演示（占位档）必须真的能选，不能挂空回调。 */
  const plainRest = await page.locator('[aria-label="variant plain"]').evaluate((el) => ({
    底: getComputedStyle(el).backgroundColor,
    框: getComputedStyle(el).borderTopColor,
  }))
  expect(plainRest.底).toBe('rgba(0, 0, 0, 0)')
  expect(plainRest.框).toBe('rgba(0, 0, 0, 0)')
  await page.locator('[aria-label="variant plain"]').hover()
  await page.waitForTimeout(200)
  expect(
    await page.locator('[aria-label="variant plain"]').evaluate((el) => getComputedStyle(el).backgroundColor),
  ).not.toBe('rgba(0, 0, 0, 0)')
  await page.mouse.move(0, 0)
  expect(
    await page
      .locator('[aria-label="variant plain icon"]')
      .evaluate((el) => el.querySelector('svg use')?.getAttribute('href') ?? ''),
  ).toBe('#i-globe')
  expect(
    await page.locator('[aria-label="variant plain icon"]').evaluate((el) => el.querySelectorAll('.select-icon').length),
  ).toBe(0)

  const placeholderSample = page.getByRole('combobox', { name: 'select placeholder', exact: true })
  expect((await placeholderSample.textContent())?.trim()).not.toBe('Dark')
  await placeholderSample.click()
  await page.waitForSelector('.select-popup:visible')
  await page.waitForTimeout(300)
  /* 进入只由弹层一层承担：选项行本身不做逐行进入，也不带位移 */
  const rowMotion = await page.evaluate(() => {
    const popup = [...document.querySelectorAll('.select-popup')].find((el) => el.getBoundingClientRect().height > 0)!
    const row = popup.querySelector('[role=option]')!
    return { 名: getComputedStyle(row).animationName, 变换: getComputedStyle(row).transform }
  })
  expect(rowMotion.名).toBe('none')
  expect(rowMotion.变换).toBe('none')
  await page.locator('.select-popup:visible [role=option]', { hasText: 'Dark' }).first().click()
  /* 弹层在退场期间保持打开时的宽度，不跟着触发器改宽改位；标签在它完全消失之后才填上 */
  const exitWidths: number[] = []
  for (let index = 0; index < 4; index += 1) {
    exitWidths.push(
      await page.evaluate(() => Math.round(document.querySelector('.select-popup')?.getBoundingClientRect().width ?? 0)),
    )
    await page.waitForTimeout(20)
  }
  expect([...new Set(exitWidths.filter((width) => width > 0))].length).toBeLessThanOrEqual(1)
  await expect(placeholderSample).toContainText('Dark')
  /* 退场只淡出：带 data-ending-style 时仍不得有位移或缩放 */
  await page.waitForTimeout(30)
  const leaving = await page.evaluate(() => {
    const popup = document.querySelector('.select-popup')
    if (popup == null) return { 变换: 'none', 结束态: false }
    return {
      变换: getComputedStyle(popup).transform,
      结束态: popup.hasAttribute('data-ending-style'),
    }
  })
  expect(leaving.变换).toBe('none')
  await page.waitForTimeout(300)

  /* 反色档：字段底取反色族；空值项选中后触发器回到占位文字 */
  expect(
    await page.locator('[aria-label="variant inverse"]').evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe(
    hexToRgb(
      await page.evaluate(() =>
        getComputedStyle(document.querySelector('.celadon') ?? document.documentElement)
          .getPropertyValue('--background-inverse')
          .trim(),
      ),
    ),
  )
  /* 反色档与按钮同一形态：自带深底浅字。底色与字色都从 token 取，断言里不写死色值 */
  const inverseRead = await page.locator('[aria-label="variant inverse"]').evaluate((el) => ({
    底: getComputedStyle(el).backgroundColor,
    字: getComputedStyle(el).color,
    高: (el as HTMLElement).offsetHeight,
  }))
  const inverseTokens = await page.evaluate(() => {
    const root = getComputedStyle(document.querySelector('.celadon') ?? document.documentElement)
    return {
      底: root.getPropertyValue('--background-inverse').trim(),
      字: root.getPropertyValue('--text-inverse').trim(),
      悬停: root.getPropertyValue('--background-inverse-hover').trim(),
    }
  })
  expect(inverseRead.底).toBe(hexToRgb(inverseTokens.底))
  expect(inverseRead.字).toBe(hexToRgb(inverseTokens.字))

  /* 选中并聚焦之后（焦点会回到触发器）反色档仍保持反色底、反色字与无描边：
     触发器聚焦只撤掉环，描边与底色都归各档自己 */
  await page.getByRole('combobox', { name: 'variant inverse', exact: true }).click()
  await page.waitForSelector('.select-popup:visible')
  await page.waitForTimeout(250)
  await page.locator('.select-popup:visible [role=option]').first().click()
  await page.waitForTimeout(400)
  const inverseFocused = await page.locator('[aria-label="variant inverse"]').evaluate((el) => ({
    底: getComputedStyle(el).backgroundColor,
    字: getComputedStyle(el).color,
    框: getComputedStyle(el).borderTopColor,
    高: (el as HTMLElement).offsetHeight,
    聚焦: el.matches(':focus'),
  }))
  expect(inverseFocused.聚焦).toBe(true)
  expect(inverseFocused.底).toBe(hexToRgb(inverseTokens.底))
  expect(inverseFocused.字).toBe(hexToRgb(inverseTokens.字))
  expect(inverseFocused.框).toBe('rgba(0, 0, 0, 0)')
  expect(inverseFocused.高).toBe(inverseRead.高)

  /* 悬停时也不描边：基础档的悬停规则权重更高，反色档不复位描边就会补出一条灰边 */
  await page.locator('[aria-label="variant inverse"]').hover()
  await page.waitForTimeout(200)
  expect(
    await page.locator('[aria-label="variant inverse"]').evaluate((el) => getComputedStyle(el).borderTopColor),
  ).toBe('rgba(0, 0, 0, 0)')
  expect(
    await page.locator('[aria-label="variant inverse"]').evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe(hexToRgb(inverseTokens.悬停))

  /* 再点一次已选中项即取消选择：默认行为，不需要开关。先选一个值，再点同一个值 */
  const reselectSample = page.getByRole('combobox', { name: 'select placeholder', exact: true })
  const chooseOption = async (label: string) => {
    await reselectSample.click()
    await page.waitForSelector('.select-popup:visible')
    await page.waitForTimeout(300)
    await page.locator('.select-popup:visible [role=option]', { hasText: label }).first().click()
    await page.waitForTimeout(300)
  }
  await chooseOption('Light')
  await expect(reselectSample).toHaveText('Light')
  await chooseOption('Light')
  await expect(reselectSample).not.toHaveText('Light')

  /* 空态：没有选项时弹层给说明，触发器显示占位文字 */
  expect(await selectTrigger('select empty').textContent()).not.toBe('')
  await selectTrigger('select empty').click()
  await expect(page.locator('.select-popup__empty')).not.toBeEmpty()
  await page.keyboard.press('Escape')

  /* 输入：七个状态逐个有样例，静态态类与错误态都要真的改变被绘制元素的样式，不能只看类名 */
  const stateIds = [
    'demo-state-default',
    'demo-state-hover',
    'demo-state-focus',
    'demo-state-disabled',
    'demo-state-error',
    'demo-state-loading',
    'demo-state-empty',
  ]
  for (const id of stateIds) {
    await expect(page.locator(`#${id}`)).toBeVisible()
  }

  /* number 的原生步进器由浏览器绘制，不受设计控制，暗色下会呈浅色块并挤占文字区：
     字段要把它去掉外观；主题要声明 color-scheme，其余原生控件才会跟随主题。 */
  expect(await page.locator('#demo-number').evaluate((el) => getComputedStyle(el).appearance)).toBe('textfield')
  expect(
    await page.evaluate(
      () => getComputedStyle(document.querySelector('.celadon') ?? document.documentElement).colorScheme,
    ),
  ).toBe('light')

  const borderOf = (id: string) =>
    page.locator(`#${id}`).evaluate((el) => getComputedStyle(el).borderTopColor)
  const bgOf = (id: string) =>
    page.locator(`#${id}`).evaluate((el) => getComputedStyle(el).backgroundColor)
  const colorOf = (id: string) => page.locator(`#${id}`).evaluate((el) => getComputedStyle(el).color)

  const [defaultBorder, hoverBorder, focusBorder, stateErrorBorder] = await Promise.all([
    borderOf('demo-state-default'),
    borderOf('demo-state-hover'),
    borderOf('demo-state-focus'),
    borderOf('demo-state-error'),
  ])
  expect(hoverBorder).not.toBe(defaultBorder)
  expect(focusBorder).not.toBe(defaultBorder)
  expect(stateErrorBorder).not.toBe(defaultBorder)
  expect(stateErrorBorder).not.toBe(hoverBorder)

  const [defaultBg, disabledBg] = await Promise.all([
    bgOf('demo-state-default'),
    bgOf('demo-state-disabled'),
  ])
  expect(disabledBg).not.toBe(defaultBg)
  await expect(page.locator('#demo-state-disabled')).toBeDisabled()

  /* 加载态不改文字色：它由右侧槽位的圆环表达，值保持正文色 */
  const [defaultText, loadingText] = await Promise.all([
    colorOf('demo-state-default'),
    colorOf('demo-state-loading'),
  ])
  expect(loadingText).toBe(defaultText)

  await expect(page.locator('#demo-state-empty')).toHaveValue('')
  await expect(page.locator('#demo-state-empty')).toHaveAttribute('placeholder', 'empty')

  /* 加载态用**四分之一圆环**：看得见、真的在转，且不改变字段的底色、文字色与裁剪。 */
  const loadingField = page.locator('.field:has(#demo-state-loading)')
  const loadingInput = page.locator('#demo-state-loading')
  const spinner = loadingField.locator('.spinner')
  await expect(spinner).toHaveCount(1)
  await expect(spinner).toBeVisible()

  /* 形状是内联 SVG 的填充路径：外弧 + 圆帽 + 收尖的尾（边框端头由斜接决定，做不出圆帽）。
     **两瓣互成 180°**：只画一瓣读不出圆，两瓣互成 180° 才既读得出圆又看得出在转。
     颜色用 currentColor 跟随所在控件，尺寸取 token。 */
  const ring = await spinner.evaluate((el) => {
    const cs = getComputedStyle(el)
    const paths = Array.from(el.querySelectorAll('path'))
    return {
      tag: el.tagName.toLowerCase(),
      size: [cs.inlineSize, cs.blockSize],
      fill: cs.fill,
      color: cs.color,
      d: paths.map((path) => path.getAttribute('d') ?? ''),
      turns: paths.map((path) => path.getAttribute('transform') ?? ''),
      name: cs.animationName,
      duration: cs.animationDuration,
      iteration: cs.animationIterationCount,
      loop: cs.getPropertyValue('--duration-loop').trim(),
    }
  })
  expect(ring.tag).toBe('svg')
  expect(ring.size).toEqual(['16px', '16px'])
  expect(ring.fill).toBe(ring.color)
  expect(ring.d).toHaveLength(2)
  expect(ring.d[0]).toBe(ring.d[1])
  expect(ring.d[0]).toContain('A')
  expect(ring.d[0]).toContain('Q')
  expect(ring.d[0].endsWith('Z')).toBe(true)
  expect(ring.turns[0]).toBe('')
  expect(ring.turns[1]).toBe('rotate(180 8 8)')
  expect(ring.name).toBe('spinner-spin')
  expect(ring.iteration).toBe('infinite')
  const loopSeconds = ring.loop.endsWith('ms') ? parseFloat(ring.loop) / 1000 : parseFloat(ring.loop)
  expect(Math.abs(parseFloat(ring.duration) - loopSeconds)).toBeLessThan(0.001)

  /* 一周时长可逐实例覆盖：默认取 --duration-loop，给了 --spinner-duration 就听它的 */
  await spinner.evaluate((el) => el.style.setProperty('--spinner-duration', '400ms'))
  expect(await spinner.evaluate((el) => getComputedStyle(el).animationDuration)).toBe('0.4s')
  await spinner.evaluate((el) => el.style.removeProperty('--spinner-duration'))
  expect(await spinner.evaluate((el) => getComputedStyle(el).animationDuration)).toBe(ring.duration)

  /* 指示器落在右侧预留带里（槽位 32 宽、离右边缘 4，旋转时包围盒最大约 27），不与值重叠 */
  const spinnerBox = await spinner.boundingBox()
  const boxBox = await loadingField.locator('.field__box').boundingBox()
  expect(spinnerBox!.width).toBeGreaterThanOrEqual(12)
  expect(spinnerBox!.x + spinnerBox!.width).toBeLessThanOrEqual(boxBox!.x + boxBox!.width + 1)
  expect(spinnerBox!.x).toBeGreaterThanOrEqual(boxBox!.x + boxBox!.width - 40)
  expect(await loadingInput.evaluate((el) => getComputedStyle(el).paddingInlineEnd)).toBe(
    await loadingInput.evaluate((el) => getComputedStyle(el).getPropertyValue('--spacing-32').trim()),
  )

  /* 加载是叠加指示器，不许重新给字段着色：底色、文字色、裁剪都要与默认态一致 */
  const paintOf = (locator: typeof loadingInput) =>
    locator.evaluate((el) => {
      const cs = getComputedStyle(el)
      return [cs.backgroundColor, cs.color, cs.backgroundClip, cs.backgroundImage].join('|')
    })
  expect(await paintOf(loadingInput)).toBe(await paintOf(page.locator('#demo-state-default')))
  await expect(loadingInput).toHaveAttribute('aria-busy', 'true')

  /* 按钮的加载态仍用圆环：它需要占用内容位置，与输入框的边框流光分工不同。
     每一个加载按钮都要有指示器（不写死数量，加了样例也不会失效）。 */
  const buttonSpinner = page.locator('.button.is-loading .spinner')
  expect(await buttonSpinner.count()).toBe(await page.locator('.button.is-loading').count())
  expect(await buttonSpinner.count()).toBeGreaterThan(0)
  await expect(buttonSpinner.first()).toBeVisible()

  /* 错误态的类必须落在控件本体上：设计类的规则写在 `.input` 上 */
  await expect(errorField).toHaveClass(/is-error/)
  expect(await borderOf('demo-error')).not.toBe(defaultBorder)

  /* 错误是持续状态：悬停不改红边，聚焦描边取危险色而不是品牌色。
     悬停规则的选择器权重更高，所以错误规则必须带上悬停与聚焦的变体。 */
  const errorIdle = await borderOf('demo-state-error')
  await page.locator('#demo-state-error').hover()
  expect(await borderOf('demo-state-error')).toBe(errorIdle)

  /* 悬停与焦点有 120ms 过渡，量稳态前必须等它走完，否则读到的是中间值 */
  const settle = () => page.waitForTimeout(200)

  await page.locator('#demo-error').focus()
  await settle()
  expect(await borderOf('demo-error')).toBe(errorIdle)
  const errorShadow = await page
    .locator('#demo-error')
    .evaluate((el) => getComputedStyle(el).boxShadow)
  expect(errorShadow).toContain(stateErrorBorder)

  /* 正常字段的悬停仍按悬停色变化，证明上面的规则只作用于错误态 */
  await page.mouse.move(4, 4)
  await page.locator('#demo-state-default').hover()
  await settle()
  expect(await borderOf('demo-state-default')).toBe(hoverBorder)

  /* 聚焦优先于悬停：鼠标停在已聚焦的字段上，边框仍是品牌色，不会退回悬停色 */
  await page.mouse.move(4, 4)
  await page.locator('#demo-required').focus()
  await settle()
  const focusOnly = await borderOf('demo-required')
  expect(focusOnly).toBe(focusBorder)
  await page.locator('#demo-required').hover()
  await settle()
  expect(await borderOf('demo-required')).toBe(focusOnly)

  /* 悬停与焦点的过渡照 F4 场景表：属性是边框与描边，时长取 --duration-fast，缓动取 --easing-standard */
  const motion = await page.locator('#demo-required').evaluate((el) => {
    const cs = getComputedStyle(el)
    const root = getComputedStyle(el)
    return {
      props: cs.transitionProperty,
      durations: cs.transitionDuration.split(',').map((v) => v.trim()),
      easings: cs.transitionTimingFunction.split(',').map((v) => v.trim()),
      fast: root.getPropertyValue('--duration-fast').trim(),
      standard: root.getPropertyValue('--easing-standard').trim(),
    }
  })
  expect(motion.props).toContain('border-color')
  expect(motion.props).toContain('box-shadow')
  expect(motion.fast).not.toBe('')
  const fastSeconds = motion.fast.endsWith('ms')
    ? parseFloat(motion.fast) / 1000
    : parseFloat(motion.fast)
  expect(fastSeconds).toBeGreaterThan(0)
  for (const duration of motion.durations) {
    expect(Math.abs(parseFloat(duration) - fastSeconds)).toBeLessThan(0.001)
  }
  /* 缓动按数值比；三层各有一份曲线，不能按逗号切（函数参数里也有逗号） */
  const standardCurve = curveNumbers(motion.standard)
  const actualCurves = curveNumbers(motion.easings.join(','))
  expect(standardCurve.length).toBe(4)
  expect(actualCurves.length).toBe(standardCurve.length * 3)
  for (let i = 0; i < actualCurves.length; i += standardCurve.length) {
    expect(actualCurves.slice(i, i + standardCurve.length)).toEqual(standardCurve)
  }

  /* 错误抖动是**可选**的一次性反馈：默认不挂类，点了重放才加上。
     时长与缓动照 F4 的 shake 场景，关键帧只动 transform。 */
  await expect(page.locator('#demo-shake')).not.toHaveClass(/is-shake/)
  await page.getByRole('button', { name: 'replay' }).click()
  const shaken = page.locator('#demo-shake')
  await expect(shaken).toHaveClass(/is-shake/)
  const shakeMotion = await shaken.evaluate((el) => {
    const cs = getComputedStyle(el)
    return {
      name: cs.animationName,
      duration: cs.animationDuration,
      easing: cs.animationTimingFunction,
      slow: cs.getPropertyValue('--duration-slow').trim(),
      standard: cs.getPropertyValue('--easing-standard').trim(),
    }
  })
  expect(shakeMotion.name).toBe('shake-invalid')
  const slowSeconds = shakeMotion.slow.endsWith('ms')
    ? parseFloat(shakeMotion.slow) / 1000
    : parseFloat(shakeMotion.slow)
  expect(Math.abs(parseFloat(shakeMotion.duration) - slowSeconds)).toBeLessThan(0.001)
  expect(curveNumbers(shakeMotion.easing)).toEqual(curveNumbers(shakeMotion.standard))

  const shakeProps = await page.evaluate(() => {
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList
      try {
        rules = sheet.cssRules
      } catch {
        continue
      }
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSKeyframesRule && rule.name === 'shake-invalid') {
          return Array.from(rule.cssRules)
            .map((frame) => (frame as CSSKeyframeRule).style.cssText)
            .join('; ')
        }
      }
    }
    return ''
  })
  expect(shakeProps).toContain('translateX')
  for (const forbidden of ['width', 'height', 'top', 'left', 'margin']) {
    expect(shakeProps).not.toContain(forbidden)
  }

  /* 连续错误自动重播：等第一次播完（组件自己摘类），再点一次，动画必须重新在跑。
     调用方只让触发值变化，不需要先把它置回 false。 */
  await page.waitForTimeout(450)
  expect(await shaken.evaluate((el) => el.getAnimations().map((a) => a.playState))).not.toContain('running')
  await page.getByRole('button', { name: 'replay' }).click()
  await expect(shaken).toHaveClass(/is-shake/)
  expect(await shaken.evaluate((el) => el.getAnimations().map((a) => a.playState))).toContain('running')

  /* 浅色与暗色成对，按设计红线各出一张 */
  await shot(page, 'light')
  const lightFieldBg = await bgOf('demo-state-default')
  await page.emulateMedia({ colorScheme: 'dark' })
  /* 主题在**页面载入时**决定（跟随系统），改媒体偏好后必须重载，页面才会真的切到暗色；
     不重载则这一段量到的仍是浅色的值，断言自洽但无效。 */
  await page.reload({ waitUntil: 'networkidle' })

  /* 暗色下原生控件要跟随主题，否则滚动条与未清理的表单控件会呈浅色块 */
  expect(
    await page.evaluate(
      () => getComputedStyle(document.querySelector('.celadon') ?? document.documentElement).colorScheme,
    ),
  ).toBe('dark')
  /* 重载后确认真的落在暗色主题：字段底与浅色时不同 */
  expect(await bgOf('demo-state-default')).not.toBe(lightFieldBg)

  /* 暗色下同一条规则同样成立：错误边框不因悬停改变，且与正常字段的边框不同。
     切主题会换 token 值，边框随之走一次过渡，量之前必须等它走完。 */
  await settle()
  await page.mouse.move(4, 4)
  await settle()
  const [darkDefault, darkError] = await Promise.all([
    borderOf('demo-state-default'),
    borderOf('demo-state-error'),
  ])
  expect(darkError).not.toBe(darkDefault)
  await page.locator('#demo-state-error').hover()
  await settle()
  expect(await borderOf('demo-state-error')).toBe(darkError)

  /* 暗色下加载指示器同样在转，且同样不重新给字段着色 */
  const darkRing = await spinner.evaluate((el) => {
    const cs = getComputedStyle(el)
    return { name: cs.animationName, fill: cs.fill, color: cs.color }
  })
  expect(darkRing.name).toBe('spinner-spin')
  expect(darkRing.fill).toBe(darkRing.color)
  expect(await paintOf(loadingInput)).toBe(await paintOf(page.locator('#demo-state-default')))

  await shot(page, 'dark')
})

/* 复选框：选中底取反色族而不是品牌色（选中是持续状态，要自己成立，不是交互中的临时高亮），
   未选中的边界只对内容底成立并核到 3:1，不确定态换一条横杠，禁用与错误都要看得出选没选。
   浅暗两套各量一次，尺寸档同时核到像素。 */
test('draws the checkbox with an inverse checked state and a compliant boundary', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1100 })

  const read = (id: string) =>
    page.locator(`.checkbox:has(#${id}) .checkbox__box`).evaluate((box) => {
      const cs = getComputedStyle(box)
      return {
        底: cs.backgroundColor,
        框: cs.borderTopColor,
        标记: cs.color,
        横杠: Boolean(box.querySelector('.checkbox__dash')),
        高: (box as HTMLElement).offsetHeight,
        左: Math.round(box.getBoundingClientRect().left),
      }
    })

  for (const theme of ['light', 'dark'] as const) {
    /* 主题在**页面载入时**决定（跟随系统），改媒体偏好后必须重载；载入后先确认真的切过去了，
       否则量到的还是上一套，断言会自洽但无效。 */
    await page.emulateMedia({ colorScheme: theme })
    await page.goto('/app/scaffold/base', { waitUntil: 'networkidle' })
    expect(
      await page.evaluate(
        () => getComputedStyle(document.querySelector('.celadon') ?? document.documentElement).colorScheme,
      ),
    ).toBe(theme)

    /* 两套主题的 token 取值不同，本轮才读，浅色读到的值不能拿去比暗色 */
    const tokens = await page.evaluate(() => {
      const root = getComputedStyle(document.querySelector('.celadon') ?? document.documentElement)
      const pick = (name: string) => root.getPropertyValue(name).trim()
      return {
        反色底: pick('--background-inverse'),
        反色字: pick('--text-inverse'),
        悬停底: pick('--background-hover'),
        内容底: pick('--background-surface'),
        强边界: pick('--border-control-strong'),
        品牌: pick('--brand'),
        禁用底: pick('--background-disabled'),
        危险: pick('--danger'),
        主文字: pick('--text-primary'),
        次文字: pick('--text-secondary'),
      }
    })
    const [off, on, partial, disabled, invalid] = await Promise.all([
      read('demo-check-default'),
      read('demo-check-checked'),
      read('demo-check-partial'),
      read('demo-check-disabled'),
      read('demo-check-invalid'),
    ])

    /* 未选中：不填底，边界只对内容底成立，要 ≥ 3:1（1.4.11） */
    expect(off.底).toBe('rgba(0, 0, 0, 0)')
    expect(off.框).toBe(hexToRgb(tokens.强边界))
    expect(contrast(off.框, hexToRgb(tokens.内容底))).toBeGreaterThanOrEqual(3)

    /* 选中：反色底与反色标记，且不等于品牌色 */
    expect(on.底).toBe(hexToRgb(tokens.反色底))
    expect(on.底).not.toBe(hexToRgb(tokens.品牌))
    expect(on.标记).toBe(hexToRgb(tokens.反色字))

    /* 不确定：同一处理，标记换成横杠 */
    expect(partial.底).toBe(hexToRgb(tokens.反色底))
    expect(partial.横杠).toBe(true)

    /* 禁用与错误：禁用只换底，错误只换边界 */
    expect(disabled.底).toBe(hexToRgb(tokens.禁用底))
    expect(invalid.框).toBe(hexToRgb(tokens.危险))

    /* 悬停画在**表面**上：整行一层浅底，方框的底与边界一律不动。
       这样"选中"（反色填充）与"悬停"（表面浅底）各占一个通道，选中之后也表达得出悬停 */
    const hoverTarget = page.locator('.checkbox:has(#demo-check-default)')
    /* 表面画在行的伪元素上：读数取伪元素，另外核它四周让出的呼吸位（不贴边） */
    const rowPaint = (id: string) =>
      page.locator(`.checkbox:has(#${id}) .checkbox__row`).evaluate((el) => {
        const cs = getComputedStyle(el, '::before')
        return {
          底: cs.backgroundColor,
          左: cs.insetInlineStart || cs.left,
          右: cs.insetInlineEnd || cs.right,
          上: cs.insetBlockStart || cs.top,
          下: cs.insetBlockEnd || cs.bottom,
        }
      })
    await page.mouse.move(2, 2)
    await page.waitForTimeout(150)
    const restBox = await read('demo-check-default')
    const restRow = await rowPaint('demo-check-default')
    const restLabel = await hoverTarget.locator('.checkbox__label').evaluate((el) => getComputedStyle(el).color)
    expect(restRow.底).toBe('rgba(0, 0, 0, 0)')
    expect(restLabel).toBe(hexToRgb(tokens.次文字))
    await hoverTarget.locator('.checkbox__label').hover()
    await page.waitForTimeout(150)
    const hoverBox = await read('demo-check-default')
    const hoverRow = await rowPaint('demo-check-default')
    const hoverLabel = await hoverTarget.locator('.checkbox__label').evaluate((el) => getComputedStyle(el).color)
    expect(hoverRow.底).toBe(hexToRgb(tokens.悬停底))
    expect(hoverRow.底).not.toBe(restRow.底)
    /* 内容不贴边：表面向两侧各让出 8（列表项的内距档）、上下各让出 4，而方框与标签的位置不动 */
    expect(hoverRow.左).toBe('-8px')
    expect(hoverRow.右).toBe('-8px')
    expect(hoverRow.上).toBe('-4px')
    expect(hoverRow.下).toBe('-4px')
    expect(hoverBox.左).toBe(restBox.左)
    expect(hoverBox.底).toBe(restBox.底)
    expect(hoverBox.框).toBe(restBox.框)
    expect(hoverLabel).toBe(hexToRgb(tokens.主文字))
    expect(hoverLabel).not.toBe(restLabel)
    expect(contrast(hoverLabel, hexToRgb(tokens.内容底))).toBeGreaterThanOrEqual(4.5)

    /* 多行标签：方框与**首行**对齐（不是整块居中），文字折行落到方框下方；
       上下留白因此一定大于行间距：表面 4 + 标签内距 4 + 行盒天然空隙 5 = 13，行间距 10 */
    const multiline = await page.locator('.checkbox:has(#demo-check-long)').evaluate((el) => {
      const row = el.querySelector('.checkbox__row') as HTMLElement
      const box = el.querySelector('.checkbox__box') as HTMLElement
      const label = el.querySelector('.checkbox__label') as HTMLElement
      const cs = getComputedStyle(label)
      const lineHeight = parseFloat(cs.lineHeight)
      const fontSize = parseFloat(cs.fontSize)
      return {
        行高: row.offsetHeight,
        行数: Math.round(label.offsetHeight / lineHeight),
        方框中心: box.getBoundingClientRect().top + box.offsetHeight / 2 - row.getBoundingClientRect().top,
        首行中心: parseFloat(cs.paddingBlockStart) + lineHeight / 2,
        行块中心: row.offsetHeight / 2,
        上下留白: parseFloat(cs.paddingBlockStart) + 4 + (lineHeight - fontSize) / 2,
        行间距: lineHeight - fontSize,
      }
    })
    expect(multiline.行数).toBeGreaterThan(1)
    expect(multiline.方框中心).toBe(multiline.首行中心)
    expect(multiline.方框中心).not.toBe(multiline.行块中心)
    expect(multiline.上下留白).toBeGreaterThan(multiline.行间距)

    /* 已选中：同样只有表面变，方框的填充与边界不动 */
    await page.mouse.move(2, 2)
    await page.waitForTimeout(100)
    const checkedRest = await read('demo-check-checked')
    await page.locator('.checkbox:has(#demo-check-checked) .checkbox__label').hover()
    await page.waitForTimeout(150)
    expect(await read('demo-check-checked')).toEqual(checkedRest)
    expect((await rowPaint('demo-check-checked')).底).toBe(hexToRgb(tokens.悬停底))
    /* 静态样例与真实悬停同值：清单页那两档就是照它核对的 */
    expect((await rowPaint('demo-check-hover')).底).toBe(hoverRow.底)
    expect((await rowPaint('demo-check-checked-hover')).底).toBe(hoverRow.底)

    /* 悬停与聚焦是频繁重复的微交互，按 F4 的"不该动"一栏不做过渡（只动 transform 与 opacity） */
    const durations = await page.evaluate(() => {
      const box = document.querySelector('.checkbox__box') as HTMLElement
      const label = document.querySelector('.checkbox__label') as HTMLElement
      return [getComputedStyle(box).transitionDuration, getComputedStyle(label).transitionDuration]
    })
    expect(durations).toEqual(['0s', '0s'])

    /* 只读没有悬停：表面、方框与标签都保持静止档（指针落在文字上也是一样） */
    await page.mouse.move(2, 2)
    await page.waitForTimeout(100)
    const readonlyRest = await read('demo-check-readonly')
    const readonlyLabelRest = await page
      .locator('.checkbox:has(#demo-check-readonly) .checkbox__label')
      .evaluate((el) => getComputedStyle(el).color)
    await page.locator('.checkbox:has(#demo-check-readonly) .checkbox__label').hover()
    await page.waitForTimeout(150)
    const readonlyHover = await read('demo-check-readonly')
    expect(readonlyHover.底).toBe(readonlyRest.底)
    expect(readonlyHover.框).toBe(readonlyRest.框)
    expect(await rowPaint('demo-check-readonly')).toEqual({
      底: 'rgba(0, 0, 0, 0)',
      左: '-8px',
      右: '-8px',
      上: '-4px',
      下: '-4px',
    })
    expect(
      await page.locator('.checkbox:has(#demo-check-readonly) .checkbox__label').evaluate((el) => getComputedStyle(el).color),
    ).toBe(readonlyLabelRest)

    /* 勾与横杠的出现照 F4 的 fade 场景：--duration-base 加减速缓动 */
    const mark = await page.locator('.checkbox:has(#demo-check-checked) .checkbox__mark').evaluate((el) => {
      const cs = getComputedStyle(el)
      return { name: cs.animationName, duration: cs.animationDuration }
    })
    expect(mark.name).toBe('celadon-checkbox-mark-in')
    expect(mark.duration).toBe('0.2s')
  }

  /* 尺寸档与按钮同梯：小 12 · 中 16 · 大 20 的方框，行高依次 24 · 32 · 40（按钮的三档高度） */
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/app/scaffold/base', { waitUntil: 'networkidle' })
  const sizes = await page.evaluate(() =>
    ['demo-check-small', 'demo-check-medium', 'demo-check-large'].map((id) => {
      const field = document.querySelector(`.checkbox:has(#${id})`) as HTMLElement
      const box = field.querySelector('.checkbox__box') as HTMLElement
      const row = field.querySelector('.checkbox__row') as HTMLElement
      const label = field.querySelector('.checkbox__label') as HTMLElement
      return {
        方框: box.offsetHeight,
        行高: row.offsetHeight,
        标签: label.offsetHeight,
        字号: parseFloat(getComputedStyle(label).fontSize),
      }
    }),
  )
  expect(sizes.map((s) => s.方框)).toEqual([12, 16, 20])
  expect(sizes.map((s) => s.行高)).toEqual([24, 32, 40])
  expect(sizes.map((s) => s.标签)).toEqual([24, 32, 40])
  expect(sizes.map((s) => s.字号)).toEqual([12, 14, 16])

  /* 错误由调用方持有：选中即清除，红边与红字都要消失 */
  const danger = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.celadon') ?? document.documentElement).getPropertyValue('--danger').trim(),
  )
  expect((await read('demo-check-invalid')).框).toBe(hexToRgb(danger))
  await page.locator('.checkbox:has(#demo-check-invalid) .checkbox__box').click()
  await page.waitForTimeout(200)
  expect((await read('demo-check-invalid')).框).not.toBe(hexToRgb(danger))
  await expect(page.locator('.checkbox:has(#demo-check-invalid) .checkbox__error')).toHaveCount(0)
})
