# 08 · 新会话与 Chatbox

- **状态**：可用（Mock），New Session、Session、Branch 视图与 Mock 通道已接通（2026-10-28）
- **范围**：New Session 纵向切片、Chatbox 共用组件、导航菜单与路由、Mock 网关接线与现有 Yao 认证透传
- **依据**：简版原型 `design/product/src/pages/new-session/` 与 `notes/chatbox.md`；现有 2.0 外壳与 `plan/07-layout.md`
- **相关计划**：用户信息与设置见 [`10-user-setting.md`](10-user-setting.md)

## 1. 目标

把「新会话」从占位页做成可独立验收的一条链路：

1. 打开 `/new`，看到推荐入口和 Chatbox。
2. 选择 Workspace、Computer、模型与设置。
3. 输入任务并创建 Session。
4. 进入最小可用的 Session 页，看到首条消息与 Chatbox。
5. Chatbox 成为后续 Inbox、Boards、Bots 复用的共用组件。

本期做 New Session、最小 Session 页、Apps 列表与 App 详情、Bots 列表，以及同一 Chatbox / MessageList 在 Browser 标签中的 Branch 视图壳；自动支线策略、分享、完整运行条与 Board 集成不在本期。

New Session 已包含 Apps/Bots 推荐卡片、App/Bot 使用上下文、Create App/Bot 上下文、合并的模型与思考强度选择、Vault、Computer 生命周期、工具审批与 `mod-enter` 提交；App 卡片打开独立 App 页面，Bot 卡片选中 Chatbox 的智能体。Session 页包含返回 New Session、Branches 徽标菜单、新建分支后自动打开 Browser 标签、Workspace/Computer 名称、会话设置保存与 Enter 提交。Apps 列表、App 详情、启动会话、Bots 列表、Branches 菜单、会话设置与 Branch 历史均走 Mock 接口。

## 2. 导航与布局

一级菜单按产品最新设计调整为七项，顺序固定：

| # | 名称 | 英文 | 图标 | 路径 | 本期 |
| --- | --- | --- | --- | --- | --- |
| 1 | 新会话 | New Session | `i-plus-square` | `/new` | 实现 |
| 2 | 应用 | Apps | `i-apps` | `/apps` | 实现 |
| 3 | 智能体 | Bots | `i-bot` | `/bots` | 实现 |
| 4 | 收件箱 | Inbox | `i-inbox` | `/inbox` | 保持现状 |
| 5 | 看板 | Boards | `i-board` | `/board` | 占位 |
| 6 | 工作空间 | Workspaces | `i-ws` | `/workspace` | 占位 |
| 7 | 电脑 | Computers | `i-pc` | `/computer` | 占位 |

- 主导航从当前六项改为七项，Bots 插在 Apps 与 Inbox 之间。
- 底部「工作空间 · 电脑」快捷图标保持现状，不删除。
- 路径本阶段沿用现有地址；新增 `/bots` 占位。复数化路径不在本计划内。
- 菜单文案四语齐：`shell.navigation.item.*` 增加 Bots，`new` 改为 New Session / 新会话。
- 导航测试同步七项、顺序、场景名与 Bots 快捷键行为。

## 3. 页面与流程

### 3.1 New Session 页面

```text
Content
  New Session
    Intro          标题、说明、可选推荐上下文
    Recommendation  Apps / Bots 推荐；选中后进入 Chatbox context
    Chatbox         共用组件；本页给 resources、attachments、settings 插槽
```

状态：

- 默认：空输入，推荐列表可见。
- 输入：有文字后发送键可用。
- 资源：Workspace 与 Computer 合并选择；不可用或加载失败时显示原因。
- 提交：创建中禁用并显示处理中；失败保留输入并显示错误。
- 选择推荐：显示 Chatting with / Create 上下文，可取消。

### 3.2 Session 页面

本期只做最小可验收页面：

