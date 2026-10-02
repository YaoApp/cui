# 02 · 工具链

- **状态**：✅ 已定（`plan/01` §1 第 2 · 3 · 4 条 + §1.1）
- **依据**：[`../plan/01-infrastructure.md`](../plan/01-infrastructure.md) §1 · §1.1 · §2 · 源码根与目录结构（§2 目录）

## 规则

| 项 | 结论 |
| --- | --- |
| 构建 | **Vite 8.3.1** |
| UI | **React 19.3** + **TypeScript 7**（`@types/react*` 19.3）|
| 包管理器 | **pnpm**，**本目录自己的 `package.json` 钉版本**（不靠仓库根 —— 隔离见 `01-package-and-repo.md`）|
| 测试 | `vitest` + `@testing-library/react` · `user-event` · `jest-dom` + `jsdom` + `@playwright/test`（见 `14-testing.md`）|

- 依赖版本一律 **caret**，不锁小版本。
- `design/` 与 `scripts/` **零运行时依赖** —— 它们是纯静态资产与纯 Node 脚本。

## 目录

```
packages/celadon/          包根 = 设计体系（不是应用）
├── app/                   Vite 的 root（index.html 在这）
│   └── src/               应用源码 —— 分层见 00 / 03
│       ├── components/base/         组件层：基础组件（其余组件平铺在 components/ 下）
│       ├── features/                  能力层（页面 + 组件 + 状态 + 测试，按业务自洽）
│       ├── routes/                    路由表与表面装配（与 features 并列 · 只装配）
│       ├── data/                      数据层
│       ├── platform/                  平台层（含 utils/：纯函数 · 常量 · 类型 · 不依赖上层）
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
| `scripts/build-css.mjs` | `tokens.less` → `tokens.css`（**唯一产物方向**）|
| `scripts/build-i18n.mjs` | `i18n/*.json` → `bundle.js`（设计页用）|
| `scripts/check-*.mjs` | 七个检查器（见 `13-quality-gates.md`）|
| `scripts/tests/run.mjs` | 检查器自身的样本用例 |
| `scripts/run-logged.mjs` | 跑一条命令并把输出双写到 `app/logs/<日期>/<名>-<HHMM>.log` |
| `scripts/run-persona.mjs` | 发现并逐个跑 `features/*/tests/*.agent.mjs`，一个场景一份日志 |
| `scripts/shots.mjs` | **固化截图资产**：`capturePage()` 页面视口（跨平台）· `captureScreen()` 系统级整屏（**只实现 macOS**，其它平台明确报错）· `shotDir()` 算 `app/logs/<日期>/shots/<场景>/` |

## 已定

- **源码根 = `app/src/`**（包根是设计体系；`app/` 是 Vite root，源码再下一层避开保留前缀 —— 见 `04-host-integration.md`）。
