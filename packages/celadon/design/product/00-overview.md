# 00 · 概要设计

> 状态：草案 · 2026-10-19
> 本阶段只定义一级模块；模块功能与页面后续逐项展开。

## 1. 产品

> ✨ All your agents and workspaces in one place, on every device you own. Track tasks on a board, accessible from desktop, mobile, browser, or API. Self-hosted.

## 2. 模块列表

| # | 模块 | 英文 | 图标 | 定义 |
| --- | --- | --- | --- | --- |
| 01 | 新会话 | New Session | `i-plus-square` | 使用 Apps / Bots，或 Create App / Bot |
| 02 | 应用 | Apps | `i-apps` | 独立服务 + 可选 Bots；发布用 Manifest |
| 03 | 智能体 | Bots | `i-bot` | 固定形态的 App；共享后是一个 chat 入口 |
| 04 | 收件箱 | Inbox | `i-inbox` | 所有消息、会话与通知的集散地，人与 Bots 的桥梁 |
| 05 | 看板 | Boards | `i-board` | 一组相关会话的容器；Kanban 是其中一种视图 |
| 06 | 工作空间 | Workspaces | `i-ws` | 跨设备统一管理；可访问的 N 台电脑上的 N 个空间 |
| 07 | 电脑 | Computers | `i-pc` | 电脑池、个人节点与可用节点（已申请） |

图标来自 `app/src/platform/icons/` 的雪碧图；原型在挂载时把同一份 `sprite.svg` 注入页面，用 `<use href="#i-…">` 取图。

术语约定：模块名用「智能体」，对外说明用「数字员工」；「机器人」只指聊天机器人，不作为本模块名。

App 是一个无壳能力内核加两套寻址面：人面与 Agent 面。发布时绑定 Workspace 与 Computer，只暴露指定的 App 域，后端用文件系统隔离。Bot 是固定形态的 App，没有独立人面，共享出去是一个 chat 入口。分享入口通过 Tao 提供 HTTPS、hash 子域、`yao.run` 短链与自定义域名，可用 Ding 或 OTP 收口。Workspace 只有自己可见与团队可见两档，不提供分享；单文件可复制到临时分享池，到期清理。

全局能力：搜索、通知、账户、设置、主题与语言。共享与隔离是跨模块能力，规则见 [`notes/sharing.md`](notes/sharing.md)。

Vault 与 Workspace、Computer 同级，是保护密钥、令牌与凭据的跨模块能力，入口放在 Settings 的二级。一个所有者一个 Vault，个人与团队各一个；会话按分组或单条密钥显式多选授权，不自动使用整个 Vault，规则见 [`notes/vault.md`](notes/vault.md)。

电脑的池、申请与个人节点绑定见 [`notes/computers.md`](notes/computers.md)。

Workspace 与 Computer 的归属、Private / Team 作用域与读写角色见 [`notes/workspace.md`](notes/workspace.md)。

## 3. 新会话

新会话有两个行为：

- 使用：选择一个已有 Bot，直接进入会话；或打开一个 App 的独立界面。
- 创建：Create App 或 Create Bot，在会话中从模板或空白开始构建。

新会话是独立页面 `/new-session`。页面分两个章节：

- **Chatbox**：意图输入、语音输入、Workspace、附件、模型与思考强度合并选择、高级设置。新会话的 Workspace 选择在底部左侧，其后是合并选择与设置；Workspace 决定 Computer，两者合并在一个按电脑分组的选择器里。合并选择的每个选项同时带模型与档位，选中即同时改变两者。右侧空输入时是附件、语音输入与 Voice Chat，输入文字后换成发送。高级设置预留 Computer 生命周期、Vault 授权与工具审批。规则见 [`notes/chatbox.md`](notes/chatbox.md)。
- **推荐**：Apps 与 Bots 列表立即出现在首屏。点击 App 打开独立 App 界面；点击 Bot 选中 chat 入口。

Apps 模块有列表 `/apps` 与详情 `/apps/:id`。从新会话进入详情时带 `from=new-session`，返回按钮回到新会话；从 Apps 列表进入则回到列表。

Apps 列表可以挂载官方外部 App、第三方外部 App 与 Builder 内部 App。App 用 Manifest 声明端口、域名、可调用 Bots、对外 Skills 与可见范围；平台不要求 App 运行在 Yao 上。规则见 [`notes/service.md`](notes/service.md)。

从 Chatbox 发送后进入会话详情 `/sessions/:id`。详情页包含内容列头、占满内容区的消息列表、固定 Chatbox，以及 Chatbox 上方的 Agents / Backend jobs / Daemons / Files 运行条、下方的 Usage；标题前用图标与颜色表示会话状态，标题后有 `Branches (n)` 徽标，hover 树形列出支线，点击在 Browser 第三栏打开，主窗口不切换；Workspace 点击在 Browser 打开工作区文件，主线开始后不能切换；手动创建支线从每轮最后一条 Assistant 消息的 Branch 动作发起并在 Browser 打开；Agent 自动创建支线时，在该轮 Agent 回复内显示支线卡片，CUI 同时自动在 Browser 打开；自动创建开关、并发上限与自动支线的模型/Workspace/权限策略在会话 Settings 中设置，Chatbox 底部左侧是模型与思考强度合并选择与设置按钮，右侧是附件、语音输入与 Voice Chat，输入文字后换成发送按钮。消息列表承载 Agent run、Backend job、Daemon、Agent 回复内的支线卡片与回执。结构见 [`notes/session-detail.md`](notes/session-detail.md)，Session Branches 规则见 [`notes/branch.md`](notes/branch.md)。

## 4. Boards

Board 是逻辑容器，收纳一组相关会话。Kanban 是 Board 的默认视图，同一批会话还可以列表、时间线或摘要呈现。

现有 API 已经使用 Board 对象：

- 列表与增删改：`GET/POST /v1/agent/boards`，`GET/PUT/DELETE /v1/agent/boards/:board_id`。
- 模板：`GET /v1/agent/boards/templates`，`POST /v1/agent/boards/from-template`。
- 看板内容：`GET /v1/agent/boards/:board_id/tasks`。
- 列：`POST/PUT/DELETE /v1/agent/boards/:board_id/columns...`，支持排序与折叠。
- 任务：`GET/POST /v1/agent/tasks`，`PUT /v1/agent/tasks/:chat_id/move`。

Board 的列是工作域，例如运营、产品、调研、售前，不是运行状态。每张卡片是 `task`，带 `chat_id`，对应一次会话；运行状态由 `run_status` 单独表示，取值为 `pending`、`queued`、`running`、`completed`、`failed`、`stopped`、`cancelled`。这套“列是领域、状态由会话推导”的结构就是 Board 的特色。

## 5. Session Branches（后续）

Session Branch 放在 Session 详情里展开，不占一级导航。机制记录见 [`notes/branch.md`](notes/branch.md)。

## 6. 后续模块

Factory：黑灯工厂式的多 Agent 自动化编排。本期不做，不进入一级导航。
