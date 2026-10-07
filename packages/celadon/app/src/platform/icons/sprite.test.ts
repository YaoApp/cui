import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/* 生成物契约：`design/icons/manifest.json` 里登记的每个图标，都必须在应用雪碧图里有一个**非空的**符号。
   取图漏了一个、或符号体被清空时，`<use>` 指向的是空符号：画面上什么都不出现，
   而类型（`icon-ids.ts` 仍有这个名字）与组件用例（`<use>` 的 href 对得上）都不会报错。
   图标的真实绘制在浏览器层核对，这里只守雪碧图与清单一一对应。 */
type ManifestEntry = { id: string; lib: string; cat: string; src: string }

/* 用例的工作目录是包根（`pnpm test` 在 packages/celadon 下跑），两份文件都按包根定位 */
const manifest: ManifestEntry[] = JSON.parse(readFileSync(resolve('design/icons/manifest.json'), 'utf8'))
const sprite = readFileSync(resolve('app/src/platform/icons/sprite.svg'), 'utf8')

describe('icon sprite', () => {
  it('holds a non-empty symbol for every manifest entry', () => {
    const missing: string[] = []
    const empty: string[] = []
    for (const entry of manifest) {
      const symbol = sprite.match(new RegExp(`<symbol id="${entry.id}"[^>]*>([\\s\\S]*?)</symbol>`))
      if (!symbol) missing.push(entry.id)
      else if (symbol[1].trim() === '') empty.push(entry.id)
    }

    expect(missing).toEqual([])
    expect(empty).toEqual([])
  })

  it('gives every interface icon a 24 grid symbol so one viewBox scales them all', () => {
    for (const entry of manifest.filter((entry) => entry.lib === 'lucide')) {
      expect(sprite).toContain(`<symbol id="${entry.id}" viewBox="0 0 24 24"`)
    }
  })
})
