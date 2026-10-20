# Session 详情页

> 状态：草案 · 2026-10-20

## 1. 页面结构

```text
Session（内容区）
  ├─ 内容列头（状态 · 标题 · Threads 徽标 · Workspace）
  ├─ 消息列表
  │    ├─ 用户消息
  │    ├─ Agent 消息
  │    ├─ Subagent run card
  │    ├─ Backend job card
  │    ├─ Daemon card
  │    └─ Receipt
  ├─ 运行条
  │    ├─ Agents
  │    ├─ Backend jobs
  │    ├─ Daemons
  │    ├─ Files
  │    └─ New thread
  ├─ Chatbox
  └─ Usage

Browser（第三栏）
  ├─ Thread 页
  └─ Workspace 文件
```

### 1.1 内容列头

- 与主界面内容列头同高，标题有独立区域。
- 返回新会话。
- 标题前是会话状态，用图标与颜色表达，不显示文字。
- 标题后是 `Threads (n)` 徽标，n 为支线 Thread 数。
- 右上角是当前 Workspace，点击在 Browser 打开工作区文件。
- 会话开始后 Workspace 固定，不提供切换入口。
- 会话不提供分享，也不放 Agent 身份信息。

### 1.2 Thread 切换

- Thread 切换不占独立行，收进标题后的徽标。
- 指针进入或键盘聚焦徽标时展开树形菜单：先显示会话标题，再以 `|—` 形式列出支线 Thread。
- 每项显示消息数；选择后不在主窗口切换，而是在 Browser 第三栏打开该 Thread。
- 主窗口始终显示主 Thread，不因为打开支线而变化。
- 运行条右侧的 `New thread` 新建支线，并同样在 Browser 打开；新 Thread 有自己的聊天页。
- Subagent 不作为标题切换项；它属于执行状态，在运行条的 `Agents` 中汇总，深层导航留给 Browser。

### 1.3 消息列表

- 占满内容区宽度，不切出第二栏。
- 用户消息靠右，Agent 消息靠左。
- Agent 的执行结果不把原始输出刷进主对话，使用卡片承载。
- 卡片按发生顺序插入，并保留回到原消息的锚点。
- 后台回执以一行系统消息呈现，不生成新的对话轮次。

### 1.4 Chatbox

- 固定在会话底部，不随消息列表滚动。
- 输入提示与文字从 Chatbox 顶部开始。
- 底部左侧是模型与思考强度合并选择与设置按钮；右侧是附件、语音输入与 Voice Chat。
- 输入文字后，语音输入与 Voice Chat 换成高亮的发送按钮；附件保留。
- 发送按钮与附件按钮同尺寸，图标用上箭头。
- 发送后在主 Thread 继续，滚动到最新消息。
- `New thread` 新建支线 Thread，并在 Browser 打开它自己的聊天页；主窗口不切换。
- Chatbox 不提供 Workspace 切换；Workspace 在会话开始前确定。
- Enter 发送，Shift + Enter 换行。

### 1.5 运行条

- 位于 Chatbox 上方，左侧是 `Agents`、`Backend jobs`、`Daemons`、`Files` 四个可展开入口，右侧是 `New thread`。
- `New thread` 属于 Thread 操作，放在 Chatbox 外部。
- 同一时间只展开一项，再点同一项收起；按 `Esc` 关闭。
- 展开内容出现在运行条上方，横向铺开，不改变聊天宽度。
- `Agents`：Session 与 Thread 层的 Subagent run，显示角色、层级、耗时与状态。
- `Backend jobs`：一次性命令、退出码、耗时与日志入口。
- `Daemons`：长期服务、地址、重启次数与状态。
- `Files`：本次会话新建或修改的文件、增删行数与状态。
- 窄屏允许换行，展开区单列排布。

### 1.6 Usage

- 位于 Chatbox 下方，不进入消息流。
- 第一组显示轮次、步数与吞吐，例如 `11 turns · 72 steps · 264 tok/s`。
- 第二组显示累计 token 与缓存命中率，例如 `3.5M tok · Cache hit 98%`。
- 第三组显示上下文占用，例如 `10% context`。
- 窄屏允许换行，三组保持可读。

### 1.7 Browser

- Browser 是第三栏，不属于 Content；打开 Thread 或 Workspace 时内容区不切换。
- 顶部显示 `Browser` 与关闭键；下方标签显示当前对象。
- Thread 标签显示标题与消息数；有自己的聊天页，原型只显示占位说明。
- Workspace 标签显示名称与 `Workspace`，正文列出工作区文件与目录。
- 窄屏时 Browser 以覆盖层打开，内容区保持原状态。

