#!/usr/bin/env node
/* 依赖方向的检查器 —— **上层可依赖下层，不许往上引**（铁律 3 · 铁律 8）。
   为什么自己写而不接 ESLint：项目用 TypeScript 7，`typescript-eslint` 尚不支持
   （`13-quality-gates.md` §2 有记载），`no-restricted-imports` 落不下来；
   铁律 8 要求"边界由机器强制"，所以这里用零依赖的纯 Node 扫 import 说明符。

   各层允许 import 的目标（值；**类型可以跨层引用** —— 见 03-boundaries.md §2）：
     routes     → routes · features · components · stores · data · platform
     features   → features（**只限自己**）· components · stores · data · platform
     components → components（含 base）· platform
     stores     → stores · data · platform
     data       → data · platform
     platform   → platform（含 platform/utils；platform 内部不再细分）
   `platform/utils/` 不依赖任何上层、所有层可用 —— 按上面的集合它天然被所有层放行。

   为什么 `components` 不在一条直线上：组件是**给 feature 用的无业务零件**
   （features → components 合法），但组件自己**不许认识业务 / 读状态**
   （components ↛ features / stores / data），两条合起来是一条单向边。

   被引路径两种写法都解析：别名 `@/...`（`@` = `app/src`，见 vite.config.ts / tsconfig.json）
   与相对路径 `./` · `../`。**解析不到的一律跳过**（第三方包 · node 内置 · 不存在的路径）。
   文件自己的层由它在 `app/src/` 下的第一段目录判定；`main.tsx` · `locales/` · `test-support/`
   不在依赖图里（内容 / 测试支持，不是层）—— 它们不被当作 import 方，也不被当作被引目标。

   目标目录取 process.argv[2]，默认 app/src。 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TARGET = resolve(process.argv[2] || join(PACKAGE, 'app', 'src'))

try { statSync(TARGET) } catch {
  console.log('✗ target directory does not exist — the checker refuses to pass on an empty tree (target: ' + TARGET + ')')
  process.exit(1)
}

/** 只扫源码；`.d.ts` 也算 `.ts`（它只放类型，解析后通常没有 import）。 */
const CODE = /\.(?:ts|tsx)$/
/** 层的清单（上 → 下）—— `layerOf` 用它判定，报错文案也用这个顺序说"谁在上"。 */
const LAYERS = ['routes', 'features', 'components', 'stores', 'data', 'platform']
/** importer 层 → 允许 import 的目标层集合。 */
const ALLOWED = {
  routes: new Set(['routes', 'features', 'components', 'stores', 'data', 'platform']),
  features: new Set(['features', 'components', 'stores', 'data', 'platform']),
  components: new Set(['components', 'platform']),
  stores: new Set(['stores', 'data', 'platform']),
  data: new Set(['data', 'platform']),
  platform: new Set(['platform']),
}
/** 解析候选后缀：说明符常常省扩展名，也可能指向目录的 index。 */
const EXTS = ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.jsx', '.json', '.less', '.css', '.svg']
/** 旧包：铁律 2 · 零反向依赖。其它检查器都没覆盖这条，所以在这里一并拦下。 */
const OLD_PACKAGE = '@yaoapp/cui'
/* 无装配例外：装配点在入口 `app/src/main.tsx`（不属于任何层），platform/ 不反向引 routes/。 */
const ASSEMBLY_EDGES = []

/* **登记例外**：`components/base/captcha-field` 是唯一自带取图的基础件。图形验证码的接口固定
   （`GET /user/entry/captcha`），取图与三种过程是控件行为的一部分，因此它直接使用数据层的申报。
   例外要看得见：逐条列出 import 方与说明符，不放宽整层（见 architecture/03-boundaries.md §4）。 */
const EXEMPT_IMPORTS = new Set([
  'components/base/captcha-field/captcha-field.tsx|@/data',
  'components/base/captcha-field/captcha-field.tsx|@/data/user',
])

/** 取一个绝对路径在源码根下的相对路径（用 `/` 归一，便于比较）。 */
const toRel = (abs) => relative(TARGET, abs).split(/[\\/]/).join('/')

