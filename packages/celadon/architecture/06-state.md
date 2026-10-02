# 06 · 状态

- **状态**：✅ 已定
- **版本**：v1.5
- **最后修改**：2026-10-02 12:48:38
- **说明**：状态跟 feature 走 · 跨 feature 的落位判据

## 规则

- **`zustand`** 是唯一状态库；**不用 mobx**；自研的 `storex` **不复活**。持久化用 `persist` 中间件。
- **没有全站 `state/` 目录** —— **状态跟 feature 走**：一个 feature 的页面 · 组件 · 状态 · 测试都住在
  `app/src/features/<域>/` 里，人和 Agent 在**同一处**找齐。
- store 文件与所属单元同名、加 `.store`（`features/inbox/inbox.store.ts` · `components/data-table/data-table.store.ts`），导出 `useXxxStore`。
- **组件也可以有自己的私有 store**（只服务它自己的局部状态）；跨组件的状态往上走，见下表。
- **测试里的 store 复位是自动的**（`test-support` 用 `import.meta.glob` 发现所有 `*.store.ts`），新增 store 不用改配置。
- store **不写 DOM、不发请求**；取数走数据层钩子（见 `05-data-and-api.md`）。

## 跨 feature 的状态（先别预设）

真出现"多个 feature 都要用"的状态时，按它的**性质**落位，而不是新开一层：

| 性质 | 落位 |
| --- | --- |
| 壳 / 运行时（主题 · 栏宽 · 侧栏折叠） | `app/src/platform/` |
| 服务端数据的缓存与流 | `app/src/data/` |
| 确属**客户端共享领域状态**、且没有单一归属 feature | 该 feature 先导出；**出现第三个使用者**时再议（不预设目录） |

## 什么不进 store

- 只在单个组件内用的 UI 状态（展开 / 输入中）→ 留在组件。
- 路由状态 → 交给路由（见 `07-routing.md`）。

## 待讨论

- 是否允许 feature **互相订阅**对方的 store（现在规则是 feature 之间不互相 import）。
- store 的测试约定（重置 / 隔离；同行做法是全局 `__mocks__` 在每个用例前重置所有 store）。
