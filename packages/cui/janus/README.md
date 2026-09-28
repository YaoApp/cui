# janus — CUI **V2** 原型

> **janus**（雅努斯）：罗马神话的**双面神** —— 一面看人、一面看 Agent，
> 正好对应我们定的 **双面 App**（人面 + Agent 面）。**目录名是代号，本目录即 CUI 的 V2。**

- 目标：把 **BUILD 工作台**先跑起来（PC），用于讨论 UE 与交互细节。
- 现状：**原型**，数据全部走 **Mock**；真实接口缺口见 [`GAPS.md`](./GAPS.md)。
- 落点：`packages/cui/janus/`；页面入口 `pages/janus/index.tsx` → 路由 **`/janus`**。
- 复用（**不重造**）：
  - 消息标准：`@/openapi` 的 `MessageType` / `Message`（与 `chatbox/messages/*` 同一套契约）；
  - 流解析：`chatbox/utils/chunkProcessor.ts`（本原型先不接流，Mock 直接给完整消息）；
  - 代码/diff：仓库已有 `react-monaco-editor`、`components/view/DiffViewer` 等（本原型先用轻量自绘版，见 GAPS）。

## 结构

```
janus/
├── README.md          本文
├── GAPS.md            接口缺口清单（Mock 覆盖了什么 / 需要 Yao 工程师补什么）
├── index.ts           导出
├── mock.ts            Mock 数据 + Mock API（一处集中，便于替换成真实接口）
├── janus.less         V2 视觉（暗色 minimal，作用域 .jn-*）
├── Workbench.tsx      主界面：顶栏 + 左 Chat + 右 SidePanel
├── ChatPane.tsx       左：对话（吃消息标准）
├── Message.tsx        消息渲染（按 MessageType 分派）
├── SidePanel.tsx      右：Design / Dev / Deploy 模式切换
├── DualFace.tsx       双面表达（人面 / Agent 面）
└── Capability.tsx     Skill / MCP 能力查看与管理
```

## 起法

```bash
cd packages/cui && pnpm dev      # 或仓库根 pnpm dev
# 打开 http://localhost:8000/__yao_admin_root/janus
```

## 设计约束（与团队共识对齐）

- **组件库换不换都行**：本原型**不依赖 AntD**，自成一套 V2 样式（未来可平滑替换底座）。
- **不动老代码**：新增目录 + 一个页面路由 + `layouts/index.tsx` 注册一个 standalone 路由。
- **契约优先**：消息按 `MessageType` 标准渲染；缺失字段一律在 `GAPS.md` 记录，不擅自改后端契约。
