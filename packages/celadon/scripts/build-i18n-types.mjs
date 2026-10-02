#!/usr/bin/env node
/**
 * build-i18n-types.mjs — 从基准语言 zh-CN 的三处语言包生成 `t()` 的 key 联合类型
 * 用法：node scripts/build-i18n-types.mjs [目标根目录]   （默认本包根）
 *
 * 为什么：语言包**跟代码走**，key 有三处来源；手写类型迟早与语言包脱钩。
 * `check-i18n` 只保证各语言 key 一致，这里再让 `t('…')` 的 key 在 **tsc** 就受约束：
 * 拼错的 key 编译不过，改 key 时也不会漏掉调用点。
 *
 * 产物 `app/src/platform/i18n/i18n-types.d.ts` **提交进仓库**（与 `icons.html` 同处理），
 * 由 `check-i18n-types.mjs` 用"重新生成再比对"的方式守住一致性。
 *
 * 合并逻辑与 `check-i18n.mjs` 完全一致：
 *   app/src/locales/<locale>.json               共用词
 *   app/src/features/<域>/locales/<locale>.json feature 私有词
 *   app/src/components/<名>/locales/<locale>.json 组件私有词
 * 基准语言在 `check-i18n.mjs` 里是 `BASE = 'zh-CN'`，这里不另起一份。
 *
 * 纯函数（collectPacks / baseKeys / renderTypes / typesPath）导出，供单测直接调用；
 * 只有被当作命令跑时才写文件（见文件末尾的 invokedDirectly 判断）。
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/** 基准语言：唯一手写的源（与 check-i18n.mjs 的 BASE 相同，见 architecture/08-i18n.md §5）。 */
export const BASE = 'zh-CN'

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** 把嵌套对象压成扁平 key：`{ nav: { hello: '你好' } }` → `{ 'nav.hello': '你好' }`。 */
export function flat(object, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(object)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) flat(value, path, out)
    else out[path] = value
  }
  return out
}

/** 三处路径按 locale 合并；某处不存在就跳过（与 check-i18n.mjs 同一套发现规则）。 */
export function collectPacks(root) {
  const packs = {}
  const addDir = (dir) => {
    if (!existsSync(dir) || !statSync(dir).isDirectory()) return
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.json')) continue
      const locale = basename(file, '.json')
      const parsed = JSON.parse(readFileSync(join(dir, file), 'utf8'))
      packs[locale] = { ...packs[locale], ...flat(parsed) }
    }
  }
  addDir(join(root, 'app', 'src', 'locales'))
  for (const layer of ['features', 'components']) {
    const layerRoot = join(root, 'app', 'src', layer)
    if (!existsSync(layerRoot) || !statSync(layerRoot).isDirectory()) continue
    for (const name of readdirSync(layerRoot)) addDir(join(layerRoot, name, 'locales'))
  }
  return packs
}

/** 基准语言的扁平 key（排序后，产物才稳定、可比对）。 */
export function baseKeys(root) {
  const packs = collectPacks(root)
  const base = packs[BASE]
  if (!base) throw new Error(`baseline locale ${BASE} is missing — expected app/src/locales/${BASE}.json`)
  return Object.keys(base).sort()
}

/** 生成物在仓库里的位置。 */
export function typesPath(root) {
  return join(root, 'app', 'src', 'platform', 'i18n', 'i18n-types.d.ts')
}

/** 纯函数：把 key 列表渲染成 `.d.ts` 内容（不碰文件系统，单测与检查器共用）。 */
export function renderTypes(keys) {
  const sorted = [...keys].sort()
  const union = sorted.map((key) => `  | '${key}'`).join('\n')
  const resources = sorted.map((key) => `        '${key}': string`).join('\n')
  return `/* 本文件由 scripts/build-i18n-types.mjs 从三处语言包（基准语言 ${BASE}）生成 —— 请勿手改。
   重新生成：pnpm build:i18n
   来源：app/src/locales/ · app/src/features/<域>/locales/ · app/src/components/<名>/locales/ */
import 'i18next'

/** 基准语言里存在的全部 key —— \`t('…')\` 只接受这些。 */
export type I18nKey =
${union}

/* 语言包是**平铺 + 点号分组**（\`nav.hello\`），运行时 keySeparator:false，类型也必须一致，
   否则 \`t('nav.hello')\` 会被当成嵌套查找。resources 只列 key 不列值：值随语言变，key 不随。 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    keySeparator: false
    nsSeparator: false
    resources: {
      translation: {
${resources}
      }
    }
  }
}
`
}

/** 生成产物内容（键排序稳定，检查器据此"重新生成再比对"）。 */
export function buildTypes(root) {
  const keys = baseKeys(root)
  return { keys, content: renderTypes(keys) }
}

/* 只有被当作命令跑时才写盘；被单测 import 时不产生副作用。 */
const invokedDirectly = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url
if (invokedDirectly) {
  const root = resolve(process.argv[2] || PACKAGE)
  const { keys, content } = buildTypes(root)
  const out = typesPath(root)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, content)
  console.log(`✓ wrote ${relative(root, out)} (${keys.length} key(s) from ${BASE})`)
}
