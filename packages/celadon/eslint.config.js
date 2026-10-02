/* 基础语法检查（eslint）—— gate 第一层，跑在自定义检查器之前。
   只做**语法与常见错误**，不代替自定义检查器（那些管项目不变量：tokens · 语言包 · 依赖方向）。

   **TS/TSX 这一层由 `tsc --noEmit` 负责**：项目用的是 TypeScript 7（原生编译器），
   `typescript-eslint` 8 尚不支持（"does not support TS 7.0"），所以 eslint 先只覆盖 `.js` / `.mjs`；
   等它支持了再扩到 TS（见 plan/01）。
   `app/src` 里的 TS 语法与类型由 tsc 拦，TS 的**风格**类规则暂时缺位。 */
import js from '@eslint/js'
import globals from 'globals'

export default [
  { ignores: ['dist', 'node_modules', 'app/logs', 'coverage', 'test-results', 'playwright-report'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node, ...globals.browser } },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
]
