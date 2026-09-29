# celadon — CUI **2.0**（代号 Celadon · 青瓷）

> **Celadon（青瓷）** —— 青瓷釉色正是我们最终定下的品牌色 **`#2A7B7B`**：
> 青而不艳、温润、耐看。它同时承载「**双面 App**」的器物隐喻：**同一件器，一面看人，一面看 Agent**。
> **本目录即 CUI 2.0 的新代码落点**（"所有新的都往内里搬"）。

- 状态：**建设中**（2026-09-29 起）。早前的 BUILD 原型已清空，其接口缺口清单保留在
  [`design/v2/build-gaps.md`](../../../../design/v2/build-gaps.md)。
- 备份：1.x 冻结在 **`git tag v1-final`**（`2622079c`）。
- 设计先行：见 [`design/v2/`](../../../../design/v2/README.md)
  - [`design-system.md`](../../../../design/v2/design-system.md)（**v1.1 定稿**：token / 配色 / 排版 / 红线）
  - [`interaction-spec.md`](../../../../design/v2/interaction-spec.md)（交互规范）
  - [`architecture.md`](../../../../design/v2/architecture.md)（迁移策略 / 落点）
  - 导航 UE（✅ 定稿）：[`../navigation/design.md`](../../../../design/navigation/design.md)

## 目录

```
celadon/
  design/   设计 token 单一来源 + 色卡 + 详细界面稿
    ├── tokens.less        唯一来源（变量名全用全称，无缩写）
    ├── build-css.mjs      tokens.less → tokens.css
    ├── tokens.css         自动生成，勿手改
    ├── color-card.html    色卡（实时读 tokens.css，自动算对比度）
    └── mock.html          详细界面稿（同样零硬编码）
  shell/    AppShell · NavColumn · ContentHeader · SidePanel      （P0 待建）
  navigation/  navContexts/*（会话历史 / 收件箱 / 看板 / 工作区 / 电脑） （P1+ 待建）
  apps/     各应用页面                                            （P1+ 待建）
```

## 约定

- **契约优先**：消息按 `@/openapi` 的 `MessageType`（17 种）渲染；缺字段记入文档，不擅自改后端契约。
- **复用不复制**：`openapi/` `types/` `utils/` `hooks/` `chatbox` 流解析 → import 复用。
- **不碰老界面**：新样式作用域化在 `.celadon` 下，迁移完成后再切入口。
- **命名**：变量/类名**用全称，不用缩写**（`--background-content` 而非 `--bg-content`、`--radius-medium` 而非 `--r-md`）。
