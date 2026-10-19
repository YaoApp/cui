# Thread · Session 详情设计笔记

> 状态：后续 · 做 Session 详情时展开
> 位置：属于 Session，不占一级导航，也不是 Board 卡片。

## 1. 层级

```text
Board
  └─ Session（主对话，守住目标）
       ├─ SubagentRun（Session 层执行）
       └─ Thread（分叉，追一个细节）
            └─ SubagentRun（Thread 层执行）
```

Board 聚合 Session；Thread 聚合某个子问题的消息与产出；SubagentRun 是 Agent 派出的执行单元。Session 与 Thread 都可以直接拥有 SubagentRun。

## 2. 交互规则

- 从一条消息或一个任务节点拉出 Thread，自动继承该点之前的上下文。
- 主会话保留目标、进度与结论；Thread 只承载子问题的讨论、工具调用与产出。
- Thread 有独立入口：会话侧栏或消息下方的入口，显示条数与未读状态。
- Thread 是一等对象：有 ID、深链、标题、摘要，可分享、可回到原消息。
- 回到主线时，把结论写回主会话；Thread 本身保留完整上下文。
- Thread 数量与长度要有上限与折叠摘要，避免长会话不可发现、不可读。
- Thread 的产出与证据挂在 Thread 内，主会话只显示摘要和链接。

## 3. 与 Subagent 的关系

Thread 是用户可见的会话分叉；SubagentRun 是 Agent 在一次执行里派出的工作单元。两者不是同一层。

```text
Session
  ├─ SubagentRun          从主会话派出，结果回到主流
  └─ Thread               用户可见，有标题、摘要、深链
       └─ SubagentRun     从 Thread 派出，结果回到 Thread
```

### 3.1 归属

- SubagentRun 必须属于 Session 或 Thread，不强制属于 Thread。
- Session 层执行服务主目标；Thread 层执行只服务该子问题。
- 一个 Thread 可以没有 SubagentRun；一个 Session 也可以只跑主对话。
- 允许有限嵌套，但必须记录 `parent_run_id`。

### 3.2 数据

```text
SubagentRun
  id
  session_id
  thread_id          nullable；为空表示 Session 层
  parent_run_id      nullable；嵌套时指向上层 run
  anchor_message_id  派发位置，用于流内卡片定位
  agent_id
  label
  role
  status
  started_at
  ended_at
  summary
  evidence[]
  promoted_thread_id nullable；提升为 Thread 后回填
```

### 3.3 规则

- SubagentRun 默认无独立用户入口，不进入一级导航，也不单独出现在 Board 上。
- 主会话只显示 SubagentRun 的摘要与状态，原始过程收在证据里。
- SubagentRun 继承所属 Session 或 Thread 的 Workspace、工具与权限，不能越权。
- SubagentRun 使用独立上下文，只拿到派发时给出的任务说明，不默认读取主会话全文。
- SubagentRun 需要用户回答时，问题回到所属 Session 或 Thread，不新建 Thread。
- 一个 Session 层 SubagentRun 需要长期独立讨论时，可以提升为 Thread，保留原 run ID 与证据。
- 所属 Session 或 Thread 关闭时，默认取消其下未完成的 SubagentRun；后台继续运行需要显式标记并保留状态。
- 分享 Thread 时连带其 SubagentRun 的证据；不支持单独分享一个 SubagentRun。

## 4. UI 表达

界面上统一叫 **Agent**，`SubagentRun` 只作为内部模型名。

### 4.1 会话流

- 在派发位置插入一张 **Agent run card**，不把 Subagent 的原始消息刷进主对话。
- 卡片一行显示：状态点、名称、职责、已用时间、摘要入口。
- 多个并行执行合并成一组，例如「3 个 Agent 正在工作」，展开后逐行显示。
- 卡片点击打开右侧详情，显示任务说明、工具调用、证据、摘要与停止/重试。
- 完成后卡片收起为一行摘要；失败时保持展开并标出原因；等待输入时，问题直接进入会话流，不只藏在面板里。

```text
┌ Agent · Researcher        ● running   02:14   [open] ┐
│ 正在核对 12 份竞品资料                                  │
└───────────────────────────────────────────────────────┘
```

### 4.2 会话头

- 显示 `2 running` 作为入口，数字是本会话当前活跃的 Agent run 数；没有活跃运行时显示 `Agents` 入口，不显示过期数字。
- 有等待输入或失败的 Agent 时，用状态色标出，不只显示数量。
- Thread 内单独显示本 Thread 的活跃数，不把父会话的计数混进来。

### 4.3 右侧活动面板

- 分 `Active` 与 `Recent` 两组，按状态与时间排序。
- 每行：名称、职责、状态、所属 Thread、耗时、摘要。
- 支持停止、重试、查看证据、提升为 Thread。
- 面板是执行视图，不是第二个聊天列表；不在面板里展开完整对话。

### 4.4 Board 与 Inbox

- Board 卡片只显示会话状态与活跃数，例如「2 running」，不列出每个 Agent。
- Inbox 只接收完成、失败、等待输入三类通知；点击深链回到对应 Agent run。
- Agent 不单独成为 Inbox 会话，也不单独成为 Board 卡片。

### 4.5 与 Thread 的关系

- Session 层 Agent 的卡片在主会话流里；Thread 层 Agent 的卡片在 Thread 内。
- Thread 不嵌套；任何 Agent 提升为 Thread，都在所属 Session 下创建一个同级 Thread，并保留回链。
- 提升为 Thread 后，原卡片改为「已提升为 Thread」并链接过去，不复制一份执行记录。
- Thread 的入口显示自己的 Agent 数；Session 头的总数可以选择是否包含 Thread 内的 Agent。

## 5. 状态与证据

- SubagentRun 有自己的状态：`queued`、`running`、`waiting`、`completed`、`failed`、`cancelled`。
- Thread 不单独定义任务状态，状态仍属于 Session。
- Session 的运行状态要聚合主对话与所有 SubagentRun；主对话完成但后台 Agent 仍在跑时，显示 `running`；任一 Agent 等待输入时，显示 `waiting`。
- 主对话成功而某个 Agent 失败，Session 记为 `completed` 并带警告，不把整个会话判为失败；主对话失败才是 `failed`。
- Thread 的结论要能回到证据：消息、运行记录、文件、预览或提交。
- 允许在 Thread 内继续追问、重试、停止；结果影响 Session 的最终状态。

## 6. 暂不决定

- Thread 是否支持跨会话分享。
- Thread 是否单独选择模型或档位。
- Thread 是否支持合并回主会话，还是只回写摘要。
- Thread 的权限是否跟随 Session，还是可以单独授权。
- Subagent 的嵌套层数与并行上限。
- Subagent 后台运行的保留时长与回收规则。
- Subagent 提升为 Thread 时，原 Thread 的摘要如何拆分。

以上等 Session 详情设计时再定。
