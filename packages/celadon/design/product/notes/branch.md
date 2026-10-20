# Session Branches · 会话支线设计笔记

> 状态：草案 · 已在 Session 详情原型中使用
> 对象：Session Branch；界面：Branches /支线；主线：Main / 主线。
> 位置：属于 Session，不占一级导航，也不是 Board 卡片。

## 1. 层级

```text
Board
  └─ Session（主对话，守住目标）
       ├─ SubagentRun（Session 层执行）
       └─ 支线（分叉，追一个细节）
            └─ SubagentRun（支线层执行）
```

Board 聚合 Session；支线聚合某个子问题的消息与产出；SubagentRun 是 Agent 派出的执行单元。Session 与支线都可以直接拥有 SubagentRun。

## 2. 交互规则

- 从一条消息或一个任务节点拉出支线，自动继承该点之前的上下文。
- 主会话保留目标、进度与结论；支线只承载子问题的讨论、工具调用与产出。
- 支线有独立入口：标题后的 `支线 (n)` 徽标与消息深链，显示条数；点击后在 Browser 打开。
- 支线是一等对象：有 ID、深链、标题、摘要，可回到原消息。
- 回到主线时，把结论写回主会话；支线本身保留完整上下文。
- 支线数量与长度要有上限与折叠摘要，避免长会话不可发现、不可读。
- 支线的产出与证据挂在支线内，主会话只显示摘要和链接。

## 3. 与 Subagent 的关系

支线是用户可见的会话分叉；SubagentRun 是 Agent 在一次执行里派出的工作单元。两者不是同一层。

```text
Session
  ├─ SubagentRun          从主会话派出，结果回到主线
  └─ 支线              用户可见，有标题、摘要、深链
       └─ SubagentRun     从支线派出，结果回到支线
```

### 3.1 归属

- SubagentRun 必须属于 Session 或支线，不强制属于支线。
- Session 层执行服务主目标；支线层执行只服务该子问题。
- 一个支线可以没有 SubagentRun；一个 Session 也可以只跑主对话。
- 允许有限嵌套，但必须记录 `parent_run_id`。

### 3.2 数据

```text
SubagentRun
  id
  session_id
  branch_id          nullable；为空表示 Session 层
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
  promoted_branch_id nullable；提升为支线后回填
```

### 3.3 规则

- SubagentRun 默认无独立用户入口，不进入一级导航，也不单独出现在 Board 上。
- 主会话只显示 SubagentRun 的摘要与状态，原始过程收在证据里。
- SubagentRun 继承所属 Session 或支线的 Workspace、工具与权限，不能越权。
- SubagentRun 使用独立上下文，只拿到派发时给出的任务说明，不默认读取主会话全文。
- SubagentRun 需要用户回答时，问题回到所属 Session 或支线，不新建支线。
- 一个 Session 层 SubagentRun 需要长期独立讨论时，可以提升为支线，保留原 run ID 与证据。
- 所属 Session 或支线关闭时，默认取消其下未完成的 SubagentRun；后台继续运行需要显式标记并保留状态。
- 支线分享规则未定时，不提供单独分享 SubagentRun；启用分享时，证据随支线一起。

## 4. UI 表达

界面上统一叫 **Agent**，`SubagentRun` 只作为内部模型名。

### 4.1 会话流

- 在派发位置插入一张 **Agent run card**，不把 Subagent 的原始消息刷进主对话。
- 卡片一行显示：状态点、名称、职责、已用时间、摘要入口。
- 多个并行执行合并成一组，例如「3 个 Agent 正在工作」，展开后逐行显示。
- 卡片点击打开上下文面板，显示任务说明、工具调用、证据、摘要与停止/重试。
- 完成后卡片收起为一行摘要；失败时保持展开并标出原因；等待输入时，问题直接进入会话流，不只藏在面板里。

```text
┌ Agent · Researcher        ● running   02:14   [open] ┐
│ 正在核对 12 份竞品资料                                  │
└───────────────────────────────────────────────────────┘
```

