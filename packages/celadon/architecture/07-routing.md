# 07 · 路由

- **状态**：✅ 已定（`plan/01` §1 第 10 条 + §1.2 宿主集成）
- **依据**：[`../plan/01-infrastructure.md`](../plan/01-infrastructure.md) §1 · 子项 1

## 规则

- **React Router 库模式**：`react-router@^8`，**不装 `@react-router/dev`**（不用框架模式）。
- **`basename` 与 Vite `base` 同源**，取自引擎注入的 `BASE`（见 `04-host-integration.md`）。
- 路由路径**不得**占用 12 个保留前缀（见 `04-host-integration.md`）。
- `/iframe` 下不渲染外壳（见 `04-host-integration.md`）。

## 待讨论

- 路由表的组织方式（集中一处 vs 按 feature 声明）。
- 懒加载与代码分割的粒度（按页面 / 按 feature）。
- 深链与状态恢复（刷新后回到同一视图）。