/** 文件属于哪一层：取 `app/src/` 下第一段目录；不在层里返回 null（main.tsx · locales/ · test-support/…）。 */
function layerOf(abs) {
  const rel = toRel(abs)
  if (rel.startsWith('..') || !rel) return null
  const first = rel.split('/')[0]
  return LAYERS.includes(first) ? first : null
}

const isBase = (rel) => rel === 'components/base' || rel.startsWith('components/base/')

/** 解析说明符到一个"逻辑路径"（不带扩展名），并确认它真的存在；解析不到返回 null。 */
function resolveSpecifier(importerAbs, spec) {
  /* 去掉 `?raw` / `#frag` 之类的查询再找文件。 */
  const clean = spec.split(/[?#]/)[0]
  let base
  if (clean.startsWith('@/')) base = resolve(TARGET, clean.slice(2))
  else if (clean.startsWith('.')) base = resolve(dirname(importerAbs), clean)
  else return null /* 第三方包 / node 内置：不在依赖图里 */
  if (existsSync(base)) return base
  for (const ext of EXTS) if (existsSync(base + ext)) return base
  for (const ext of EXTS) if (existsSync(join(base, 'index' + ext))) return base
  return null /* 不存在的路径：跳过，不报 */
}

/** 把注释换成等长空白（保留换行，好让行号仍然对得上）—— 免得注释里的 import 被当成真的。
    行注释只在 `//` 前面不是引号/冒号/反斜杠时才算注释（保住字符串里的 `https://` 与路径）。 */
const blankComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length))

/** 判定 import 子句是不是"只带类型"：`import type …` 或 `{ type A, type B }` 全部带 type。 */
function isTypeOnly(clause) {
  const c = clause.trim()
  if (/^type\b/.test(c)) return true
  const named = c.match(/^\{\s*([\s\S]*?)\s*\}$/)
  if (!named) return false
  const items = named[1].split(',').map((s) => s.trim()).filter(Boolean)
  return items.length > 0 && items.every((it) => /^type\s+/.test(it))
}

/** 说明符不是路径（第三方包 · 内置）时不动它；`@yaoapp/cui` 是唯一要拦的包名。 */
const isOldPackage = (spec) => spec === OLD_PACKAGE || spec.startsWith(OLD_PACKAGE + '/')

const FROM_RE = /(?:^|\n)[ \t]*(import|export)\b([A-Za-z0-9_$*{},\s]*?)\bfrom\b[ \t]*['"]([^'"]+)['"]/g
const SIDE_RE = /(?:^|\n)[ \t]*import[ \t]*['"]([^'"]+)['"]/g
const DYNAMIC_RE = /\bimport[ \t]*\([ \t]*['"]([^'"]+)['"]/g

/** 抽出一个文件里的 import/export-from 说明符：{ spec, clause, typeOnly, at }。 */
function importsOf(source) {
  const text = blankComments(source)
  const found = []
  for (const re of [FROM_RE, SIDE_RE, DYNAMIC_RE]) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text))) {
      const isFrom = re === FROM_RE
      found.push({
        spec: isFrom ? m[3] : m[1],
        typeOnly: isFrom ? isTypeOnly(m[2]) : false,
        at: m.index,
      })
    }
  }
  return found.sort((a, b) => a.at - b.at)
}

