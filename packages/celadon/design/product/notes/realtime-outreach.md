# 实时联络架构

> 状态：架构方案 · 2026-10-22
> 范围：文本会话、语音与视频通话、Agent 主动联络、Runner 接口与客户端接口。

## 1. 目标

一个 Session 同时支持：

- 文本对话与运行中控制；
- 语音通话与视频通话；
- Agent 主动发起文本、语音或视频联络；
- 多端在线、离线推送与断线恢复。

核心约束：

- 通话中的取消、审批与音频不能被文本或视频阻塞；
- 运行中可以排队、引导、打断和停止；
- 视频不能拖累音频；
- 客户端只负责展示与提交意图，业务状态由后端持有；
- 新增语音或视频 Provider 不增加前端分支。

## 2. 组件

| 组件 | 责任 |
| --- | --- |
| SessionRunner | 执行 Session，处理文本输入、引导、打断、工具与审批 |
| SessionTransport | Session 的实时通信层，处理媒体、DataChannel、Provider 与连接 |
| SessionOutreach | 主动联络，处理邀请、振铃、过期、拒绝与设备仲裁 |
| EventHub | 全局事件、事件游标、断线重连与推送触发 |
| SessionClient | 前端实时通信客户端 |
| OutreachClient | 前端主动联络客户端 |
| CallInvite | 语音或视频呼叫邀请 |
| CallSession | 接受后的语音或视频会话 |
| CallProvider | OpenAI Realtime、本地语音、SIP 等媒体 Provider |

边界：

- SessionTransport 不是通用 API Gateway，不处理 Session 增删改查、Inbox 与 Outreach 状态。
- SessionRunner 不处理媒体连接。
- SessionOutreach 不建立媒体，只决定是否发起联络、向谁发起、哪台设备接受。
- Call 只表示语音或视频通话，不表示整个 Session 通信层。

## 3. 总体架构

```text
┌──────────────────────────────────────────────────────────────┐
│ Client                                                       │
│  SessionClient · OutreachClient · EventStream · Inbox · CallUI│
└───────────────┬──────────────────────────────┬───────────────┘
                │ WebRTC media                 │ /v1/events + Push
                │ DataChannel control/text     │
┌───────────────▼──────────────────────────────▼───────────────┐
│ Backend                                                      │
│  SessionTransport    SessionOutreach        EventHub         │
│  ├ OpenAI adapter    ├ invite / ring        ├ outreach.*     │
│  ├ Local adapter     ├ expiry / decline     ├ call.*         │
│  └ SIP adapter       └ device arbitration   └ mail.*         │
│                                                              │
│  SessionRunner                                               │
│  ├ queue / steer / cancel                                    │
│  └ tools / approvals / transcript                            │
│                                                              │
│  Session Store · Outreach Store · Device / Push Registry     │
└──────────────────────────────────────────────────────────────┘
```

## 4. 传输

### 4.1 流量类型

| 流量 | 内容 | 传输 | 规则 |
| --- | --- | --- | --- |
| control | cancel、approval、answer、ping | DataChannel | 高优先级、可靠、小帧 |
| text | 消息、工具、状态、转写 | DataChannel | 可靠、可恢复、可合并 |
| audio | PCM 上下行 | WebRTC media | 低延迟、可丢帧、不重传 |
| video | 摄像头、屏幕共享、关键帧 | WebRTC media | 可丢帧、独立于音频 |

四类流量按场景创建，不是四条固定连接。

### 4.2 连接

| 场景 | 连接 |
| --- | --- |
| 纯文本 | EventHub WebSocket + Session WebSocket，无 PeerConnection |
| 语音通话 | PeerConnection：audio track + control DataChannel + text DataChannel |
| 视频通话 | 语音连接增加 video track |
| 主动联络 | EventHub 与推送负责叫醒，接受后建立语音或视频连接 |

### 4.3 并发与恢复

