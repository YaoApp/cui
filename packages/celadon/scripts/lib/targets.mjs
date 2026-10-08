#!/usr/bin/env node
/**
 * targets.mjs — 把一组改动文件映射到该跑的检查器与单元用例。
 *
 * 内圈两条命令共用这里的映射，执行与退出码由调用方负责：
 *   · verify:files 用 checkersFor()，按 scope 决定文件级还是整条跑；
 *   · test:files 用 relatedUnitTests()，只跑与改动相关的单元用例。
 *
 * 约定：
 *   · 输入路径可以是相对路径，按当前目录解析；
 *   · 分类只看文件在包内的位置与后缀，不读文件内容（引用了谁由 relatedUnitTests 扫）。
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const APP_SRC = join(PACKAGE, 'app', 'src')
export const DESIGN = join(PACKAGE, 'design')

const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const STYLE_EXT = new Set(['.less', '.css'])
const TEST_RE = /\.test\.(ts|tsx|js|jsx)$/
const CODE_RE = /\.(ts|tsx|js|jsx)$/
const LOCALE_RE = /(^|\/)locales\/[^/]+\.json$/
const CONFIG_NAMES = new Set(['package.json', 'pnpm-workspace.yaml', 'tsconfig.json', 'vite.config.ts', 'eslint.config.js'])
const CONFIG_RE = /(^|\/)(vite|vitest|playwright|stylelint)[^/]*\.(ts|js|mjs|cjs|json)$/

const under = (path, dir) => path === dir || path.startsWith(dir + '/')

const push = (list, value) => {
  if (!list.includes(value)) list.push(value)
}

/**
 * 分类：返回相对包根的分类结果。
 * 类别：code · tests · styles · design · locales · docs · config · other。
 */
export function classify(files) {
  const out = { code: [], tests: [], styles: [], design: [], locales: [], docs: [], config: [], other: [] }
  for (const input of files) {
    const abs = resolve(input)
    const rel = relative(PACKAGE, abs)
    const ext = extname(abs)
    if (under(abs, DESIGN)) { push(out.design, rel); continue }
    if (LOCALE_RE.test(rel)) { push(out.locales, rel); continue }
    if (under(abs, APP_SRC)) {
      if (TEST_RE.test(abs)) push(out.tests, rel)
      else if (CODE_EXT.has(ext)) push(out.code, rel)
      else if (STYLE_EXT.has(ext)) push(out.styles, rel)
      else push(out.other, rel)
      continue
    }
    if (STYLE_EXT.has(ext)) push(out.styles, rel)
    else if (ext === '.md') push(out.docs, rel)
    else if (CONFIG_NAMES.has(basename(abs)) || CONFIG_RE.test(rel)) push(out.config, rel)
    else push(out.other, rel)
  }
  return out
}

const hasCode = (c) => c.code.length > 0 || c.tests.length > 0
const DESIGN_STYLE_RE = /\.(html|less|css)$/
/** check-css-conventions 的输入：app 侧样式 + design 侧页面与样式（它按目录读 tokens.less / tokens.css / *.html）。 */
const cssFiles = (c) => [...c.styles, ...c.design.filter((file) => DESIGN_STYLE_RE.test(file))]
/** check-tokens 的输入：app 侧 .less + design 侧页面；design 的 tokens.less 是定义源，不是它的检查面。 */
const tokenFiles = (c) => [...c.styles, ...c.design.filter((file) => file.endsWith('.html'))]
const hasCssSources = (c) => cssFiles(c).length > 0
const hasTokenSources = (c) => tokenFiles(c).length > 0
const hasStyleOrDesign = (c) => c.styles.length > 0 || c.design.length > 0
const codeFiles = (c) => [...c.code, ...c.tests]
const allFiles = (c) => [...c.code, ...c.tests, ...c.styles, ...c.design, ...c.locales, ...c.docs, ...c.config, ...c.other]
const anyMatch = (c, pattern) => allFiles(c).some((file) => pattern.test(file))

/** 生成物与生成脚本：改到它们就要重跑产物比对。 */
const GENERATED_TRIGGER = /(^|\/)app\/src\/platform\/(icons|theme)\/|^scripts\/build-(icons|css)\.mjs$/
/** i18n 类型产物与生成脚本。 */
const I18N_TYPES_TRIGGER = /i18n-types\.d\.ts$|^scripts\/build-i18n(-types)?\.mjs$/
/** 语言包构建脚本。 */
const I18N_BUILD_TRIGGER = /^scripts\/build-(i18n|locales)\.mjs$/

/**
 * 检查器与触发条件。scope 指目标形态：
 *   · files：支持文件级，只对改动文件报错；pick 给出要传给它的文件（相对包根）。
 *   · whole：天生跨文件，整条跑。
 * 这份表与 `package.json` 的 `check:run` 一一对应（check-design-pages 是独立的 check:design，不在内圈）。
 */
