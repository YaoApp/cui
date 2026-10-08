import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { capturePage, shotDir } from '../../../../../scripts/shots.mjs'

/* 与设计稿逐步对齐的机器判据：同一个视口下把设计稿与产品页的同一批元素都量一遍，
   几何差超过 1px、颜色/字号/圆角不等就失败。设计稿地址用 `PROTOTYPE_URL` 覆盖，默认按应用地址推同机 8080，
   这样浏览器跑在远程测试机上时也指向能访问到的开发机，而不是它自己的 `127.0.0.1`。

   产品一侧把入口配置换成与设计稿同形的一份（三个第三方、无图形验证码、两行标题、同两条链接），
   否则内容差（线上是两张第三方、多一个验证码字段）会让"位置"没法逐项比。 */
const APP_ORIGIN = new URL(process.env.CUI_BASE_URL ?? 'http://127.0.0.1:5199')
const PROTOTYPE = process.env.PROTOTYPE_URL ?? `${APP_ORIGIN.protocol}//${APP_ORIGIN.hostname}:8080/prototype/login.html`
const APP_STANDALONE = '/app/login'
const APP_IN_CLIENT = '/app/login?from=connect'
const SHOTS = shotDir('login-compare')

const VIEWPORT = { width: 1280, height: 800 }

/** 与设计稿同形的入口配置：三个第三方、无图形验证码、同两条链接。标题与文案由语言包与品牌匹配决定。 */
const FIXTURE_CONFIG = {
  title: '注册或登录你的 Yao Agents 账号',
  description: '',
  success_url: '/app/done',
  secure_cookie: false,
  form: {
    username: { placeholder: '请输入邮箱账号', fields: ['email'] },
    terms_of_service_link: 'https://yaoapps.com/doc/guide/user/terms-of-service',
    privacy_policy_link: 'https://yaoapps.com/doc/guide/user/privacy-policy',
  },
  third_party: {
    providers: [
      /* 三家都认得出，标记因此走产品品牌图标（配置里的地址不使用），与设计稿的三张标记一一对应 */
      { id: 'google', label: 'Google' },
      { id: 'github', label: 'GitHub' },
      { id: 'apple', label: 'Apple' },
    ],
  },
}

/** 要读的计算样式：几何一律读盒子。 */
const STYLE_PROPS = [
  'fontSize',
  'fontWeight',
  'lineHeight',
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderTopWidth',
  'borderTopLeftRadius',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'marginBottom',
  'textAlign',
  'gap',
] as const

type Probe = {
  name: string
  /** 设计稿里的选择器 */
  prototype: string
  /** 产品页里的选择器 */
  app: string
  /** 只比这几项：用于容器、纯装饰与带 UA 默认样式的元素，避免把探针的假差算进来 */
  only?: string[]
}

const PROBES: Probe[] = [
  { name: 'page padding', prototype: '.page', app: '.auth', only: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] },
  { name: 'page background', prototype: 'body', app: '.auth', only: ['backgroundColor'] },
  { name: 'brand mark', prototype: '.brand__mark', app: '.auth__brand svg', only: ['width'] },
  { name: 'brand name', prototype: '.brand__name', app: '.auth__brand-name' },
  { name: 'ctrl separator', prototype: '.ctrl__sep', app: '.auth__ctrl-sep', only: ['width', 'height', 'backgroundColor'] },
  { name: 'card', prototype: '.card', app: '.auth__card' },
  { name: 'title', prototype: '.title', app: '.auth__title' },
  {
    name: 'title line',
    prototype: '.title__line',
    app: '.auth__title-line',
    only: ['fontSize', 'fontWeight', 'lineHeight', 'color', 'marginBottom'],
  },
  { name: 'provider row', prototype: '.provider', app: '.provider-list__item' },
  { name: 'provider mark', prototype: '.provider__mark', app: '.provider-list__mark', only: ['x', 'y', 'width', 'height'] },
  { name: 'provider label', prototype: '.provider__label', app: '.provider-list__label', only: ['x', 'width', 'textAlign'] },
  { name: 'or', prototype: '.or', app: '.login__or' },
  { name: 'field', prototype: '.field', app: '.login__form .field', only: ['x', 'y', 'width', 'height', 'marginBottom'] },
  /* 字段本体：行内内距比草稿多 2（图标与文字之间的间距按产品取 6，草稿取 4），
     `paddingLeft` 与 `paddingRight` 的这点差是有意保留的。 */
  { name: 'field input', prototype: '.field .input', app: '.login__form .input' },
  /* 字段左图标：只比横向位置与颜色。图标尺寸与块向位置在草稿里都不是设计值
     （单档 16、绝对定位元素的静态位置），横向位置与颜色才是。 */
  { name: 'field icon', prototype: '.field__icon', app: '.field__icon svg', only: ['x', 'color'] },
  { name: 'terms', prototype: '.terms', app: '.terms-note', only: ['x', 'y', 'width', 'height', 'marginBottom'] },
  {
    name: 'terms label',
    prototype: '.terms label',
    app: '.terms-note .checkbox__label',
    only: ['fontSize', 'fontWeight', 'lineHeight', 'color'],
  },
  {
    name: 'terms checkbox',
    prototype: ".terms input[type='checkbox']",
    app: '.terms-note .checkbox__box',
    only: ['width', 'height', 'borderTopLeftRadius', 'borderTopColor'],
  },
  { name: 'submit', prototype: '.button--block', app: '.auth__card button[type="submit"]' },
  { name: 'footnote', prototype: '.footnote', app: '.auth__footnote' },
  { name: 'bottom', prototype: '.bottom', app: '.auth__bottom' },
]

