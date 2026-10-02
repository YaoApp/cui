# 06 · 状态

- **版本**：v1.6
- **最后修改**：2026-10-02 13:13:27
- **说明**：状态跟 feature 走 · 跨 feature 按性质落位（`platform/` · `store/` · `data/`）· 事实用第二个使用者、外观用第三个

## 规则

- **`zustand`** 是唯一状态库；**不用 mobx**；自研的 `storex` **不复活**。持久化用 `persist` 中间件。
- **没有全站 `state/` 目录** —— **状态跟 feature 走**：一个 feature 的页面 · 组件 · 状态 · 测试都住在
  `app/src/features/<域>/` 里，人和 Agent 在**同一处**找齐。
- store 文件与所属单元同名、加 `.store`（`features/inbox/inbox.store.ts` · `components/data-table/data-table.store.ts`），导出 `useXxxStore`。
- **组件也可以有自己的私有 store**（只服务它自己的局部状态）；跨组件的状态往上走，见下表。
- **测试里的 store 复位是自动的**（`test-support` 用 `import.meta.glob` 发现所有 `*.store.ts`），新增 store 不用改配置。
- store **不写 DOM、不发请求**；取数走数据层钩子（见 `05-data-and-api.md`）。

## 跨 feature 的状态

按它的**性质**落位：

| 性质 | 落位 | 例 |
| --- | --- | --- |
| 壳 / 运行时（宿主 · 外观 · 布局机制） | `platform/` | 主题 · 语言 · 当前表面 · 侧栏折叠 |
| **跨 feature 的业务事实** | **`store/`**（应用态） | 当前用户 · 当前会话 · 通知队列 |
| 服务端数据的缓存与流 | `data/` | 接口缓存 · 流式通道 |

**`store/` 的规则**：只放**事实**（"当前用户是谁"），不放**过程**（某个列表的 loading）；
不许 import `features/`（否则又变成某个 feature 的私物）；features 可以 import 它。

**阈值是"第二个"，不是"第三个"** —— 与组件上提相反：
两个 feature 各存一份"当前用户"就是**两份真相**（会不一致，且查不出来）；
两个 feature 各画一个按钮只是**两份长相**（丑，但可挽回）。所以共享**事实**一出现第二处就上提，
共享**外观**才等第三个使用者（见 `03-boundaries.md`）。

**判定一句话**：归属看**谁需要它**，不看谁先用它。

## 什么不进 store

- 只在单个组件内用的 UI 状态（展开 / 输入中）→ 留在组件。
- 路由状态 → 交给路由（见 `07-routing.md`）。

## 待讨论

- `store/` **还没建**（现在没有第二个使用者的业务事实）；出现第一个就按上表建目录，不提前占位。

- store 的测试约定（重置 / 隔离；同行做法是全局 `__mocks__` 在每个用例前重置所有 store）。
