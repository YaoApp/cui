import { existsSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildManifest, clientKind, targetOs } from './manifest'

/* **防漂移**：清单里的 `locales` 必须等于**语言包目录**（唯一来源，见 08-i18n.md）。
 * 手写就会漂（我先是手写的）；加语言只该加目录。 */

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../../')

function localesOnDisk(): string[] {
  const found = new Set<string>()
  const collect = (dir: string) => {
    if (!existsSync(dir)) return
    for (const name of readdirSync(dir)) if (name.endsWith('.json')) found.add(name.replace(/\.json$/, ''))
  }
  collect(join(SRC, 'locales'))
  for (const area of ['features', 'components']) {
    const root = join(SRC, area)
    if (!existsSync(root)) continue
    for (const unit of readdirSync(root)) collect(join(root, unit, 'locales'))
  }
  return [...found].sort()
}

describe('the manifest', () => {
  it('lists the locales the packs actually have', () => {
    expect([...buildManifest().locales].sort()).toEqual(localesOnDisk())
  })

  it('declares the client it was built for', () => {
    expect(['web', 'desktop']).toContain(buildManifest().client)
  })

  it('answers the client kind and the target system from the same object', () => {
    expect(clientKind()).toBe(buildManifest().client)
    expect(targetOs()).toBe(buildManifest().os)
  })
})