- control 独立队列，不等待 text、audio、video；
- 下行拥塞时先丢 video，再丢旧 audio，不丢 control；
- 每个流量独立编号，客户端不要求跨流量顺序；
- Session 使用 `sessionEpoch`，重连带 `lastSeq`；
- 上行队列满返回 `inputFull`，不阻塞读循环；
- 客户端断线不取消 Agent 工作，除非用户显式停止；
- 已产生的外部副作用不自动回滚。

## 5. Stream

### 5.1 状态

| 状态 | 含义 | 允许的动作 |
| --- | --- | --- |
| `idle` | 没有进行中的 Turn | `submit`、`close` |
| `running` | Turn 正在执行 | `submit`、`cancel`、`replace`、`close` |
| `waiting(approval)` | 工具执行等待审批 | `submit(next_turn)`、`resolve`、`cancel`、`replace` |
| `waiting(question)` | 等待用户回答 | `submit(next_turn)`、`resolve`、`cancel`、`replace` |
| `cancelling` | 正在取消 | `close` |
| `closed` | Session 已结束 | 无 |

`waiting` 是产品状态投影。运行时可以只有 `idle` 与 `running`，等待审批或回答时 Turn 仍然打开。

### 5.2 动作

| 动作 | 语义 | 结果 |
| --- | --- | --- |
| `submit` | 提交一条消息到当前 Session 的输入队列 | 按 `placement` 进入当前 Turn 或下一 Turn |
| `cancel` | 终止当前 Turn | 保留部分输出，进入 `cancelling`，最终 `idle` |
| `replace` | 终止当前 Turn 并提交新消息 | 当前 Turn 取消，新消息开启下一 Turn |
| `resolve` | 解决一个 pending request | 从 `waiting` 回到 `running` 或结束 |
| `close` | 结束 Session | 终止活动，进入 `closed` |

`submit` 只进入 Session 的 Turn 输入，不经过 Inbox。Inbox 是文本联络与未读通知的模块，不参与 Turn 调度。

动作统一封装：

```text
Action {
  actionId
  sessionId
  type: 'submit' | 'cancel' | 'replace' | 'resolve' | 'close'
  expectedEpoch
  payload
}
```

服务端返回：

```text
action.accepted { actionId, controlSeq, state }
action.rejected { actionId, code }
```

`actionId` 幂等。相同 `actionId` 重试只生效一次。

#### submit

```text
submit {
  message
  placement: 'next_turn' | 'next_step'
}
```

- `idle`：创建新 Turn；
- `running + next_turn`：当前 Turn 继续，消息进入下一 Turn；
- `running + next_step`：当前 Turn 继续，消息在最近 Step 边界进入；
- `waiting + next_turn`：当前 Turn 继续，消息进入下一 Turn；
- `next_step` 不允许在 `waiting` 时提交。

#### cancel

```text
cancel {
  reason?: string
}
```

- 只对 `running` 或 `waiting` 有效；
- 停止新 token，取消或标记当前工具；
- 持久化部分输出，Turn 结束为 `cancelled`；
- 不提交新消息；
- 已经排队的消息保留。

#### replace

```text
replace {
  message
}
```

- 对 `running` 或 `waiting` 有效；
- 结束当前 Turn，保留部分输出；
- 新消息进入下一 Turn；
- 协议上是一个动作，服务端可以内部拆成 cancel 与 submit。

#### resolve

```text
resolve {
  requestId
  resolution:
    | { kind: 'approval', outcome: 'allow_once' | 'deny' | 'cancel' }
    | { kind: 'question', answers: Answer[] }
}
```

- 只对 `waiting` 有效；
- 第一个有效结果生效，后续结果返回 `already_resolved`；
- approval 的 `allow_once` 只允许当前工具调用，不存在 `allow_always`；
- question 的阻塞回答在同一 Turn 返回；
- question 的有限时等待可以返回 `pending`，迟到回答进入下一 Turn。

#### close

- 终止正在执行的 Turn；
- 取消 pending request；
- 进入 `closed`，不再接受动作。

### 5.3 状态转换

