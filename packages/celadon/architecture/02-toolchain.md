# 02 · 工具链

- **版本**：v1.41
- **最后修改**：2026-10-03 09:14:44
- **说明**：构建工具 · 框架 · 语言 · 包管理器 · 脚本入口 · 判定工具

## 规则

| 项 | 结论 |
| --- | --- |
| 构建 | **Vite 8.3.1** |
| UI | **React 19.3** + **TypeScript 7**（`@types/react*` 19.3）|
| 包管理器 | **pnpm**，**本目录自己的 `package.json` 钉版本**（不靠仓库根 —— 隔离见 `01-package-and-repo.md`）|
| 国际化 | **i18next 26** + **react-i18next 17**（运行时语言包见 `08-i18n.md`）|
| 界面行为 | **`@base-ui/react` 1.8**（headless · 无样式；视觉只用 token，见 `09-theme.md`）|
| 样式 | **LESS 4** —— 应用自身的 `.less` 由 Vite 编译；设计 token 的转换见 `scripts/build-css.mjs`（见 `09-theme.md`）|
| 测试 | `vitest` + `@testing-library/react` · `user-event` · `jest-dom` + `jsdom` + `@playwright/test`（见 `14-testing.md`）|

- 依赖版本一律 **caret**，不锁小版本。
- `design/` 与 `scripts/` **零运行时依赖** —— 它们是纯静态资产与纯 Node 脚本。

## 目录

```
packages/celadon/          包根 = 设计体系（不是应用）
├── app/                   Vite 的 root（index.html 在这）
│   └── src/               应用源码 —— 分层见 00 / 03
│       ├── components/                 组件层：基础件在 base/；组件独有的语言包在本目录内
│       ├── components/base/         基础组件（其余组件平铺在 components/ 下）
│       ├── features/                  能力层（页面 + 组件 + 状态 + 测试，按业务自洽）
│       ├── routes/                    路由表与表面装配（与 features 并列 · 只装配）
│       ├── stores/                    公共态：跨功能的事实（无主状态 · 文件不加 .store 后缀）
│       ├── data/                      数据层
│       ├── platform/                  平台层（含 utils/：纯函数 · 常量 · 类型 · 不依赖上层；theme/tokens.css 与 icons/ 为生成物）
│       ├── locales/                   共用词（两处以上用的）；**私有的词跟它自己走**：feature 在 features/<域>/locales/，组件在 components/<名>/locales/
│       └── test-support/              测试支持（setup · 共享夹具 · store 重置）
│   └── logs/                运行日志与截图（<日期>/<层>-<HHMM>.log · <日期>/shots/<场景>/，git 忽略）
├── architecture/          本目录（工程规范）
├── design/                设计资产（视觉唯一来源 · 零依赖）
├── plan/                  计划与状态（过程文档）
├── scripts/               检查器与构建脚本（纯 Node）
└── package.json · vite.config.ts · pnpm-workspace.yaml
```

> **源码根是 `app/src/`**：`app/` 是 Vite root，它的目录名就是公开 URL，
> 直接铺 `components/` 会与引擎保留前缀同名并被代理截走（见 `04-host-integration.md`）。

## 脚本入口

| 命令 | 作用 |
| --- | --- |
| dev / build / preview | 应用 |
| `pnpm lint` | **基础语法先行**：`stylelint`（LESS）→ `eslint`（js/mjs）→ `tsc --noEmit`（TS 语法与类型）；链的最前面（见 `13-quality-gates.md` §2）|
| `scripts/build-css.mjs` | `tokens.less` → 两份相同 `tokens.css`：`design/tokens.css` 与 `app/src/platform/theme/tokens.css`（**唯一产物方向**）|
| `scripts/build-i18n.mjs` | `i18n/*.json` → `bundle.js`（设计页用）|
| `scripts/build-icons.mjs` | 设计目录的雪碧图 → 演示页内联 + **应用侧** `app/src/platform/icons/{sprite.svg,icon-ids.ts}`；**第三方品牌**从设计分片里按清单挑选一并生成（见 `10-icons.md`）|
| `scripts/build-i18n-types.mjs` | 三处语言包（基准 `zh-CN`）→ `app/src/platform/i18n/i18n-types.d.ts`（跑 `pnpm build:i18n`；产物**提交进仓库**，见 `08-i18n.md`）|
| `scripts/check-*.mjs` | 十一个检查器（见 `13-quality-gates.md`）|
| `scripts/tests/run.mjs` | 检查器自身的样本用例 |
| `scripts/run-logged.mjs` | 跑一条命令并把输出双写到 `app/logs/<日期>/<名>-<HHMM>.log` |
| `scripts/run-persona.mjs` | 发现并逐个跑 `features/*/tests/*.agent.mjs`，一个场景一份日志 |
| `scripts/serve-dist.mjs` | 预览 `dist/` 的静态服务器（**带 SPA fallback**，见 `04-host-integration.md`）|
| `scripts/shots.mjs` | **固化截图资产**：`capturePage()` 页面视口（跨平台）· `captureScreen()` 系统级整屏（**只实现 macOS**，其它平台明确报错）· `shotDir()` 算 `app/logs/<日期>/shots/<场景>/` |

## 判定工具

拟人层的判定用**宿主工具**（不属于仓库脚本，命令在各平台一致）：

| 工具 | 用途 | 命令 |
| --- | --- | --- |
| `ocr_recognize` | 截图 → 文字（**逐字精确**，带坐标与置信度）| `tai tool ocr_recognize --source <截图> --output_format json --language zh` |
| `decision_decide` | 事实 → **分级结论 + 置信度**（分类 / 评分 / 概率）| `tai tool decision_decide --state '<事实>' --questions '{…}'` |
| `ocr_providers` · `decision_providers` | 列可用 provider 与模型 | `tai tool ocr_providers` · `tai tool decision_providers` |

判定流程（看图 → OCR → 决策 → 按需转人）与「置信度是门控」见 `14-testing.md` §4.3。

## 已定

- **源码根 = `app/src/`**（包根是设计体系；`app/` 是 Vite root，源码再下一层避开保留前缀 —— 见 `04-host-integration.md`）。
