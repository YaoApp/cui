# janus — CUI **2.0**（代号 Janus）

> **Janus**（雅努斯，罗马双面神：一面看人、一面看 Agent）→ 呼应我们的 **双面 App**。
> **本目录即 CUI 2.0 的新代码落点**（"所有新的都往内里搬"）。

- 状态：**已清空重做**（2026-09-29）。昨天的 BUILD 原型代码已删除，其**接口缺口清单**保留在
  [`design/v2/build-gaps.md`](../../../../design/v2/build-gaps.md)。
- 备份：1.x 冻结在 **`git tag v1-final`**（`2622079c`）。
- 设计先行：见 [`design/v2/`](../../../../design/v2/README.md)
  - [`design-system.md`](../../../../design/v2/design-system.md)（token / 配色 / 排版 / 迁移）
  - [`interaction-spec.md`](../../../../design/v2/interaction-spec.md)（交互规范）
  - [`architecture.md`](../../../../design/v2/architecture.md)（迁移策略 / 落点）
  - 导航 UE（✅ 定稿）：[`../navigation/design.md`](../../../../design/navigation/design.md)

## 目录规划（待填）

```
janus/
  design/   token 与主题（单一来源 → CSS 变量 + AntD modifyVars）
  shell/    AppShell · NavColumn · ContentHeader · SidePanel
  nav/      navContexts/*（会话历史 / 收件箱 / 看板 / 工作区 / 电脑…）
  apps/     各应用页面（BUILD / Apps / …）
```

## 约定

- **契约优先**：消息按 `@/openapi` 的 `MessageType`（17 种）渲染；缺字段记入文档，不擅自改后端契约。
- **复用不复制**：`openapi/` `types/` `utils/` `hooks/` `chatbox` 流解析 → import 复用。
- **不碰老界面**：janus 的样式作用域化（`.jn2-*`），迁移完成后再切入口。