- 头部：会话标题、返回 New Session、Workspace 与 Computer 摘要。
- 消息区：用户消息与 Assistant 消息；支持空态与加载态。
- Chatbox：复用同一组件，追加消息。
- 不在本期：Branch Browser、自动支线、完整运行条、分享、Memory、Vault 管理页。

### 3.3 路由

- `/new`：New Session。
- `/sessions/:id`：最小 Session 页面。
- `/sessions/:sessionId/branches/:branchId`：Branch 视图，作为内部路由打开在 Browser 标签。
- `/bots`：占位，供导航与后续模块接入。

## 4. 目录与组件拆分

```text
app/src/components/chatbox/
  chatbox.tsx          会话壳：context + MessageList + composer
  chatbox.less
  chatbox.test.tsx
  index.ts
  parts/
    composer/          输入、快捷键、发送、附件入口
    toolbar/           资源、模型、设置的插槽容器
    attachment/        附件 chip 与移除
  hooks/
    use-autosize.ts

app/src/components/message-list/
  message-list.tsx     历史、空态、加载、流式、加载更多
  message-list.less
  message-list.test.tsx
  index.ts
  parts/
    user-message.tsx
    assistant-message.tsx
    empty.tsx
    loading.tsx
  hooks/
    use-stick-to-bottom.ts

app/src/features/session/
  new-session.tsx
  session-view.tsx     主会话
  branch-view.tsx      支线会话，挂到 Browser 标签
  components/
    intro.tsx
    recommendations.tsx
    resource-picker.tsx
    session-head.tsx
  hooks/
    use-new-session.ts
    use-session.ts
    use-branch.ts
  locales/
    zh-CN.json
    zh-TW.json
    en-US.json
    ja.json
  tests/
    new-session.browser.ts
    chatbox.browser.ts
    message-list.browser.ts

app/src/data/session/
  types.ts
  session.ts         请求声明
  mock.ts
  stream.ts          流式事件适配
```

边界：

- `components/chatbox/` 是共用会话壳，组合 `MessageList` 与 composer，不请求接口、不读路由、不认识 Bot / Board / Session。
- `components/message-list/` 是独立的共用列表，负责历史消息、空态、加载、流式占位、时间分隔与加载更多；不请求接口。
- `Chatbox` 通过 `context`、`resources`、`attachments`、`overlay`、`footer` 插槽接收业务内容；`MessageList` 通过 `empty` 与消息数据接收业务内容。
- `resource-picker`、推荐列表、消息映射与会话传输留在 `features/session/`。
- 资源选择器先不提升为公共件；Inbox / Boards / Bots 出现第二个真实使用方后再判断。

### 4.1 容器与分支

同一套 Chatbox 与 MessageList 必须同时可用于内容区和 Browser 标签。

- `Chatbox` 增加 `surface: 'content' | 'browser'`，只影响密度、间距与最大宽度，不复制业务逻辑。
- `MessageList` 按容器高度滚动，不读视口高度；空态、历史、流式状态在两种容器中一致。
- Session 主视图在内容区；`/sessions/:sessionId/branches/:branchId` 作为内部路由打开在 Browser 标签。
- Browser 继续使用现有 `TabTarget` 的 `internal`，不新增 `branch` 类型。
- `components/browser` 增加 `renderInternal(path)` 插槽，由装配层映射到 Session 或 Branch 页面；Browser 不导入 feature。
- 主会话与支线各自持有 Ctrl、消息历史与滚动位置；Browser 标签关闭时关闭该支线 Ctrl，主会话不受影响。
- 支线继承主会话的 Workspace、Computer 与模型，不重复选择资源；支线自己的消息与 Turn 独立。
- 本期实现支线视图、从消息创建支线与通道；自动支线策略、创建策略配置与完整 Branch 管理后置。

## 5. Chatbox 与 MessageList 契约

