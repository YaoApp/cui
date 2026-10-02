/** 基准语言：唯一手写的源（见 architecture/08-i18n.md §5）。 */
export const DEFAULT_LOCALE = 'zh-CN'

type LanguageTag = { language: string; script: string; region: string }

/* 把 BCP-47 标签拆成小写的 language / script / region（忽略扩展段与私有段）。
   例：`zh-Hans-CN` → zh / hans / cn；`en` → en / '' / ''；`ja-JP` → ja / '' / jp。 */
function parseLanguageTag(tag: string): LanguageTag {
  const [language = '', ...rest] = tag.toLowerCase().split(/[-_]/).filter(Boolean)
  let script = ''
  let region = ''
  for (const part of rest) {
    if (!script && part.length === 4) script = part
    else if (!region && (part.length === 2 || (part.length === 3 && /^\d+$/.test(part)))) region = part
  }
  return { language, script, region }
}

/** 在 available 里找规范条目（大小写不敏感）；找不到返回 undefined。 */
const pick = (available: readonly string[], wanted: string): string | undefined =>
  available.find((value) => value.toLowerCase() === wanted)

/**
 * 系统语言标签 → 应用实际使用的语言。**纯函数**：不做 I/O，不看 navigator，available 参数化便于测试。
 *
 * 按 `systemLanguages` 的优先级逐个标签匹配；每个标签内部依此顺序（大小写不敏感，
 * 支持 `zh-Hans-CN` 这类带 script 的标签）：
 *   1. 与 available 精确命中
 *   2. 同语言 + 同地区（`zh-Hans-CN` → `zh-CN`）
 *   3. `zh-Hant*` / `zh-TW` / `zh-HK` / `zh-MO` → `zh-TW`
 *   4. 其余 `zh*` → `zh-CN`
 *   5. `en*` → `en-US`
 *   6. `ja*` → `ja`
 * 所有标签都不中 → 基准语言 `zh-CN`。
 */
export function resolveLocale(systemLanguages: readonly string[], available: readonly string[]): string {
  const tags = systemLanguages.filter((tag) => typeof tag === 'string' && tag.length > 0)

  for (const tag of tags) {
    const exact = available.find((value) => value.toLowerCase() === tag.toLowerCase())
    if (exact) return exact

    const { language, script, region } = parseLanguageTag(tag)
    if (!language) continue

    if (region) {
      const sameRegion = available.find((value) => {
        const candidate = parseLanguageTag(value)
        return candidate.language === language && candidate.region === region
      })
      if (sameRegion) return sameRegion
    }

    if (language === 'zh') {
      const traditional = script === 'hant' || region === 'tw' || region === 'hk' || region === 'mo'
      const hit = pick(available, traditional ? 'zh-tw' : 'zh-cn')
      if (hit) return hit
      continue
    }
    if (language === 'en') {
      const hit = pick(available, 'en-us')
      if (hit) return hit
      continue
    }
    if (language === 'ja') {
      const hit = pick(available, 'ja')
      if (hit) return hit
    }
  }

  return pick(available, DEFAULT_LOCALE.toLowerCase()) ?? available[0] ?? DEFAULT_LOCALE
}