```text
idle
  └─ submit ──▶ running

running
  ├─ submit(next_turn) ──▶ running(queued)
  ├─ submit(next_step) ──▶ running(steering)
  ├─ cancel ────────────▶ cancelling ──▶ idle
  ├─ replace ───────────▶ cancelling ──▶ running
  └─ request ───────────▶ waiting

waiting(approval|question)
  ├─ resolve ───────────▶ running
  ├─ cancel ────────────▶ cancelling ──▶ idle
  ├─ replace ───────────▶ cancelling ──▶ running
  └─ submit(next_turn) ─▶ waiting(queued)

cancelling
  └─ turn.end(cancelled) ─▶ idle
```

### 5.4 暂停请求

审批与提问都是 pending request，不产生新 Turn：

| 类型 | 触发 | 解决 |
| --- | --- | --- |
| approval | 工具执行前 | `resolve` 返回 `allow_once`、`deny` 或 `cancel` |
| question | Agent 需要用户回答 | `resolve` 返回 answer；有限时等待可先返回 `pending` |

审批期间工具停在执行前，Turn 保持打开。提问期间 Agent 可以继续独立工作，只有阻塞提问会占住当前 Turn。

审批不存在 `allow_always`，也不存在 Session 级工具授权存储。

### 5.5 场景映射

| 场景 | 协议动作 |
| --- | --- |
| Queue | `submit(placement: 'next_turn')` |
| Steer | `submit(placement: 'next_step')` |
| Cancel | `cancel` |
| Cancel & Send | `replace` |
| Approve tool | `resolve(approval, allow_once)` |
| Deny tool | `resolve(approval, deny)` |
| Answer question | `resolve(question, answers)` |

场景名只属于 UI，不进入协议动作名。

### 5.6 安全点

`submit(next_step)` 只在 Step 边界进入，不插入模型流式生成、工具执行中或等待审批的中间状态。

`cancel` 与 `replace` 必须停止新 token、取消或标记当前工具、持久化部分输出、写入 `turn.end(cancelled)`，并保留已经排队的消息。

### 5.7 多客户端

一个 Session 对 N 个客户端开放控制，不设 control lease，不把其他客户端降为只读。

- 任意已认证客户端都可以提交动作；
- 服务端为每个 Session 维护 control FIFO，按到达顺序分配 `controlSeq`；
- 服务端接受动作后广播 `action.applied`，所有客户端按同一顺序更新；
- 客户端本地先显示 pending，收到 `action.applied` 后以服务端状态为准；
- 被拒绝的动作回滚本地状态，并显示原因；
- 所有动作带 `actionId`，服务端幂等去重；
- `cancel` 以第一条到达的取消为准，后续 `cancel` 返回 no-op；
- `resolve` 以第一条有效结果为准，后续返回 `already_resolved`；
- `submit` 按 `controlSeq` 顺序生效，所有客户端看到相同的 pending 列表；
- `sessionEpoch` 只表示连接代次，不表示控制权；
- 设备只作为 `deviceId` 记录在动作上，用于审计，不用于冻结控制。

## 6. Call

### 6.1 范围

Call 包含语音通话与视频通话。语音是主链路，视频是可选视觉输入。Agent 输出语音与文字，不生成实时人物视频。

### 6.2 SessionTransport

前端只对接 SessionTransport，Provider 由后端选择：

| Provider | 能力 | 用途 |
| --- | --- | --- |
| `openai-realtime` | 原生语音、VAD、打断、图像关键帧、工具调用 | 低延迟语音与视频 |
| `local-voice` | 组合 STT、Agent、TTS 或插件实时音频 | 本地或私有部署 |
| `sip` | 电话信令与媒体 | PSTN |

Provider 接口：

```go
type CallProvider interface {
    Open(ctx context.Context, spec *CallSpec) (CallSession, error)
}

type CallSession interface {
    SendAudio(frame AudioFrame) error
    SendVideo(frame VideoFrame) error
    SendText(text string, delivery Delivery) error
    Events() <-chan CallEvent
    Close(ctx context.Context) error
}
```

### 6.3 媒体

