# 13 · 质量门禁

- **状态**：✅ 扫描期已跑通 · ⏳ 构建期待接线
- **依据**：[`../plan/01-infrastructure.md`](../plan/01-infrastructure.md) §4 子项 6a / 6b

## 扫描期（已跑通 · 纯 Node 脚本）

| 检查器 | 拦什么 |
| --- | --- |
| `check-tokens` | 硬编码颜色 / 字号 / 行高 / 圆角 / 间距 / 线宽（系统色与品牌官方色白名单）|
| `check-css-conventions` | **物理方向属性**（`margin-left` `border-left` `left` `text-align:left` …）|
| `check-i18n` | 缺 key · 漏翻 · 繁中夹简体 · 日文汉字误用 |
| `check-readme-values` | README 引用的色值与 `tokens.css` 不一致 |
| `check-generated` | 产物与源不一致（`tokens.less` → `tokens.css` 等）|
| `check-plan-md` | `plan/` 的表格结构与禁用小节（"待讨论"等）。**单元格里别写裸 `|`** —— 它不认 `\|` 转义，会按列数不一致报错 |
| `check-app-layout` | 测试产物位置：**单测挨着源文件**（不许进 `tests/`）· **浏览器与拟人必须在 `tests/` 内** —— 两条方向相反的规则，各有正反样本 |
| `check-base-components` | `features/` 与 `routes/` 里**不许裸写 `<button>`** —— 用 `components/base/button`；否则每页各写一套按钮 |
| `check-effect-url-write` | **不许在 `useEffect` 里写 URL**（`setSearchParams` / `navigate`）—— 会与"读 URL 写 store"互相追成同步死循环，见 `07-routing.md` |

- **运行时输出一律英文**（检查器 · 测试 · 脚本的 console 与报错 · 用例名）；注释与文档仍是中文。
- **检查器自身必须有样本测试**：`node scripts/tests/run.mjs`（**48 / 48**；每条规则一个正例 + 一个违规例）。
- **五层命令**：`pnpm check`（规范门禁）· `pnpm test:checkers`（检查器自测）· `pnpm test`（单元 / 组件）·
  `pnpm test:browser`（浏览器）· `pnpm test:persona`（拟人）；一把跑 `pnpm test:all`。
- **加一条规则，必须同时加违规样本** —— 否则"全过"是假象。

## 构建期（⏳ 待接线）

| 门禁 | 内容 |
| --- | --- |
| **stylelint 自定义规则** | 只允许 `var(--token)` · 禁物理方向属性（把扫描版升级为构建期拦截）|
| **TS 类型约束** | 如 `type Color = \`var(--${string})\`` 让裸色值**无法通过类型** |
| **组件边界** | 禁组件外写内联边框（会露浏览器默认焦点环）—— 需"组件目录"概念，静态扫描认不出 |
| **反向依赖边界** | **禁 `import '@yaoapp/cui'`** |
| **接线** | 进 CI job / pre-commit —— 让**构建或 CI 失败**，不只是脚本失败 |
| **celadon 的 CI · 一** | `.github/workflows/celadon-test-build.yml`：**规范门禁 → 单元测试 → 构建**（前一步不过不进下一步）；`dist/` 由 `.gitignore` 挡在提交之外；结束时把 `app/logs/*/*.log` 写进运行摘要 |
| **celadon 的 CI · 二** | `.github/workflows/celadon-browser-test.yml`：**浏览器测试**，单独一份、自带环境准备；失败时上传轨迹与截图。分两份是因为它要起服务、要真浏览器，成本高一档 |

## 待讨论

- 检查器对 `app/src/` 的覆盖面：目前只有"用例位置"一条扫源码树，其余（硬编码色 · 依赖方向）仍只扫 `design/`。
- pre-commit 与 CI 的分工（哪些必须本地拦，哪些留 CI）。
