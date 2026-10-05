import { expect, test, type Page } from '@playwright/test'
import { join } from 'node:path'
import { capturePage, shotDir } from '../../../../../../scripts/shots.mjs'

/* 基础件清单页：分组卡片、状态覆盖与浅暗两套主题。
   断言只看用户看得见的东西（可见文字、角色、可访问属性与真实计算样式），不看内部结构。
   配色不断言字面色值，而是比较两个变体的计算值：去掉反色类或错误文字类，这里就会红。 */

const SHOTS = shotDir('base-page')
const shot = (page: Page, name: string) => capturePage(page, join(SHOTS, `${name}.png`))

test('lists the five groups and their states', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1100 })
  await page.goto('/app/scaffold/base')

  /* 分组标题走四语语言包，默认语言是中文；组件名保留英文作为 API 名称（本地化文档的惯例） */
  await expect(page.locator('.base-group__title')).toHaveText([
    '输入 Input',
    '按钮 Button',
    '选择器 Select',
    '图标与品牌 Icon & BrandMark',
    '主题与语言 Theme & Locale',
  ])
  /* 子组标题同样随语言走，证明页面文案确实接进了语言包 */
  await expect(page.locator('.base-subgroup__title').first()).toHaveText('属性')
  await expect(page.getByText('显示在字段下方')).toBeVisible()
  await expect(page.getByText('以危险色显示')).toBeVisible()

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
  const errorText = page.getByText('以危险色显示')
  await expect(errorText).toBeVisible()
  await expect(errorText).toHaveClass(/hint-error/)
  const [errorColor, hintColor] = await Promise.all([
    errorText.evaluate((el) => getComputedStyle(el).color),
    page.getByText('显示在字段下方').evaluate((el) => getComputedStyle(el).color),
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

  /* 按钮：反色与常规档的计算底色必须不同，加载态禁用并带 aria-busy，整宽档比常规档宽 */
  const inverse = page.getByRole('button', { name: 'inverse' })
  const soft = page.getByRole('button', { name: 'soft' })
  await expect(inverse).toBeVisible()
  const [inverseBg, softBg] = await Promise.all([
    inverse.evaluate((el) => getComputedStyle(el).backgroundColor),
    soft.evaluate((el) => getComputedStyle(el).backgroundColor),
  ])
  expect(inverseBg).not.toBe(softBg)

  const loading = page.getByRole('button', { name: 'loading' })
  await expect(loading).toBeDisabled()
  await expect(loading).toHaveAttribute('aria-busy', 'true')
  await expect(loading).toHaveClass(/is-loading/)

  const block = page.getByRole('button', { name: '整宽（表单主操作）' })
  const [blockBox, inverseBox] = await Promise.all([block.boundingBox(), inverse.boundingBox()])
  expect(blockBox!.width).toBeGreaterThan(inverseBox!.width)

  /* 图标与品牌：四档图标都真的画出来（有尺寸），品牌标识有可访问名 */
  const icons = page.locator('.base-row svg')
  expect(await icons.count()).toBeGreaterThanOrEqual(4)
  await expect(page.getByRole('img', { name: 'Yao Agents' })).toBeVisible()

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

  const [defaultText, loadingText] = await Promise.all([
    colorOf('demo-state-default'),
    colorOf('demo-state-loading'),
  ])
  expect(loadingText).not.toBe(defaultText)

  await expect(page.locator('#demo-state-empty')).toHaveValue('')
  await expect(page.locator('#demo-state-empty')).toHaveAttribute('placeholder', 'empty')

  /* 错误态的类必须落在控件本体上：曾加在字段框上，设计类的红边因此不生效 */
  await expect(errorField).toHaveClass(/is-error/)
  expect(await borderOf('demo-error')).not.toBe(defaultBorder)

  /* 错误是持续状态：悬停不改红边，聚焦描边取危险色而不是品牌色。
     曾出现"鼠标一进来红边消失、聚焦时红边配品牌描边"，根因是悬停规则的权重高于错误规则。 */
  const errorIdle = await borderOf('demo-state-error')
  await page.locator('#demo-state-error').hover()
  expect(await borderOf('demo-state-error')).toBe(errorIdle)

  await page.locator('#demo-error').focus()
  expect(await borderOf('demo-error')).toBe(errorIdle)
  const errorShadow = await page
    .locator('#demo-error')
    .evaluate((el) => getComputedStyle(el).boxShadow)
  expect(errorShadow).toContain(stateErrorBorder)

  /* 正常字段的悬停仍按悬停色变化，证明上面的规则只作用于错误态 */
  await page.mouse.move(4, 4)
  await page.locator('#demo-state-default').hover()
  expect(await borderOf('demo-state-default')).toBe(hoverBorder)

  /* 浅色与暗色成对，按设计红线各出一张 */
  await shot(page, 'light')
  await page.emulateMedia({ colorScheme: 'dark' })

  /* 暗色下同一条规则同样成立：错误边框不因悬停改变，且与正常字段的边框不同 */
  await page.mouse.move(4, 4)
  const [darkDefault, darkError] = await Promise.all([
    borderOf('demo-state-default'),
    borderOf('demo-state-error'),
  ])
  expect(darkError).not.toBe(darkDefault)
  await page.locator('#demo-state-error').hover()
  expect(await borderOf('demo-state-error')).toBe(darkError)

  await shot(page, 'dark')
})