```ts
type ChatboxProps = {
  messages: Message[]
  surface?: 'content' | 'browser'
  empty?: ReactNode
  loading?: boolean
  streaming?: boolean
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
  onRetry?: (messageId: string) => void
  context?: ReactNode
  resources?: ReactNode
  attachments?: ReactNode
  overlay?: ReactNode
  footer?: ReactNode
  composer: ChatboxComposerProps
}

type ChatboxComposerProps = {
  value: string
  onValueChange: (value: string) => void
  onSubmit: () => void
  placeholder: string
  canSend: boolean
  busy?: boolean
  disabled?: boolean
  submitKey?: 'enter' | 'mod-enter'
  listening?: ReactNode
  onFiles?: (files: File[]) => void
  onMic?: () => void
  onVoiceChat?: () => void
}

type MessageListProps = {
  messages: Message[]
  empty?: ReactNode
  loading?: boolean
  streaming?: boolean
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
  onRetry?: (messageId: string) => void
}
```

- `Chatbox` 只组合 `MessageList` 与 composer，不取历史、不建连接、不发送请求。
- `MessageList` 负责空态、历史、加载、流式占位、时间分隔、自动滚动与加载更多。
- 输入框自动增高，Enter / Mod+Enter 的行为由 `submitKey` 决定。
- 发送、附件、语音、Voice Chat 只在对应能力存在时显示。
- 聚焦时边框使用控件边界 token；禁用、处理中、录音三种状态分开表达。
- 所有按钮使用 `components/base/button`，不直接写原生控件。
- 文案由 feature 传入或走四语包；组件不硬编码业务名称。

## 6. 数据与契约

本页只依赖 MS1 已冻结的契约：

- 创建 Session：输入、资源、模型、可选设置；返回 Session ID。
- 发送消息：Session ID、文本、附件引用。
- 历史消息：Ctrl WS 使用 1.0 控制协议发送 `read`，返回 `read_complete`、消息、`has_more` 与分页游标。
- 通信：Ctrl WS 进入 Session 时建立、退出时关闭；Data WS 每个 Turn 独立开关；事件格式沿用现有 SSE。
- 全局事件：`/v1/events` 保持现有 SSE，不并入 Session 的 Data 通道。
- 资源与模型：Workspace、Computer；模型与默认角色读取 `/v1/llm/v2/models` 与 `/v1/llm/v2/roles`。
- Vault access：分组与单条密钥选择、indeterminate、Clear / Done 与会话授权保存；完整管理接口见 [`09-mock-data.md`](09-mock-data.md)。

本期 CUI 先接 Mock；契约与 Mock Server 见 [`09-mock-data.md`](09-mock-data.md)。真实接口联调时只替换 `data/session/`，页面与 Chatbox 不改结构。

## 7. 验收

- 七项导航顺序正确，四语完整，Bots 占位可达。
- `/new` 默认、输入、选择、提交、失败、空资源六种状态可见。
- Chatbox 键盘、焦点、禁用、处理中、附件 chip、录音状态可用。
- 创建成功后进入 `/sessions/:id`，首条用户消息与 Assistant 回复可见。
- Session 页 Chatbox 可继续发送；返回 `/new` 不丢当前草稿策略明确。
- 同一 Chatbox 与 MessageList 可分别挂内容区和 Browser 标签；Browser 不导入 feature。
- Branch 标签打开 `/sessions/:sessionId/branches/:branchId`，有独立历史与滚动；关闭标签关闭支线 Ctrl，主会话不受影响。
- CUI 开发代理经最小网关访问 Mock；未登录请求返回 401；现有 Yao 登录不被替换。
- 相关单元与浏览器用例通过；四语文案无缺失。

## 8. 未定项

1. MessageList 先只做文本、加载、空态与错误，工具卡片是否同时进入本期？本文建议先做文本与状态类消息。
2. `/new` 是否保留现有路径，还是同步原型改为 `/new-session`？本文建议保留 `/new`。
3. Session 页本期做最小收发与 Branch 视图壳，自动支线与运行条延后；Branch 创建/管理不在本期。
4. 新会话资源选择是否允许“未选 Workspace”直接发送？本文建议必须选择可用资源。
