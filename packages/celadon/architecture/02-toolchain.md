# 02 · 工具链

- **状态**：✅ 已定（`plan/01` §1 第 2 · 3 · 4 条 + §1.1）
- **依据**：[`../plan/01-infrastructure.md`](../plan/01-infrastructure.md) §1 · §1.1 · §2 · 源码根与目录结构（§2 目录）

## 规则

| 项 | 结论 |
| --- | --- |
| 构建 | **Vite 8.3.1** |
| UI | **React 19.3** + **TypeScript 6**（`@types/react*` 19.3）|
| 包管理器 | **pnpm**，根 `package.json` 的 `packageManager` 锁死版本 |
| 测试 | `vitest` + Testing Library + `jsdom` + `@playwright/test`（见 `14`）|

- 依赖版本一律 **caret**，不锁小版本。
- `design/` 与 `scripts/` **零运行时依赖** —— 它们是纯静态资产与纯 Node 脚本。

## 目录

```
packages/celadon/          包根 = 设计体系（不是应用）
├── app/                   Vite 的 root（index.html 在这）
│   └── src/               应用源码 —— 分层见 00 / 03
│       ├── components/base/         组件层：基础组件（其余组件平铺在 components/ 下）
│       ├── features/                  能力层（页面 + 组件 + 状态 + 测试，按业务自洽）
│       ├── data/                      数据层
│       ├── platform/                  平台层
│       ├── lib/                       工具层（纯函数 · 常量 · 类型 · 无依赖）
│       └── test-support/              测试支持（setup · 共享夹具 · store 重置）
├── architecture/          本目录（工程规范）
├── design/                设计资产（视觉唯一来源 · 零依赖）
├── plan/                  计划与状态（过程文档）
├── scripts/               检查器与构建脚本（纯 Node）
└── package.json · vite.config.ts · pnpm-workspace.yaml
```

> **源码根是 `app/src/`**：`app/` 是 Vite root，它的目录名就是公开 URL，
> 直接铺 `components/` 会与引擎保留前缀同名并被代理截走（见 `04`）。

## 脚本入口

| 命令 | 作用 |
| --- | --- |
| dev / build / preview | 应用 |
| `scripts/build-css.mjs` | `tokens.less` → `tokens.css`（**唯一产物方向**）|
| `scripts/build-i18n.mjs` | `i18n/*.json` → `bundle.js`（设计页用）|
| `scripts/check-*.mjs` | 七个检查器（见 `13`）|
| `scripts/tests/run.mjs` | 检查器自身的样本用例 |

## 已定

- **源码根 = `app/src/`**（包根是设计体系；`app/` 是 Vite root，源码再下一层避开保留前缀 —— 见 `04`）。
