# 迁移台账（MIGRATION）

> 纪律 1：**每从旧包复制一个文件都要登记**。格式：源路径 → 目标路径 → 改了什么 → 为什么。
> 目的：① 不让"复制"退化成"垃圾搬家" ② 出问题时能追溯 ③ 旧包若修了 bug，能判断要不要同步。

## Step A · 目录与设计资产（2026-09-30）

| 源 | 目标 | 改动 | 原因 |
| --- | --- | --- | --- |
| `packages/cui/celadon/design/**`（25 文件） | `packages/celadon/design/**` | 整体移动；生成器用法注释与生成的 `tokens.css` 头改为新路径 | 本包即 `cui` 的 2.0（包名 `@yaoapp/cui`）；设计资产不依赖构建工具，先搬过来 |
| `packages/cui/celadon/README.md` | `packages/celadon/README.md` | 重写为"模块清单 + 当前阶段" | 描述新包而非旧位置 |
| `packages/cui/package.json` 的 `design:css` / `design:i18n` | — | 移除（暂不在本包加 `package.json`） | 本阶段不引入任何构建/包管理假设 |

## 未复制的部分（明确不做，避免"顺手搬垃圾"）

| 项 | 决定 | 说明 |
| --- | --- | --- |
| Umi 应用骨架（`.umirc.ts` / `build/` / 入口 / 主题链） | **暂不复制** | 构建工具待定，且旧构建链本身问题多（`lessc --modify-var` 主题链、`.sss/.lsss` 自定义 loader、Monaco webpack 插件 + mfsu、`after.ts` 补丁）；换工具后重新设计 |
| 旧包 `components/` `openapi/` `utils/` 等 | **按模块复制** | 等对应模块开始时，只复制用到的文件（并过四道工序） |

## 待办（跨模块）

| 项 | 何时做 |
| --- | --- |
| 构建工具选型（候选：Vite 等；不预设框架） | 00 设计规范收尾前 |
| 组件库与主题映射（token → 组件库主题） | 01 布局 / 02 组件 开始时 |
| 图标集最终化（当前界面稿用手绘线性 SVG） | 02 组件 |
| 硬编码色 / 对比度 lint 门禁 | 构建工具定下来后 |