### 1.8 会话设置

- 设置按钮在 Chatbox 底部、模型与思考强度合并选择之后；点击在 Chatbox 上方展开 `高级设置` 面板，右对齐并收进视口。
- 面板包含 Computer 生命周期、Vault access 与工具审批。
- Vault access 打开二级视图，可按分组或单条密钥多选；搜索框过滤分组与密钥。
- 密钥值不显示在界面上；未选择时表示不访问 Vault。
- 面板底部显示已选数量，提供 Clear 与 Done；按 `Esc`、关闭键或点击面板外收起。
- 设置作用于当前会话，新建 Thread 继承当前会话的授权。

## 2. 层级

```text
Board
  └─ Session
       ├─ Thread
       │    └─ Message
       └─ Message
            ├─ SubagentRun
            ├─ BackendJob
            └─ Daemon
```

- Session 是目标与最终结论的归属。
- Thread 是用户可见的会话分叉，不嵌套。
- Message 是用户与 Agent 的对话单元。
- SubagentRun 是 Agent 内部派出的执行单元，可以提升为同级 Thread。
- BackendJob 是一次性命令，结束后回到所属消息。
- Daemon 是长期运行的服务，独立于单条消息持续存在。

## 3. 运行卡片

### 3.1 Agent run

- 标题：`Agent · <name>`。
- 状态：`queued`、`running`、`waiting`、`completed`、`failed`、`cancelled`。
- 显示职责、已用时间与摘要。
- `Open thread` 打开提升后的 Thread；未提升时显示 `Promote to thread`。
- 运行条的 `Agents` 汇总 Session 与 Thread 层的 run，显示角色、层级、耗时与状态。
- 等待用户输入时，问题直接进入所属 Thread，不只留在运行条。

### 3.2 Backend job

- 一次性命令或短任务，默认前台完成，长任务使用后台。
- 字段：`id`、`command`、`status`、`exit_code`、`duration_ms`、`output_tail`。
- 卡片显示命令、结果摘要、退出码与日志入口。
- 日志按需展开，不默认铺满消息列表。
- 结束后的回执显示为 `Job settled · <description> · exit <code>`。

### 3.3 Daemon

- 长期运行的服务，拥有 `daemon_id`、`daemon_port`、`daemon_url`、`daemon_restarts`。
- 端口未确认时状态为 `port_detecting`，确认后显示可访问地址。
- 卡片提供打开、重启与停止；运行条的 Daemons 保留汇总行。
- 服务地址就绪时，回执显示为 `Daemon · <description> · <url>`。

## 4. 状态聚合

- Session 状态由主对话与所有 SubagentRun 聚合。
- 有运行中的 Agent 时显示 `Running`；有等待输入时显示 `Waiting`。
- 主对话完成但后台 Agent 失败，Session 显示 `Ready` 并带警告，不整体判为失败。
- Daemon 长期运行不阻塞 Session 完成，但在 Runtime 中保持 `running`。
- Job 完成后不影响 Session 状态，只更新对应卡片与回执。

## 5. 视觉约束

- 内容列头固定为 40 像素，返回、状态、标题、Threads 徽标与 Workspace 都在这一行。
- 状态只画图标与颜色，放在标题前；Workspace 在右上角，会话开始后不切换。
- 设置按钮在 Chatbox 底部、合并选择之后；面板在 Chatbox 上方展开，宽 380 像素，窄屏收进视口，Vault 列表可滚动。
- 消息列表占满内容区宽度，不切出第二栏；Thread 切换不占独立行，也不改变主窗口内容。
- Thread 与 Workspace 在 Browser 第三栏打开；Browser 与 Content 分开，窄屏时覆盖。
- 运行条在 Chatbox 上方，左侧包含 `Agents`、`Backend jobs`、`Daemons`、`Files`，右侧是 `New thread`；同一时间只展开一项，展开内容横向铺开，不缩窄聊天区。
- Usage 在 Chatbox 下方，按轮次、token 与上下文三组排列。
- 运行卡片边框与状态色来自 token；完成用 success，运行用 brand，重启中用 warning。
- 卡片操作只用文字链接，不使用多层图标按钮。

## 6. 待定

- Job 日志的全屏查看与流式刷新。
- Daemon 停止后的回收与端口释放提示。
- Thread 的分享、模型覆盖与合并回主会话。
- Subagent 在 Browser 中的展示与切换；详情页不单独表达。
- File changes 的 diff 预览与逐文件回退。
- Subagent 提升为 Thread 时，运行卡片与 Thread 的摘要如何合并。
- 会话标题的重命名与自动摘要。