/** 违规分类：返回 { rule, why } 或 null。 */
function violationFor({ importerLayer, importerRel, targetLayer, typeOnly, targetAbs }) {
  const target = toRel(targetAbs)
  if (ASSEMBLY_EDGES.some((e) => importerRel === e.from && target === e.to)) return null

  /* features/ 互引：同层，与方向无关；类型也不放行（feature 自洽是硬约束）。 */
  if (importerLayer === 'features' && targetLayer === 'features') {
    if (importerRel.split('/')[1] !== target.split('/')[1]) {
      return {
        rule: 'feature-cross',
        why: 'a feature must not import another feature — keep it self-contained, put shared vocabulary/helpers in platform/utils/ or components/, and leave business pieces inside one feature',
      }
    }
    return null
  }

  /* components/base/ 引上层组件：同层，与方向无关；类型也不放行（基础件只能由基础件与平台拼成）。 */
  if (importerLayer === 'components' && isBase(importerRel) && targetLayer === 'components' && !isBase(target)) {
    return {
      rule: 'base-upper',
      why: 'components/base/ must not import upper components — a base component composes only other base components plus platform/',
    }
  }

  if (ALLOWED[importerLayer].has(targetLayer)) return null
  /* 类型可以跨层引用（编译期的事）—— 方向类规则放行只带类型的 import。 */
  if (typeOnly) return null

  if (targetLayer === 'routes') {
    return {
      rule: 'routes-top',
      why: 'routes/ is the top layer and may not be imported — put shared vocabulary/pure helpers in platform/utils/ so lower layers never reach up',
    }
  }
  if (importerLayer === 'platform') {
    return {
      rule: 'platform-upper',
      why: 'platform/ is the bottom layer and may only import platform/ — host-agnostic helpers belong in platform/utils/',
    }
  }
  if (importerLayer === 'components') {
    return {
      rule: 'components-upper',
      why: 'components/ stays business-agnostic (no features/stores/data) — a business-aware piece belongs in features/<domain>/components/',
    }
  }
  if (importerLayer === 'stores') {
    return {
      rule: 'stores-upper',
      why: 'stores/ is public state and may not import features / routes / components — keep feature-only state inside the feature',
    }
  }
  if (importerLayer === 'data') {
    return {
      rule: 'data-upper',
      why: 'data/ holds hand-written API types and the request hooks — it may not import upper layers; pure helpers belong in platform/utils/',
    }
  }
  return {
    rule: 'upward',
    why: 'imports flow downward only (upper may depend on lower)',
  }
}

const problems = []
let scanned = 0
let resolved = 0

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) { walk(full); continue }
    if (!CODE.test(entry.name)) continue
    const importerLayer = layerOf(full)
    if (!importerLayer) continue /* 不在依赖图里（main.tsx · locales/ · test-support/…）：不查 */
    scanned++
    const importerRel = toRel(full)
    const source = readFileSync(full, 'utf8')
    for (const imp of importsOf(source)) {
      const line = source.slice(0, imp.at).split('\n').length
      if (isOldPackage(imp.spec)) {
        problems.push(
          `${importerRel}:${line} [old-package] imports '${imp.spec}' — ` +
            "do not import the old package '@yaoapp/cui'; write it against the current source (SPEC iron rule 2)",
        )
        continue
      }
      const targetAbs = resolveSpecifier(full, imp.spec)
      if (!targetAbs) continue /* 解析不到：第三方 · 内置 · 不存在 —— 跳过不报 */
      const targetLayer = layerOf(targetAbs)
      if (!targetLayer) continue /* 目标是 locales/ · test-support/ · 根文件 —— 不在依赖图里 */
      resolved++
      if (EXEMPT_IMPORTS.has(`${importerRel}|${imp.spec}`)) continue
      const hit = violationFor({
        importerLayer,
        importerRel,
        targetLayer,
        typeOnly: imp.typeOnly,
        targetAbs,
      })
      if (!hit) continue
      problems.push(
        `${importerRel}:${line} [${hit.rule}] imports '${imp.spec}' (${importerLayer} -> ${targetLayer}) — ${hit.why}`,
      )
    }
  }
}
walk(TARGET)

/* 0 文件也算通过是最危险的假绿：必须真的扫到层里的源码。 */
if (!scanned) {
  console.log(`✗ no .ts/.tsx inside a layer directory (routes/ · features/ · components/ · stores/ · data/ · platform/) — the checker refuses to pass on an empty scan (target: ${TARGET})`)
  process.exit(1)
}

if (problems.length) {
  console.log(`✗ ${problems.length} import-boundary violation(s) (${scanned} file(s) scanned, ${resolved} import(s) resolved):`)
  problems.forEach((p) => console.log('  ' + p))
  console.log('  Why: layers may only depend downward; the pairs this check allows are in architecture/03-boundaries.md §2')
  console.log('       (see architecture/03-boundaries.md §2; types may cross layers, values may not).')
  console.log('  Fix: move shared code to a lower layer, import the lower-layer module,')
  console.log("       or — for '@yaoapp/cui' — write against the current source.")
  process.exit(1)
}
console.log(`  ✓ import boundaries ok (${scanned} file(s) scanned, ${resolved} import(s) resolved)`)
