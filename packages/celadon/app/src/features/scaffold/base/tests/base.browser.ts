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

  /* 按钮的加载态仍用圆环：它需要占用内容位置，与输入框的边框流光分工不同 */
  const buttonSpinner = page.locator('.button.is-loading .spinner')
  await expect(buttonSpinner).toHaveCount(1)
  await expect(buttonSpinner).toBeVisible()

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
  await page.emulateMedia({ colorScheme: 'dark' })

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
