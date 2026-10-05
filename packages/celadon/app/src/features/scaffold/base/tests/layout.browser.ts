import { expect, test } from '@playwright/test'

/* 常驻用例：按 design/layout.md 逐条核验基础件清单页。规则改动时同步改这里。
   断言全部落在可测量的事实上（计算样式与包围盒），不看内部结构。 */

const SCALE = [0, 4, 8, 12, 16, 24, 32, 48]

test('the base page obeys the layout rules', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1200 })
  await page.goto('/app/scaffold/base')

  const report = await page.evaluate((scale: number[]) => {
    const px = (v: string) => Math.round(parseFloat(v) || 0)
    const bad: string[] = []
    const notes: string[] = []

    /* 第 1 节：间距刻度与负责人。容器里出现的 gap / padding / margin 都落在 4 基数列 */
    const containers = document.querySelectorAll('.base-group, .base-grid, .base-row, .field, .field__box, .base-demo')
    for (const el of Array.from(containers)) {
      const s = getComputedStyle(el)
      const values: Array<[string, number]> = [
        ['gap', px(s.rowGap)],
        ['padding-top', px(s.paddingTop)],
        ['padding-right', px(s.paddingRight)],
        ['padding-bottom', px(s.paddingBottom)],
        ['padding-left', px(s.paddingLeft)],
        ['margin-top', px(s.marginTop)],
        ['margin-bottom', px(s.marginBottom)],
      ]
      for (const [name, value] of values) {
        if (!scale.includes(value)) bad.push(`${el.className} 的 ${name}=${value} 不在 4 基数列`)
      }
    }

    /* 第 1 节：组件不带外边距，外边距归排布者 */
    for (const root of Array.from(document.querySelectorAll('.field, .button, .base-demo'))) {
      const s = getComputedStyle(root)
      const margins: Array<[string, string]> = [
        ['margin-top', s.marginTop],
        ['margin-bottom', s.marginBottom],
        ['margin-left', s.marginLeft],
        ['margin-right', s.marginRight],
      ]
      for (const [name, value] of margins) {
        if (px(value) !== 0) bad.push(`${root.className} 自带 ${name}=${px(value)}`)
      }
    }

    /* 第 1 节：标题不得带浏览器默认外边距（它会把卡片内距顶大） */
    for (const h of Array.from(document.querySelectorAll('.base-group__title, .base-subgroup__title'))) {
      const s = getComputedStyle(h)
      if (px(s.marginTop) !== 0 || px(s.marginBottom) !== 0) {
        bad.push(`${h.className} 有默认外边距 ${s.marginTop}/${s.marginBottom}`)
      }
    }

    /* 第 2 节与第 3 节：卡片四边内距一致，且组内间距小于组与组的间距 */
    const cards = Array.from(document.querySelectorAll('.base-group'))
    cards.forEach((card, index) => {
      const s = getComputedStyle(card)
      const sides = [px(s.paddingTop), px(s.paddingRight), px(s.paddingBottom), px(s.paddingLeft)]
      notes.push(`卡片 ${index + 1} 内距 = ${sides.join(' / ')}`)
      if (new Set(sides).size !== 1) bad.push(`卡片 ${index + 1} 的四边内距不一致：${sides.join(' / ')}`)
      /* 光学内距：卡片底边到最后一个子元素底边的实际像素，必须与左右内距一致。
         曾经因为字段预留下空消息位，底部实际是内距加一行（48 对 24，用户 2026-10-06 指出）。 */
      const last = card.lastElementChild
      if (last) {
        const bottomGap = Math.round(card.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom)
        notes.push(`卡片 ${index + 1} 底部光学内距 = ${bottomGap}`)
        if (Math.abs(bottomGap - px(s.paddingLeft)) > 1) {
          bad.push(`卡片 ${index + 1} 的底部光学内距 ${bottomGap} 与左右内距 ${px(s.paddingLeft)} 不一致`)
        }
      }
      /* 卡内间距必须小于卡片内距，否则内容之间比四周还松（用户 2026-10-06 指出） */
      if (px(s.rowGap) >= px(s.paddingTop)) {
        bad.push(`卡片 ${index + 1} 的卡内间距 ${px(s.rowGap)} 不小于卡片内距 ${px(s.paddingTop)}`)
      }
      /* 子组之间的光学距离：上一个子组内容底部到下一个子组标题顶部的实际像素。
         它必须不大于卡片内距，否则中间看着比四周还空（用户两次指出的就是这一处）。 */
      const titles = Array.from(card.querySelectorAll('.base-subgroup__title'))
      for (const title of titles.slice(1)) {
        const previous = title.previousElementSibling
        if (!previous) continue
        const optical = Math.round(title.getBoundingClientRect().top - previous.getBoundingClientRect().bottom)
        notes.push(`卡片 ${index + 1} 子组间距实测 = ${optical}（卡片内距 ${px(s.paddingTop)}）`)
        if (optical > px(s.paddingTop)) {
          bad.push(`卡片 ${index + 1} 的子组间距 ${optical} 大于卡片内距 ${px(s.paddingTop)}`)
        }
      }
      const isLast = index === cards.length - 1
      if (!isLast && px(s.rowGap) >= px(s.marginBottom)) {
        bad.push(`卡片 ${index + 1} 的组内间距 ${px(s.rowGap)} 不小于组间距 ${px(s.marginBottom)}`)
      }
    })

    /* 第 6 节：点击目标。辅助按钮以 24 为下限，且不小于控件的边框内高（layout.md 第 6 节） */
    for (const button of Array.from(document.querySelectorAll('.field__trail button'))) {
      const r = button.getBoundingClientRect()
      const box = button.closest('.field__box')!
      const input = box.querySelector('input')!
      /* clientHeight 含内距、不含边框，正好是槽位可用的最大高度 */
      const innerHeight = input.clientHeight
      notes.push(`槽位按钮 ${Math.round(r.width)} × ${Math.round(r.height)}，控件边框内高 ${innerHeight}`)
      if (r.width < 24 || r.height < 24) bad.push(`槽位按钮只有 ${Math.round(r.width)} × ${Math.round(r.height)}`)
      if (r.height < innerHeight) bad.push(`槽位按钮高度 ${Math.round(r.height)} 小于控件边框内高 ${innerHeight}`)
    }

    /* 排版：字段标签的字重必须大于正文，否则标签读起来与正文一样淡（用户 2026-10-06 指出）。
       这一条把"淡"变成可判定的数字。 */
    const label = document.querySelector('.field__label')
    const bodyText = document.querySelector('.field .input')
    if (label && bodyText) {
      const labelWeight = Number(getComputedStyle(label).fontWeight)
      const bodyWeight = Number(getComputedStyle(bodyText).fontWeight)
      notes.push(`字段标签字重 ${labelWeight}，正文字重 ${bodyWeight}`)
      if (labelWeight <= bodyWeight) bad.push(`字段标签字重 ${labelWeight} 不大于正文字重 ${bodyWeight}`)
    }

    /* 字体：页面里的文字必须落在 UI 字体栈上。DevTools 曾显示标题的计算字体是 Times（浏览器默认衬线），
       说明有元素没拿到 body 上的字体。这一条把"字体对不对"变成可判定的数字。 */
    notes.push(
      `根元素 data-theme=${document.documentElement.dataset.theme ?? '(无)'}，body class=${document.body.className || '(无)'}，` +
        `body 上的 --font-family-ui=${getComputedStyle(document.body).getPropertyValue('--font-family-ui').trim() || '(空)'}，` +
        `body margin=${getComputedStyle(document.body).marginTop}，body 背景=${getComputedStyle(document.body).backgroundColor}`,
    )
    /* 上面这几项合起来能判定 shell.less 是否真的被加载：它的规则同时设了 margin 与 background */
    const styleSheets = Array.from(document.styleSheets)
      .map((sheet) => sheet.href ?? 'inline')
      .filter((href) => href !== 'inline')
    notes.push(`外链样式表 ${styleSheets.length} 份：${styleSheets.slice(0, 6).join(' | ')}`)
    const fontTargets: Array<[string, Element | null]> = [
      ['body', document.body],
      ['组标题', document.querySelector('.base-group__title')],
      ['子组标题', document.querySelector('.base-subgroup__title')],
      ['字段标签', document.querySelector('.field__label')],
      ['输入框', document.querySelector('.field .input')],
      ['按钮', document.querySelector('.button')],
    ]
    for (const [name, el] of fontTargets) {
      if (!el) continue
      const family = getComputedStyle(el).fontFamily
      notes.push(`${name} 字体 = ${family}`)
      if (/Times|serif/i.test(family) && !/sans-serif/i.test(family)) {
        bad.push(`${name} 落到了衬线字体：${family}`)
      }
    }

    /* 四语字体栈逐一验证：改 html 的 lang 之后，计算字体必须切到对应的分栈。
       这是语言分栈唯一的活体证明 —— 只断言"不是衬线"抓不到死代码（那正是它当时的形态）。
       判据取各分栈独有的字体名：简中 PingFang SC、繁中 PingFang TC、日文 Hiragino、英文 SF Pro Text。 */
    const originalLang = document.documentElement.lang
    /* 三语（简 · 繁 · 日）同一码点的字形签名，用于证明字形真的换了，而不只是声明里换了字体名 */
    const glyphSignatures: Array<[string, number]> = []
    const langCases: Array<[string, RegExp]> = [
      ['zh-CN', /PingFang SC|Microsoft YaHei|Noto Sans CJK SC/i],
      ['zh-TW', /PingFang TC|Microsoft JhengHei|Noto Sans CJK TC/i],
      ['ja', /Hiragino|Yu Gothic|Meiryo|Noto Sans CJK JP/i],
      ['en-US', /SF Pro Text|Segoe UI|Noto Sans/i],
    ]
    for (const [code, pattern] of langCases) {
      document.documentElement.lang = code
      const family = getComputedStyle(document.body).fontFamily
      notes.push(`lang=${code} 字体 = ${family.slice(0, 58)}`)
      if (!pattern.test(family)) bad.push(`lang=${code} 没有切到对应分栈：${family}`)

      /* 字形比对：同一码点在简繁日里字形不同（直 · 骨 · 今）。按当前语言的计算字体栈把它画进画布，
         取像素签名，三语签名必须互不相同。这样证明的才是「真的换了字形」，
         而不只是「声明里换了字体名」—— 字体名对、字形却掉到简中，正是要防的情况。 */
      if (!code.startsWith('en')) {
        const canvas = document.createElement('canvas')
        canvas.width = 420
        canvas.height = 140
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#fff'
        ctx.font = `90px ${family}`
        ctx.textBaseline = 'top'
        ctx.fillText('直骨今', 8, 10)
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        let signature = 0
        let ink = 0
        for (let i = 0; i < pixels.length; i += 4) {
          const on = pixels[i] > 127
          if (on) ink += 1
          signature = (signature * 31 + (on ? 1 : 0)) | 0
        }
        notes.push(`lang=${code} 字形签名=${signature}，墨迹像素=${ink}`)
        for (const [otherLang, otherSignature] of glyphSignatures) {
          if (otherSignature === signature) {
            bad.push(`${code} 与 ${otherLang} 的字形签名相同（${signature}），字形没有区分`)
          }
        }
        glyphSignatures.push([code, signature])
      }
    }
    /* 复原语言：后面的截图必须与当前语言一致，否则会交出一张语言不符的图 */
    document.documentElement.lang = originalLang

    /* 第 5 节：字段左边缘落在列轨上 */
    const xs = Array.from(document.querySelectorAll('.field')).map((el) => Math.round(el.getBoundingClientRect().x))
    notes.push('字段左边缘取值 = ' + Array.from(new Set(xs)).join(', '))
    if (new Set(xs).size > 4) bad.push(`字段左边缘出现 ${new Set(xs).size} 种取值，列轨不齐`)

    return { bad, notes }
  }, SCALE)

  console.log('LAYOUT ' + JSON.stringify(report))
  expect(report.bad).toEqual([])
})
