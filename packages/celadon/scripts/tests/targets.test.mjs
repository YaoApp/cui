import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import test from 'node:test'
import { APP_SRC, PACKAGE, checkersFor, classify, relatedUnitTests } from '../lib/targets.mjs'
import { readTargets, reports } from '../lib/inputs.mjs'

/** 建一个临时的包结构：tmp/app/src/... */
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'cui-targets-'))
  const src = join(root, 'app', 'src')
  return { root, src, write(rel, content = '') {
    const full = join(root, rel)
    mkdirSync(join(full, '..'), { recursive: true })
    writeFileSync(full, content)
    return full
  } }
}

test('classify 按位置与后缀分组', () => {
  const c = classify([
    join(APP_SRC, 'components/base/input/input.tsx'),
    join(APP_SRC, 'components/base/input/input.tsx'),
    join(APP_SRC, 'components/base/input/input.test.tsx'),
    join(APP_SRC, 'components/base/input/input.less'),
    join(APP_SRC, 'locales/zh-CN.json'),
    join(APP_SRC, 'assets/data.json'),
    join(PACKAGE, 'design/tokens.less'),
    join(PACKAGE, 'design/foundations.html'),
    join(PACKAGE, 'plan/01-infrastructure.md'),
    join(PACKAGE, 'package.json'),
    join(PACKAGE, 'eslint.config.js'),
    join(PACKAGE, 'scripts/lib/targets.mjs'),
  ])
  assert.equal(c.code.length, 1)
  assert.match(c.code[0], /components\/base\/input\/input\.tsx$/)
  assert.equal(c.tests.length, 1)
  assert.equal(c.styles.length, 1)
  assert.equal(c.locales.length, 1)
  assert.equal(c.design.length, 2)
  assert.equal(c.docs.length, 1)
  assert.equal(c.config.length, 2)
  assert.equal(c.other.length, 2)
})

test('checkersFor 按类别给出检查器与范围', () => {
  const style = checkersFor([join(APP_SRC, 'platform/theme/tokens.css')]).map((c) => `${c.script}:${c.scope}`)
  assert.ok(style.includes('check-css-conventions.mjs:files'))
  assert.ok(style.includes('check-tokens.mjs:files'))
  assert.ok(style.includes('check-generated.mjs:whole'))
  assert.ok(style.includes('check-readme-values.mjs:whole'))
  const cssRule = checkersFor([join(APP_SRC, 'platform/theme/tokens.css')]).find((c) => c.script === 'check-css-conventions.mjs')
  assert.deepEqual(cssRule.files, ['app/src/platform/theme/tokens.css'])

  const code = checkersFor([join(APP_SRC, 'features/scaffold/base/base.tsx')]).map((c) => c.script)
  for (const script of ['check-app-layout.mjs', 'check-base-components.mjs', 'check-bridge-imports.mjs', 'check-effect-url-write.mjs', 'check-import-boundaries.mjs', 'check-i18n.mjs']) {
    assert.ok(code.includes(script), script)
  }

  const designPage = checkersFor([join(PACKAGE, 'design/foundations.html')]).map((c) => c.script)
  assert.ok(designPage.includes('check-css-conventions.mjs'))
  assert.ok(designPage.includes('check-generated.mjs'))
  assert.ok(!designPage.includes('check-design-pages.mjs'), 'check-design-pages 是独立的 check:design，不进内圈')

  const designScript = checkersFor([join(PACKAGE, 'design/serve.mjs')]).map((c) => c.script)
  assert.ok(!designScript.includes('check-css-conventions.mjs'), 'design 下的脚本不是样式检查器的输入')
  assert.ok(!designScript.includes('check-tokens.mjs'))
  assert.ok(designScript.includes('check-generated.mjs'))

  const designTokens = checkersFor([join(PACKAGE, 'design/tokens.less')]).map((c) => c.script)
  assert.ok(designTokens.includes('check-css-conventions.mjs'), 'tokens.less 是 css-conventions 的检查面')
  assert.ok(!designTokens.includes('check-tokens.mjs'), 'tokens.less 是定义源，不是 check-tokens 的检查面')
  assert.ok(designPage.includes('check-generated.mjs'))

  const iconOutput = checkersFor([join(APP_SRC, 'platform/icons/icon-ids.ts')]).map((c) => c.script)
  assert.ok(iconOutput.includes('check-generated.mjs'), '改生成物要重跑产物比对')
  const themeOutput = checkersFor([join(APP_SRC, 'platform/theme/tokens.css')]).map((c) => c.script)
  assert.ok(themeOutput.includes('check-generated.mjs'))
  const i18nTypes = checkersFor([join(APP_SRC, 'platform/i18n/i18n-types.d.ts')]).map((c) => c.script)
  assert.ok(i18nTypes.includes('check-i18n-types.mjs'))
  const buildCss = checkersFor([join(PACKAGE, 'scripts/build-css.mjs')]).map((c) => c.script)
  assert.ok(buildCss.includes('check-generated.mjs'), '改生成脚本要重跑产物比对')
  const buildI18n = checkersFor([join(PACKAGE, 'scripts/build-i18n-types.mjs')]).map((c) => c.script)
  assert.ok(buildI18n.includes('check-i18n-types.mjs'))

  assert.deepEqual(checkersFor([join(PACKAGE, 'plan/01-infrastructure.md')]).map((c) => c.script), ['check-doc-references.mjs'])
  assert.deepEqual(checkersFor([join(PACKAGE, 'scripts/lib/targets.mjs')]), [])
  assert.deepEqual(checkersFor([]), [])
})

