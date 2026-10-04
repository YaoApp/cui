import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  BASE,
  baseKeys,
  buildTypes,
  collectPacks,
  flat,
  renderTypes,
  typesPath,
} from '../../../../scripts/build-i18n-types.mjs'

/* 类型生成脚本的**纯函数部分**（不写盘、不读 argv）—— 生成物本身由 check-i18n-types 守。
   这里覆盖三处合并、基准语言缺失、以及渲染出的内容形状。 */
const roots: string[] = []

function scratch(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'cui-i18n-types-'))
  roots.push(root)
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path)
    mkdirSync(join(full, '..'), { recursive: true })
    writeFileSync(full, content)
  }
  return root
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('i18n type generator · pure functions', () => {
  it('flattens nested objects into dotted keys', () => {
    expect(flat({ nav: { appLabel: '应用导航' }, header: { refresh: '刷新' } })).toEqual({
      'nav.appLabel': '应用导航',
      'header.refresh': '刷新',
    })
  })

  it('merges the three locale-pack locations per locale', () => {
    const root = scratch({
      'app/src/locales/zh-CN.json': JSON.stringify({ 'nav.overview': '你好' }),
      'app/src/features/inbox/locales/zh-CN.json': JSON.stringify({ 'inbox.title': '收件箱' }),
      'app/src/components/page-header/locales/zh-CN.json': JSON.stringify({ 'pageHeader.title': '标题' }),
      'app/src/locales/en-US.json': JSON.stringify({ 'nav.overview': 'Hello' }),
      'app/src/components/page-header/notes.txt': 'not a locale pack',
    })

    const packs = collectPacks(root)

    expect(Object.keys(packs).sort()).toEqual(['en-US', 'zh-CN'])
    expect(packs['zh-CN']).toEqual({
      'nav.overview': '你好',
      'inbox.title': '收件箱',
      'pageHeader.title': '标题',
    })
  })

  it('returns the baseline keys sorted, so the output is stable', () => {
    const root = scratch({
      'app/src/locales/zh-CN.json': JSON.stringify({ 'nav.routing': '世界', 'nav.overview': '你好' }),
    })

    expect(baseKeys(root)).toEqual(['nav.overview', 'nav.routing'])
  })

  it('refuses to generate when the baseline locale is missing', () => {
    const root = scratch({ 'app/src/locales/en-US.json': JSON.stringify({ 'nav.overview': 'Hello' }) })

    expect(() => baseKeys(root)).toThrow(new RegExp(BASE))
  })

  it('renders the key union and the flat resources i18next reads', () => {
    const content = renderTypes(['nav.overview', 'routing.title'])

    expect(content).toContain("export type I18nKey =")
    expect(content).toContain("  | 'nav.overview'")
    expect(content).toContain("  | 'routing.title'")
    expect(content).toContain("'nav.overview': string")
    expect(content).toContain("'routing.title': string")
    // 平铺 key 与运行时一致：关掉 i18next 的点号分隔
    expect(content).toContain('keySeparator: false')
    expect(content).toContain('nsSeparator: false')
    expect(content).not.toContain("'nav.other'")
  })

  it('keeps buildTypes and renderTypes in agreement, and points at the committed path', () => {
    const root = scratch({
      'app/src/locales/zh-CN.json': JSON.stringify({ 'nav.overview': '你好' }),
    })

    const { keys, content } = buildTypes(root)

    expect(keys).toEqual(['nav.overview'])
    expect(content).toBe(renderTypes(keys))
    expect(typesPath(root).endsWith(join('app', 'src', 'platform', 'i18n', 'i18n-types.d.ts'))).toBe(true)
  })
})