- SessionTransport 与 OpenAI 使用服务端 WebSocket，浏览器不持有 Provider 密钥；
- 音频输入输出使用 PCM16、24 kHz、单声道；
- 默认使用服务端 VAD，也支持关闭 VAD 后的按住说话；
- 打断时发送 `response.cancel` 与 `conversation.item.truncate`；
- 视频以关键帧 `input_image` 附加，不发送连续视频轨道；
- Bot 与 App 会话默认使用 Relay，保持模型、工具与 Session 一致；
- 独立快速通话可以使用 Native。

### 6.4 视频

- 摄像头与麦克风分别授权，打开视频必须显式操作；
- 默认 1 至 2 帧每秒，最高 1280 × 720；
- 画面变化、语音结束或用户要求时追加关键帧；
- 屏幕共享优先保证文字可读，必要时局部裁剪或 OCR；
- 视频不可用时自动降级为语音；
- 默认不保存原始视频，关键帧保留需显式开启。

### 6.5 抢话

1. 本地 VAD 检测用户开口；
2. 立即停止播放并清空缓冲；
3. 发送 `call.interrupt`；
4. 发送 `response.cancel`；
5. 按已播放位置发送 `conversation.item.truncate`；
6. 新语音作为下一轮输入。

本地先停音频，不等服务端确认。

### 6.6 延迟目标

| 阶段 | 目标 |
| --- | --- |
| VAD 检出 | 100 至 200 毫秒 |
| 首个转写 | 300 毫秒以内 |
| 首个音频 | 800 毫秒以内 |
| 首个视频关键帧 | 1 秒以内 |
| 抢话停止音频 | 100 毫秒以内 |

## 7. Outreach

### 7.1 形态

| 形态 | 服务端行为 | 客户端行为 |
| --- | --- | --- |
| 文本 | 写入 Inbox，发 `outreach.message` | 未读、通知、打开 Session |
| 语音呼叫 | 创建 CallInvite，进入 ringing | 来电界面，接受或拒绝 |
| 视频呼叫 | 创建 CallInvite，进入 ringing | 来电界面，接受后请求摄像头 |

主动联络不要求客户端在线。Server 持有 Session 与 Outreach，客户端上线后通过事件、推送或启动刷新补齐。

### 7.2 对象

```text
Outreach {
  outreachId
  sessionId
  agentId
  kind: 'message' | 'voice' | 'video'
  reason
  priority: 'normal' | 'urgent'
  createdAt
  expiresAt
  devices[]
}
```

`outreachId` 是幂等键。`reason` 必须展示给用户。

### 7.3 状态

```text
created
  ├─ message ──▶ delivered
  └─ voice/video
       ├─ ringing ──▶ accepted ──▶ active ──▶ ended
       ├─ declined
       ├─ expired
       └─ canceled
```

- 振铃 30 至 60 秒；
- 拒绝后不重复振铃；
- 过期后只能重新发起；
- 接受后建立 SessionTransport，再申请麦克风或摄像头；
- 客户端只提交接受、拒绝或取消意图；
- 振铃计时、设备仲裁、超时与媒体凭证由后端决定。

### 7.4 事件

```text
outreach.message
call.invited
call.accepted
call.declined
call.expired
call.canceled
```

事件载荷：

```text
{
  outreachId,
  callId?,
  sessionId,
  agentId,
  kind,
  reason,
  expiresAt,
  deviceId?
}
```

SDP、媒体 token、音频与视频不进入全局事件。

### 7.5 投递

1. 在线客户端通过 `/v1/events` 收到事件；
2. 后台或离线客户端收到系统推送；
3. 客户端启动或重连时拉取 pending outreach；
4. 重复事件不产生第二次振铃；
5. EventHub 增加 `outreach.*` 与 `call.*` 的接收者过滤；
6. SessionClient 与 OutreachClient 增加对应事件处理。

### 7.6 推送

| 平台 | 通道 |
| --- | --- |
| Web | Web Push / Service Worker |
| Android | FCM |
| iOS | APNs |
| 桌面 | 系统通知 |

推送只负责叫醒客户端，不承载媒体。载荷包含 `outreachId`、`callId`、`kind`、`agentId`、`reason`、`expiresAt`。

