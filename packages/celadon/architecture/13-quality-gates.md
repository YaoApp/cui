# 13 · 质量门禁

- **版本**：v1.38
- **最后修改**：2026-10-03 09:12:13
- **说明**：基础语法 · 检查器 · CI · 产物与日志

## 1. 规则

- **门禁分三层，由外到内**：**基础语法**（`stylelint` · `eslint` · `tsc`）→ **检查器**（项目不变量：tokens ·
  语言包 · 依赖方向 · 产物一致性）→ **测试**（单元 / 浏览器 / 拟人）。**基础语法排在最前**：语法都不对，
  后面的结论没有意义。检查器查"不该发生的"，测试查"该发生的"。
- **基础语法与项目不变量分工**：语法 · 格式 · 类型交给成熟工具（它们有自己的规则集与生态）；
  检查器只写**这个项目特有**的规则 —— 例如"颜色必须走 token"，通用工具不知道。
- **加一条规则必须同时加违规样本**（每条规则一个**正例** + 一个**违规例**，`pnpm test:checkers`）——
  否则"全过"是假象；**扩面时同步补正反样本**，否则扩的是假覆盖。
- **六层命令**：`pnpm lint`（基础语法）· `pnpm check`（规范门禁）· `pnpm test:checkers`（检查器自测）·
  `pnpm test`（单元 / 组件）· `pnpm test:browser`（浏览器）· `pnpm test:persona`（拟人）；一把跑 `pnpm test:all`。
- **运行时输出一律英文**（检查器 · 测试 · 脚本的 console 与报错 · 用例名）；注释与文档仍是中文。
- **每个检查器扫到它该扫的目录**：只扫一部分会得到"看起来全过"。

## 2. 基础语法（lint）

| 工具 | 管什么 | 命令 |
| --- | --- | --- |
| `stylelint` | LESS 的语法与格式（`stylelint-config-standard-less`）| `pnpm lint:styles` |
| `eslint` | `.js` / `.mjs` 的语法与常见错误（`@eslint/js` recommended）| `pnpm lint:js` |
| `tsc --noEmit` | **TS 语法与类型** | `pnpm lint:types` |

- **一把跑** `pnpm lint`（三件套顺序执行）。
- **`currentColor` 不是违规**：`value-keyword-case` 关掉 —— 大小写是 SVG 的规范写法，设计页也这么写。
- **TS 的风格类规则暂缺**：项目用 **TypeScript 7**（原生编译器），`typescript-eslint` 尚不支持
  （`does not support TS 7.0`），所以 eslint 目前只覆盖 js/mjs，**TS 这一层由 `tsc` 兜住语法与类型**；
  等它支持后再扩到 TS（见 `plan/01`）。

## 3. 检查器（纯 Node 脚本）

| 检查器 | 拦什么 |
| --- | --- |
| `check-tokens` | 硬编码颜色 / 字号 / 行高 / 圆角 / 间距 / 线宽（系统色与品牌官方色白名单）|
| `check-css-conventions` | **物理方向属性**（`margin-left` `border-left` `left` `text-align:left` …）|
| `check-i18n` | 把三处语言包（`app/src/locales/` · `features/*/locales/` · `components/*/locales/`）按 locale 合并后校验：缺 key · 漏翻 · 繁中夹简体 · 日文汉字误用 · **基准语言 `zh-CN` 缺失**（某处不存在则跳过）· **代码里的硬编码汉字文案**（扫描 `app/src` 的 `.ts` / `.tsx`，先剥注释，排除 `locales/` 与测试 / 生成物；豁免走 `ALLOW_LITERALS` 并写明原因）|
| `check-i18n-types` | **i18n 类型产物过期**：按基准语言 `zh-CN` 重新生成 `i18n-types.d.ts` 再与仓库里的比对（不同即失败，跑 `pnpm build:i18n`）|
| `check-readme-values` | README 引用的色值与 `tokens.css` 不一致 |
| `check-generated` | **产物与源不一致**：重新生成 `icons.html` / `mock.html` / **应用侧图标产物**，以及 `tokens.less` → 两份 `tokens.css`（`design/` 与 `app/src/platform/theme/`），再与仓库比对（跑 `node scripts/build-css.mjs`）|
| `check-plan-md` | `plan/` 的表格结构与禁用小节（"待讨论"等）。**单元格里别写竖线** —— 检查器不认反斜杠转义，会按列数不一致报错 |
| `check-app-layout` | 测试产物位置：**单测挨着源文件**（不许进 `tests/`）· **浏览器与拟人必须在 `tests/` 内** —— 两条方向相反的规则，各有正反样本 |
| `check-doc-references` | 文档提到的 `app/src/...` 路径 · `scripts/*.mjs` · `pnpm <cmd>` **必须真实存在** —— 文档漂移不靠人 review |
| `check-base-components` | `features/` · `routes/` · `components/`（`components/base/` 豁免）里**不许裸写 `<button>` / `<select>`** —— 用 `components/base/button` / `components/base/select`；否则每页各写一套控件 |
| `check-effect-url-write` | **不许在 `useEffect` 里写 URL**（`setSearchParams` / `navigate`）—— 会与"读 URL 写 store"互相追成同步死循环，见 `07-routing.md` |

## 4. CI（`../../.github/workflows/`）

| 工作流 | 内容 |
| --- | --- |
| `celadon-test-build.yml` | **基础语法（`pnpm lint`）→ 规范门禁 → 单元测试 → 构建**，前一步不过不进下一步；`dist/` 由 `.gitignore` 挡在提交之外；结束时把 `app/logs/*/*.log` 写进运行摘要 |
| `celadon-browser-test.yml` | **浏览器测试**，单独一份、自带环境准备；失败时上传轨迹与截图（要起服务、要真浏览器，成本高一档）|

## 5. 产物与日志

- **每层一份日志**：`app/logs/<日期>/<层>-<HHMM>.log`（`lint-` · `gates-` · `checkers-` · `unit-` · `browser-` · 拟人按场景名）。
- **链一份日志**：`pnpm test:all` 落 `all-<HHMM>.log` —— **断在哪一步只有链的日志说得清**。
- **拟人截图**：`app/logs/<日期>/shots/<场景>/`，由 `scripts/shots.mjs` 产出（脚本自己不调 `page.screenshot()`）。