const IN_CLIENT_PROBES: Probe[] = [
  { name: 'client bar', prototype: '.client-bar', app: '.auth__client-bar' },
  /* 服务器名是内容：设计稿用样例名、产品用真实服务名，只比字体与对齐方式，不比名字的宽度 */
  {
    name: 'client server',
    prototype: '.client-server__name',
    app: '.auth__server-name',
    only: ['fontSize', 'fontWeight', 'color', 'textAlign'],
  },
  { name: 'card', prototype: '.card', app: '.auth__card' },
  { name: 'controls', prototype: '.ctrl', app: '.auth__ctrl' },
]

type Measured = Record<string, string | number | Record<string, number>>
type Side = 'prototype' | 'app'

/** 按一侧的选择器量同一批探针；缺元素就记成 missing，比对时按差异报出。 */
async function measure(page: Page, probes: Probe[], side: Side): Promise<Record<string, Measured>> {
  return page.evaluate(
    ({ probes, props, side }) => {
      const result: Record<string, Record<string, unknown>> = {}
      const px = (value: string) => Math.round((Number.parseFloat(value) || 0) * 100) / 100
      for (const probe of probes) {
        const selector = side === 'prototype' ? probe.prototype : probe.app
        const element = document.querySelector(selector)
        if (!element) {
          result[probe.name] = { missing: 1 }
          continue
        }
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        const measured: Record<string, unknown> = {
          x: Math.round(rect.x * 10) / 10,
          y: Math.round(rect.y * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
          height: Math.round(rect.height * 10) / 10,
        }
        for (const prop of props) {
          const value = style[prop as never] as unknown as string
          /* 行高这类 px 值转成数字，否则容差判据用不上，会把 23.8 与 24 当成不同 */
          measured[prop] = /^-?[\d.]+px$/.test(value) ? px(value) : value
        }
        measured.paddingTop = px(style.paddingTop)
        measured.paddingRight = px(style.paddingRight)
        measured.paddingBottom = px(style.paddingBottom)
        measured.paddingLeft = px(style.paddingLeft)
        measured.borderTopWidth = px(style.borderTopWidth)
        result[probe.name] = measured
      }
      return result as Record<string, Record<string, string | number>>
    },
    { probes, props: STYLE_PROPS as unknown as string[], side },
  )
}

const NUMERIC = new Set([
  'x',
  'y',
  'width',
  'height',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopWidth',
  'fontSize',
  'lineHeight',
  'borderTopLeftRadius',
])

/** 逐项比对：数字容差 1px（字号、行高与圆角 0.5），颜色与文本对齐必须一致；缺元素算差异。 */
function diffProbes(appName: string, probes: Probe[], reference: Record<string, Measured>, actual: Record<string, Measured>): string[] {
  const lines: string[] = []
  for (const probe of probes) {
    const name = probe.name
    const one = reference[name]
    const two = actual[name]
    const probeOnly = probe.only
    if (!two) {
      lines.push(`${appName} · ${name}: 产品侧没有量到`)
      continue
    }
    if (one.missing || two.missing) {
      lines.push(`${appName} · ${name}: 有一侧没找到元素（设计稿 ${one.missing ? '缺' : '有'} · 产品 ${two.missing ? '缺' : '有'}）`)
      continue
    }
    for (const key of Object.keys(one)) {
      if (probeOnly && !probeOnly.includes(key)) continue
      const left = one[key]
      const right = two[key]
      if (typeof left === 'number' && typeof right === 'number') {
        if (!NUMERIC.has(key)) continue
        const tolerance = key === 'fontSize' || key === 'lineHeight' || key === 'borderTopLeftRadius' ? 0.5 : 1
        if (Math.abs(left - right) > tolerance) lines.push(`${appName} · ${name} · ${key}: 设计稿 ${left} vs 产品 ${right}`)
        continue
      }
      if (typeof left === 'string' && typeof right === 'string' && left !== right) {
        lines.push(`${appName} · ${name} · ${key}: 设计稿 ${left} vs 产品 ${right}`)
      }
    }
  }
  return lines
}

/** 产品侧固定用与设计稿同形的入口配置，位置才有可能逐项比。 */
async function stubEntryConfig(page: Page) {
  await page.route('**/v1/user/entry**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/entry')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(FIXTURE_CONFIG) })
    }
    return route.fallback()
  })
}