推送权限与麦克风、摄像头权限分开申请。

### 7.7 多端

- 向所有允许呼叫的在线设备发送 `call.invited`；
- 第一台接受的设备建立媒体；其他设备停止振铃，但继续同步通话状态并可以提交控制；
- 其他设备收到 `call.canceled` 并停止振铃；
- 接受设备断线时允许短时间内由另一台设备接管；
- 不接受多台设备同时建立媒体再合并。

### 7.8 节制

- 用户分别允许文本、语音、视频联络；
- 设置安静时段、每日上限与连续未接冷却；
- 普通联络不打断进行中的通话；
- 紧急联络才允许强提醒；
- Bot 或 App 只能联络其授权用户；
- 用户可关闭某一类或全部主动联络；
- 记录发起者、原因、设备、接受或拒绝、通话时长。

### 7.9 客户端

- 来电浮层：Agent 名称、头像、语音或视频标识、原因、接受、拒绝；
- 文本联络：Inbox 未读、导航角标、系统通知；
- 未接来电：Inbox 卡片、回拨；
- 多端同步：一台接受后其他端立即消失；
- 权限不足：显示缺少麦克风、摄像头或推送权限；
- 勿扰模式只显示 Inbox，不响铃；
- 通话结束保留文字记录与摘要，默认不保存原始音视频。

### 7.10 接口

```text
POST /v1/outreach                 创建文本、语音或视频联络
GET  /v1/outreach?status=pending  启动或重连时补齐
POST /v1/outreach/:id/accept      接受并换取媒体凭证
POST /v1/outreach/:id/decline     拒绝
POST /v1/outreach/:id/cancel      取消
```

联络接口只处理邀请与状态，不传输媒体。接受后由 SessionTransport 建立媒体。

## 8. SessionRunner

### 8.1 接口

```go
type SessionRunner interface {
    Open(ctx context.Context, spec *SessionSpec) (RunnerSession, error)
}

type RunnerSession interface {
    Send(frame InputFrame) error
    Events() <-chan Event
    Close(ctx context.Context) error
}
```

- `Open` 启动运行时并返回能力表；
- `Send` 只负责接纳，不等待 Turn 完成；
- `Events` 负责下行；
- `Close` 负责半关闭与清理；
- 现有一次性 `Stream` 保留，内部可以调用 `Open` 并消费到空闲。

### 8.2 能力

```text
capabilities: {
  submit: boolean
  placements: ('next_turn' | 'next_step')[]
  cancel: boolean
  replace: boolean
  resolve: boolean
  audio: boolean
  video: boolean
  resume: boolean
}
```

| 缺失 | 降级 |
| --- | --- |
| `next_step` | 只提供 `next_turn` |
| cancel | 不提供取消动作 |
| replace | 不提供替换动作，只能先 cancel 再 submit |
| resolve | 不发起需要人工解决的 pending request |
| audio | 只提供文本 |
| video | 只提供语音 |
| resume | 重开通道，不承诺无缝续传 |

### 8.3 Adapter

Runner adapter 把协议动作映射为运行时自身的调用：

- `submit`、`cancel`、`replace`、`resolve` 由适配器实现；
- `resolve` 分为 approval 与 question 两种 resolution；
- 适配器必须返回能力表，未实现的能力置为 `false`；
- 适配器不得改变动作语义，只做协议到运行时的翻译；
- 具体运行时的映射细节放在内部实现文档，不进入产品协议。

## 9. 客户端

### 9.1 SessionClient

```text
session.open({ sessionId, provider?, voice?, turnDetection? })
session.audio.append({ pcm, seq })
session.audio.commit()
session.video.start({ source: 'camera' | 'screen', quality? })
session.video.stop()
session.submit({ message, placement: 'next_turn' | 'next_step' })
session.cancel()
session.replace({ message })
session.resolve({ requestId, resolution })
session.close()

session.events:
  session.action.applied   # actionId, controlSeq, state
  session.state
  session.transcript.delta
  session.transcript.done
  session.audio.delta
  session.audio.clear
  session.video.state
  session.vision.snapshot
  session.vision.result
  session.turn.cancelled    # partial output retained
  session.request           # kind: approval | question
  session.tool.request
  session.error
```