export const CHECKER_RULES = [
  { script: 'check-css-conventions.mjs', scope: 'files', when: hasCssSources, pick: cssFiles },
  { script: 'check-tokens.mjs', scope: 'files', when: hasTokenSources, pick: tokenFiles },
  { script: 'check-app-layout.mjs', scope: 'files', when: hasCode, pick: codeFiles },
  { script: 'check-base-components.mjs', scope: 'files', when: hasCode, pick: codeFiles },
  { script: 'check-bridge-imports.mjs', scope: 'files', when: hasCode, pick: codeFiles },
  { script: 'check-effect-url-write.mjs', scope: 'files', when: hasCode, pick: codeFiles },
  { script: 'check-import-boundaries.mjs', scope: 'files', when: hasCode, pick: codeFiles },
  { script: 'check-doc-references.mjs', scope: 'files', when: (c) => c.docs.length > 0, pick: (c) => c.docs },
  { script: 'check-i18n.mjs', scope: 'whole', when: (c) => c.locales.length > 0 || hasCode(c) || anyMatch(c, I18N_BUILD_TRIGGER) },
  { script: 'check-i18n-types.mjs', scope: 'whole', when: (c) => c.locales.length > 0 || anyMatch(c, I18N_TYPES_TRIGGER) },
  { script: 'check-generated.mjs', scope: 'whole', when: (c) => hasStyleOrDesign(c) || anyMatch(c, GENERATED_TRIGGER) },
  { script: 'check-readme-values.mjs', scope: 'whole', when: hasStyleOrDesign },
]

/** 该跑哪些检查器，返回 [{ script, scope, files }]，顺序与 CHECKER_RULES 一致。 */
export function checkersFor(files) {
  const c = classify(files)
  return CHECKER_RULES.filter((rule) => rule.when(c)).map(({ script, scope, pick }) => ({ script, scope, files: pick ? pick(c) : [] }))
}

/** 去掉模块后缀与末尾的 /index，便于比较同一模块的不同写法。 */
function moduleKey(path) {
  const trimmed = path.replace(CODE_RE, '')
  return trimmed.endsWith('/index') ? trimmed.slice(0, -'/index'.length) : trimmed
}

/** 把 import 说明符解析成包内绝对路径；第三方包返回空串。 */
function resolveSpecifier(testFile, spec, root) {
  if (spec.startsWith('@/')) return join(root, spec.slice(2))
  if (spec.startsWith('.')) return resolve(dirname(testFile), spec)
  return ''
}

function importSpecifiers(source) {
  const specs = new Set()
  for (const match of source.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g)) specs.add(match[1])
  for (const match of source.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]/g)) specs.add(match[1])
  for (const match of source.matchAll(/(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g)) specs.add(match[1])
  return [...specs]
}

function walkTests(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walkTests(full, out)
    else if (TEST_RE.test(entry.name)) out.push(full)
  }
  return out
}

function siblingTests(file) {
  const dir = dirname(file)
  const base = basename(file).replace(CODE_RE, '')
  const names = [`${base}.test.ts`, `${base}.test.tsx`, join('tests', `${base}.test.ts`), join('tests', `${base}.test.tsx`)]
  return names.map((name) => join(dir, name)).filter((candidate) => existsSync(candidate) && statSync(candidate).isFile())
}

/**
 * 改动文件相关的单元用例（绝对路径，已排序去重）：
 *   · 改的就是用例本身 → 直接选它；
 *   · 同目录有同名用例 → 选它；
 *   · 其余情况扫全部用例的 import，引用到改动模块的选出来。
 * 改动文件所在目录的 barrel 也算一个匹配键：用例从 `@/x` 间接引用到 `x/part.ts` 时也要选中，
 * 多选几条相关用例无害，漏选才会让内圈给出假绿。root 默认 app/src，测试时可以传别的根。
 */
export function relatedUnitTests(files, { root = APP_SRC } = {}) {
  const targets = files.map((file) => resolve(file)).filter((file) => under(file, root))
  const found = new Set()
  for (const file of targets) {
    if (TEST_RE.test(file)) { found.add(file); continue }
    for (const test of siblingTests(file)) found.add(test)
  }
  const targetKeys = new Set()
  for (const file of targets) {
    const key = moduleKey(file)
    targetKeys.add(key)
    if (!key.endsWith('/index')) targetKeys.add(moduleKey(dirname(file)))
  }
  for (const test of walkTests(root)) {
    if (found.has(test)) continue
    const specs = importSpecifiers(readFileSync(test, 'utf8'))
    const hits = specs.some((spec) => {
      const resolved = resolveSpecifier(test, spec, root)
      return resolved && targetKeys.has(moduleKey(resolved))
    })
    if (hits) found.add(test)
  }
  return [...found].sort()
}
