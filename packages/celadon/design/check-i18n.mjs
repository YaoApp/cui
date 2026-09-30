#!/usr/bin/env node
/**
 * check-i18n.mjs — 四语词条体检（漏 key + 漏翻）
 * 用法：node packages/celadon/design/check-i18n.mjs   （有问题退出码 1，可进 CI）
 *
 * 三种检查：
 *   1) key 完整性：其他语言必须与基准 zh-CN 的 key 集合完全一致
 *   2) 漏翻（en）：值里不允许出现汉字（少数刻意保留 CJK 的样本 key 除外）
 *   3) 漏翻（ja / zh-TW）：与 zh-CN 完全相同且不在"语言中立白名单"里的值 → 报警
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const i18nDir = resolve(here, 'i18n')
const BASE = 'zh-CN'
const LANGS = readdirSync(i18nDir).filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')).sort()

const flat = (obj, prefix = '', out = {}) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, key, out)
    else out[key] = v
  }
  return out
}
const packs = Object.fromEntries(LANGS.map(l => [l, flat(JSON.parse(readFileSync(resolve(i18nDir, `${l}.json`), 'utf8')))]))
const base = packs[BASE]

// 刻意保留 CJK / 与技术无关的样本 key，不参与"漏翻"判定
const ALLOW_CJK = new Set([
  'card.hanText', 'card.kanaText', 'card.punctText', 'card.glyphCompareText', 'card.monoText',
  'card.mixedText', 'card.latinText', 'sample.message.agent1Html'
])
// 语言中立（各语言相同是正确的）：品牌名、文件名、token 名、纯数值/单位
const NEUTRAL = /^(Yao Agents|Agent|token|contract\.pdf|需求\.docx|requirements\.docx|risk-summary\.md|リスク摘要\.md|風險摘要\.md|6px|12px|hover 120ms|hairline|[\d.]+(px|ms|KB|MB)?)$/

const HAN = /[\u4e00-\u9fff]/
// ja 中与中文同形且正确的词
const JA_KEEP = new Set(['背景', '合計', '完了', '変更'])
// 简体专属字（在繁体里写法不同）——只列我们词库里会出现的
const SIMPLIFIED_ONLY = new Set([...'软宽浅档环图线点与里据务门见说这个们时报机极标样钟题页项顺须颜问间关长无为处备复杂类单双对导层张弹归录总户执扩护换数断旧显术权来检欢步贵终经给结绝统绿红级约质贯边过运还进远连适选释放银钱铁错键闭间队阶风飞饭马验骨验点'])
const problems = []

for (const lang of LANGS) {
  if (lang === BASE) continue
  const pack = packs[lang]
  // 1) key 完整性
  for (const k of Object.keys(base)) if (!(k in pack)) problems.push(`[${lang}] 缺 key: ${k}`)
  for (const k of Object.keys(pack)) if (!(k in base)) problems.push(`[${lang}] 多余 key: ${k}`)
  // 2/3) 漏翻
  for (const [k, v] of Object.entries(pack)) {
    if (typeof v !== 'string' || ALLOW_CJK.has(k) || NEUTRAL.test(v)) continue
    if (lang === 'en' && HAN.test(v)) problems.push(`[en] 未翻译（含汉字）: ${k} = ${v}`)
    if (lang === 'ja' && HAN.test(v) && v === base[k] && !JA_KEEP.has(v))
      problems.push(`[ja] 疑似未翻译（同 zh-CN）: ${k} = ${v}`)
    // 繁中：只查"简体专属字"（词形相同的词不算错，避免误报）
    if (lang === 'zh-TW') {
      const hit = [...v].filter(c => SIMPLIFIED_ONLY.has(c))
      if (hit.length) problems.push(`[zh-TW] 含简体字「${hit.join('')}」: ${k} = ${v}`)
    }
  }
}

console.log(`✓ 语言包: ${LANGS.join(' / ')} · 基准 ${BASE} 共 ${Object.keys(base).length} key`)
if (problems.length) {
  console.log(`✗ 发现 ${problems.length} 个问题：`)
  problems.forEach(p => console.log('   ' + p))
  process.exit(1)
}
console.log('✓ 未发现漏 key / 漏翻')