SessionClient 内部替换传输层。生产使用 WebRTC：音频与视频走媒体轨道，control 与 text 走 DataChannel。

### 9.2 OutreachClient

```text
outreach.list({ status })
outreach.accept({ outreachId, deviceId })
outreach.decline({ outreachId, deviceId })
outreach.cancel({ outreachId })
```

OutreachClient 只提交用户意图，最终状态以服务端返回为准。

### 9.3 EventStream

```text
/v1/events
```

EventStream 只负责联络、Inbox、任务状态与呼叫信令，不承载大文本、音频或视频。连接断开后指数退避重连，重连成功后拉取 pending outreach。

## 10. 权限与安全

- API Key、Provider 密钥与媒体凭证只存在后端；
- 推送载荷不含媒体与敏感内容；
- 麦克风、摄像头、屏幕共享、推送分别授权；
- 来电必须展示 Agent 身份与原因；
- 用户拒绝后不反复弹权限窗口；
- 多端接受使用服务端仲裁，防止重复媒体；
- 主动联络有频率、时段与范围限制；
- 原始音视频默认不保存。

## 11. 验收

- 同时有文本下行与音频上行时，`cancel` 在 50 毫秒内返回，音频空隙不超过 100 毫秒；
- 大文本事件不阻塞 `cancel`、`resolve` 或 audio；
- `submit`、`cancel`、`replace` 与状态机一致；
- 工具审批进入 `waiting`，Turn 与 Step 不变，不产生新 Turn；
- `allow_once` 执行一次并回到同一 Turn；`deny` 不执行工具，Agent 收到拒绝后继续同一 Turn 或结束；
- `cancel` 与 `unavailable` 都 fail closed，不执行工具；
- 审批不产生 `allow_always`，Session policy 只有 `ask` 与 `never`；
- `resolve` 不进入 `submit`，第一条有效审批生效，其他客户端同步结果；
- 阻塞式用户提问等待回答后在同一 Turn 返回；有限时提问超时返回 pending 并允许 Agent 继续；
- 用户提问的迟到回答进入新 Turn，不恢复已结束的工具调用；
- 被取消的 Turn 保留部分输出与工具结果，不自动重试；
- 所有已认证客户端都可以提交动作，不存在只读客户端；
- 手机点击 Cancel（Stop） 后，Web 与桌面在 100 毫秒内进入同一 cancelling 状态；
- 并发 `submit`、`cancel`、`replace` 按 `controlSeq` 顺序处理，所有客户端看到相同状态；
- 重复 `actionId` 只生效一次，后续 `cancel` 为 no-op；
- 通话媒体默认由接受设备建立，其他设备观察状态并可提交控制，不重复采集音频；
- 语音与视频均通过 SessionTransport，Provider 切换不修改前端页面；
- 视频抽帧不超过每秒 2 帧，默认不保存原始视频；
- Agent 可以主动发起文本、语音、视频联络；
- 在线客户端收到事件，离线客户端收到推送或启动后补齐；
- 第一台接受设备建立媒体，其他设备停止振铃；
- 邀请过期、拒绝、取消后不能再次接受；
- 推送不含媒体，权限不足时按能力降级；
- 勿扰、频率限制与用户授权生效；
- 所有状态在 zh-CN、zh-TW、en-US、ja 四语中完整表达。

## 12. 固定约束

- 一条逻辑 Session，四类流量，不做单一 FIFO；
- 生产通话使用 WebRTC，WebSocket 承载事件与信令；
- 语音是主链路，视频是可选视觉输入；
- Agent 在后端持续在线，客户端只展示与提交意图；
- 主动联络与普通 Session 共用 Session、SessionRunner 与 SessionTransport；
- SessionTransport、SessionOutreach、SessionRunner、EventHub 职责分离；
- 新增语音或视频 Provider 不增加前端分支。