test('relatedUnitTests 选同目录用例与引用改动模块的用例', () => {
  const { root, src, write } = fixture()
  try {
    const input = write('app/src/components/base/input/input.tsx')
    write('app/src/components/base/input/input.test.tsx', "import { Input } from './input'\n")
    const card = write('app/src/components/base/card/card.tsx')
    const relativeImporter = write('app/src/components/base/card/card-view.test.tsx', "import { Card } from './card'\n")
    const useReading = write('app/src/features/reading/use-reading.ts')
    const directTest = write('app/src/features/reading/use-reading.test.ts', "import { useReading } from '@/features/reading/use-reading'\n")
    const importerTest = write('app/src/features/reading/reading-page.test.tsx', "import { useReading } from '@/features/reading/use-reading'\n")
    const indexFile = write('app/src/features/list/index.ts')
    const indexTest = write('app/src/features/list/list.test.ts', "import { List } from '@/features/list'\n")
    write('app/src/components/base/panel/panel.tsx', 'export const panel = 1\n')

    assert.deepEqual(relatedUnitTests([input], { root: src }), [join(src, 'components/base/input/input.test.tsx')])
    assert.deepEqual(relatedUnitTests([card], { root: src }), [relativeImporter])
    assert.deepEqual(relatedUnitTests([useReading], { root: src }).sort(), [directTest, importerTest].sort())
    assert.deepEqual(relatedUnitTests([indexFile], { root: src }), [indexTest])
    const boardCard = write('app/src/features/board/board-card.tsx')
    write('app/src/features/board/index.ts', "export { BoardCard } from './board-card'\n")
    const barrelTest = write('app/src/features/board/board-page.test.tsx', "import { BoardCard } from '@/features/board'\n")
    assert.deepEqual(relatedUnitTests([boardCard], { root: src }), [barrelTest], '从 barrel 间接引用的用例也要选中')
    assert.deepEqual(relatedUnitTests([join(src, 'components/base/panel/panel.tsx')], { root: src }), [])
    assert.deepEqual(relatedUnitTests([directTest], { root: src }), [directTest])
    assert.deepEqual(relatedUnitTests([join(PACKAGE, 'scripts/lib/targets.mjs')], { root: src }), [])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('relatedUnitTests 忽略第三方与解析不到的说明符', () => {
  const { root, src, write } = fixture()
  try {
    const changed = write('app/src/platform/transport/fetch.ts')
    write('app/src/platform/transport/transport.test.ts', "import { fetchJson } from 'some-package'\nimport { other } from '@/nowhere/missing'\n")
    assert.deepEqual(relatedUnitTests([changed], { root: src }), [])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('readTargets 区分目录模式与文件模式', () => {
  const { root, src, write } = fixture()
  try {
    const one = write('app/src/features/a/one.ts')
    const two = write('app/src/features/b/two.ts')
    const dir = join(src, 'features')

    const none = readTargets([], { defaultDir: src })
    assert.equal(none.dirMode, true)
    assert.deepEqual(none.roots, [src])
    assert.equal(none.filter, null)
    assert.equal(none.target, src)

    const byDir = readTargets([dir], { defaultDir: src })
    assert.equal(byDir.dirMode, true)
    assert.deepEqual(byDir.roots, [dir])
    assert.equal(byDir.target, dir)

    const byFiles = readTargets([one, two], { defaultDir: src })
    assert.equal(byFiles.dirMode, false)
    assert.equal(byFiles.target, src)
    assert.equal(byFiles.filter.size, 2)
    assert.deepEqual(byFiles.roots.sort(), [join(src, 'features/a'), join(src, 'features/b')].sort())
    assert.equal(reports(byFiles.filter, one), true)
    assert.equal(reports(byFiles.filter, join(src, 'features/c/three.ts')), false)
    assert.equal(reports(null, one), true)

    const mixed = readTargets([dir, one], { defaultDir: src })
    assert.equal(mixed.dirMode, true)
    assert.deepEqual(mixed.roots, [dir])

    const missing = readTargets([join(root, 'nope.ts')], { defaultDir: src })
    assert.equal(missing.missing.length, 1)
    assert.equal(missing.filter, null)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