### 4.2 内容列头与支线徽标

- 内容列头显示会话标题、`支线 (n)` 徽标与会话状态；n 为支线数。
- 徽标、支线帧与 Browser 支线页使用分支图标（`i-branch`），不使用分栏图标。
- 指针进入或键盘聚焦徽标时展开树形菜单，先显示会话标题，再以 `|—` 形式列出支线。
- 每项显示消息数；选择后不在主窗口切换，而是在 Browser 第三栏打开该支线。
- 主窗口始终显示主线；打开支线不改变内容区的对话。
- Chatbox 上方运行条右侧的 `New branch` 新建支线，并在 Browser 打开它自己的聊天页。
- Agent 与用户共用同一创建能力；Agent 创建支线时向 Session 写入一条支线帧，CUI 收到帧后自动在 Browser 打开该支线，主窗口不切换。
- 自动创建无需确认；是否开启、并发上限，以及自动支线的模型、Workspace 与权限覆盖策略，都在会话 Settings 中设置。
- 支线页的 Chatbox 与主线同构：底部左侧是模型与思考强度合并选择与设置，右侧是附件、语音输入与 Voice Chat，输入文字后换成发送。
- 自动支线默认继承 Session 的 Workspace、模型与档位、Vault 授权与工具审批；Settings 可允许覆盖。
- 支线完成后保留，不自动归档，也不单独发送通知；用户可随时从支线徽标或 Browser 呼出。
- 有等待输入或失败的 Agent 时，用状态色标出，不只显示数量。
- 支线内单独显示本支线的活跃数，不把父会话的计数混进来。
- Subagent 不占标题切换入口；它在运行条的 `Agents` 中汇总，深层导航留给 Browser。

### 4.3 Subagent 在详情页的表达

- Subagent 以流内 Agent run card 出现，卡片承载状态、摘要、耗时与回链。
- 运行条 `Agents` 汇总 Session 与支线层的 run，显示角色、层级、耗时与状态。
- 详情页不另设 Subagent 切换入口，也不在标题旁堆叠执行对象。
- 执行视图与支线列表分开，不把 Subagent 当成第二个聊天列表。

### 4.4 Board 与 Inbox

- Board 卡片只显示会话状态与活跃数，例如「2 running」，不列出每个 Agent。
- Inbox 只接收完成、失败、等待输入三类通知；点击深链回到对应 Agent run。
- Agent 不单独成为 Inbox 会话，也不单独成为 Board 卡片。

### 4.5 与支线的关系

- Session 层 Agent 的卡片在主会话流里；支线层 Agent 的卡片在支线内。
- 支线不嵌套；任何 Agent 提升为支线，都在所属 Session 下创建一个同级支线，并保留回链。
- 提升为支线后，原卡片改为「已提升为支线」并链接过去，不复制一份执行记录。
- 支线的入口显示自己的 Agent 数；Session 头的总数可以选择是否包含支线内的 Agent。

## 5. 状态与证据

- SubagentRun 有自己的状态：`queued`、`running`、`waiting`、`completed`、`failed`、`cancelled`。
- 支线不单独定义任务状态，状态仍属于 Session。
- Session 的运行状态要聚合主对话与所有 SubagentRun；主对话完成但后台 Agent 仍在跑时，显示 `running`；任一 Agent 等待输入时，显示 `waiting`。
- 主对话成功而某个 Agent 失败，Session 记为 `completed` 并带警告，不把整个会话判为失败；主对话失败才是 `failed`。
- 支线的结论要能回到证据：消息、运行记录、文件、预览或提交。
- 允许在支线内继续追问、重试、停止；结果影响 Session 的最终状态。

## 6. 暂不决定

- 支线是否支持跨会话分享。
- 支线是否支持合并回主会话，还是只回写摘要。
- Subagent 的嵌套层数与并行上限。
- Subagent 后台运行的保留时长与回收规则。
- Subagent 提升为支线时，原支线的摘要如何拆分。

以上等 Session 详情设计时再定。
