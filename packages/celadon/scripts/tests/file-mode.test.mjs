import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import assert from 'node:assert/strict'
import test from 'node:test'
import { APP_SRC, DESIGN, PACKAGE } from '../lib/targets.mjs'

/** 在真实树下临时造一个违规文件，跑完删掉；返回退出码。 */
function withTempFile(rel, content, fn) {
  const file = join(PACKAGE, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content)
  try {
    return fn(file)
  } finally {
    rmSync(file, { force: true })
    const dir = dirname(file)
    if (basename(dir) === '__check_tmp__') rmSync(dir, { recursive: true, force: true })
  }
}

function run(script, files) {
  try {
    execFileSync('node', [join(PACKAGE, 'scripts', script), ...files], { cwd: PACKAGE, stdio: 'pipe', encoding: 'utf8' })
    return 0
  } catch (error) {
    return error.status ?? 1
  }
}

/** 检查器 → 一个真实且干净的文件（文件模式下应当通过）。 */
const CLEAN_FILE = [
  ['check-css-conventions.mjs', 'app/src/components/base/button/button.less'],
  ['check-tokens.mjs', 'app/src/components/base/button/button.less'],
  ['check-app-layout.mjs', 'app/src/components/base/input/input.test.tsx'],
  ['check-base-components.mjs', 'app/src/components/base/button/button.tsx'],
  ['check-bridge-imports.mjs', 'app/src/components/nav/nav.tsx'],
  ['check-effect-url-write.mjs', 'app/src/components/nav/nav.tsx'],
  ['check-import-boundaries.mjs', 'app/src/platform/transport/fetch.ts'],
  ['check-doc-references.mjs', 'plan/01-infrastructure.md'],
]

for (const [script, rel] of CLEAN_FILE) {
  test(`${script} 文件模式：干净文件通过`, () => {
    assert.equal(run(script, [join(PACKAGE, rel)]), 0)
  })
}

test('check-css-conventions.mjs 文件模式：物理方向属性被拦下', () => {
  const code = withTempFile('design/__check-tmp-physical.less', '.x { margin-left: 1px; }\n', (file) => run('check-css-conventions.mjs', [file]))
  assert.equal(code, 1)
})

test('check-tokens.mjs 文件模式：写死字号被拦下', () => {
  const code = withTempFile('design/__check-tmp-token.less', '.x { font-size: 13px; }\n', (file) => run('check-tokens.mjs', [file]))
  assert.equal(code, 1)
})

test('check-app-layout.mjs 文件模式：没有同源兄弟的单测被拦下', () => {
  const code = withTempFile('app/src/features/__check_tmp__/lonely.test.tsx', 'export {}\n', (file) => run('check-app-layout.mjs', [file]))
  assert.equal(code, 1)
})

test('check-base-components.mjs 文件模式：裸控件被拦下', () => {
  const code = withTempFile('app/src/features/__check_tmp__/raw.tsx', 'export const x = () => <button>ok</button>\n', (file) => run('check-base-components.mjs', [file]))
  assert.equal(code, 1)
})

test('check-bridge-imports.mjs 文件模式：上层直接引桥被拦下', () => {
  const code = withTempFile('app/src/features/__check_tmp__/bridge.ts', "import { ping } from '@/platform/bridge'\nexport const x = ping\n", (file) => run('check-bridge-imports.mjs', [file]))
  assert.equal(code, 1)
})

test('check-effect-url-write.mjs 文件模式：effect 里写 URL 被拦下', () => {
  const code = withTempFile('app/src/features/__check_tmp__/effect.ts', "export const x = () => useEffect(() => { navigate('/a') }, [])\n", (file) => run('check-effect-url-write.mjs', [file]))
  assert.equal(code, 1)
})

test('check-import-boundaries.mjs 文件模式：往上引被拦下', () => {
  const code = withTempFile('app/src/platform/__check_tmp__/up.ts', "import { Button } from '@/components/base/button'\nexport const x = Button\n", (file) => run('check-import-boundaries.mjs', [file]))
  assert.equal(code, 1)
})

test('check-doc-references.mjs 文件模式：悬空引用被拦下', () => {
  const code = withTempFile('plan/__check-tmp-doc.md', '见 `scripts/does-not-exist.mjs`。\n', (file) => run('check-doc-references.mjs', [file]))
  assert.equal(code, 1)
})

test('文件模式：参数不存在一律报错', () => {
  const missing = join(PACKAGE, 'app', 'src', 'not-a-real-file.ts')
  for (const [script] of CLEAN_FILE) {
    assert.notEqual(run(script, [missing]), 0, script)
  }
})

test('文件模式的目标根与包根对齐', () => {
  assert.ok(APP_SRC.endsWith('packages/celadon/app/src'))
  assert.ok(DESIGN.endsWith('packages/celadon/design'))
})