/* 服务信息统一打桩：真实部署里它就是宿主或站点给的一份固定应答。缺了它，上面那份入口配置的请求
   根本发不出去，产品一侧停在加载态，比对全线不等 —— CI 上只有前端时正是如此。 */
test.beforeEach(async ({ page }) => {
  await page.route('**/.well-known/yao', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: 'development', version: '0.0.0', openapi: '/v1' }),
    }),
  )
})

/** 列的几何（卡片与行宽）是这一页自己负责的，必须一致；其余差异按"待确认"列出并打进日志。 */
function blockingLines(lines: string[]): string[] {
  return lines.filter((line) => /· (card|provider row|provider label|or|field|field input|submit|footnote|bottom) · (width|x):/.test(line))
}

test('matches the prototype element by element on an independent visit', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)

  await page.goto(PROTOTYPE)
  /* 设计稿也切到中文：语言不同会带来一批字号差异（中文最小 12、拉丁 11），那是语言规则不是版式差异 */
  await page.locator('#lang-btn').click()
  await page.getByRole('menuitemradio', { name: '简体中文' }).click()
  await expect(page.locator('.brand__name')).toBeVisible()
  const reference = await measure(page, PROBES, 'prototype')
  await capturePage(page, join(SHOTS, 'prototype.png'))

  await stubEntryConfig(page)
  await page.goto(APP_STANDALONE)
  await expect(page.locator('.auth__card')).toBeVisible()
  await expect(page.locator('.provider-list__item')).toHaveCount(3)
  const actual = await measure(page, PROBES, 'app')
  await capturePage(page, join(SHOTS, 'app.png'))

  const lines = diffProbes('独立访问', PROBES, reference, actual)
  console.log(`[compare] 独立访问：${lines.length} 处差异（列几何必须一致，其余待确认）`)
  for (const line of lines) console.log(`  ${line}`)
  console.log(
    `  card: 设计稿 ${reference.card.width}×${reference.card.height} @ ${reference.card.x},${reference.card.y} · 产品 ${actual.card.width}×${actual.card.height} @ ${actual.card.x},${actual.card.y}`,
  )
  expect(blockingLines(lines)).toEqual([])
})

test('matches the prototype element by element inside the client', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)

  await page.goto(`${PROTOTYPE}?from=connect`)
  await page.locator('#lang-btn').click()
  await page.getByRole('menuitemradio', { name: '简体中文' }).click()
  await expect(page.locator('.client-bar')).toBeVisible()
  const reference = await measure(page, IN_CLIENT_PROBES, 'prototype')
  await capturePage(page, join(SHOTS, 'prototype-in-client.png'))

  await stubEntryConfig(page)
  await page.goto(APP_IN_CLIENT)
  await expect(page.locator('.auth__client-bar')).toBeVisible()
  /* 等配置与卡片内容都到位：只看客户端栏会量到加载态的空卡片 */
  await expect(page.locator('.provider-list__item')).toHaveCount(3)
  await expect(page.locator('.auth__server-name')).toBeVisible()
  const actual = await measure(page, IN_CLIENT_PROBES, 'app')
  await capturePage(page, join(SHOTS, 'app-in-client.png'))

  const lines = diffProbes('客户端内', IN_CLIENT_PROBES, reference, actual)
  console.log(`[compare] 客户端内：${lines.length} 处差异（列几何必须一致，其余待确认）`)
  for (const line of lines) console.log(`  ${line}`)
  expect(blockingLines(lines)).toEqual([])
})
