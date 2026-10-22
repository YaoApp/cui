# Chatbox

> 状态：草案 · 2026-10-19

## 1. 定位

Chatbox 是新会话的独立章节，不是推荐列表的一部分。它负责收集一次会话的输入、资源与运行参数，然后创建会话。

推荐列表回答“用什么”，Chatbox 回答“这次要做什么、在哪台电脑、用哪个模型”。

## 2. 结构

```text
Chatbox
  ├─ 意图输入
  ├─ Workspace（仅新会话，位于模型左侧）
  ├─ 模型与思考强度（合并选择）
  ├─ 附件
  ├─ 语音输入 / Voice Chat
  ├─ 高级设置
  └─ 发送
```

### 2.1 意图输入

- 多行文本，支持直接描述任务。
- 输入提示与文字从 Chatbox 顶部开始。
- 选中 Bot 后显示对应 chip；Create App / Create Bot 时显示创建模式。
- 空输入时显示语音入口，不显示发送按钮。

### 2.2 语言输入入口

- 输入区底部右侧提供语音输入按钮。
- 旁边是 `Voice Chat`，用电话图标表示，进入实时语音会话。
- 录音时显示明确的 Listening 状态，再次点击停止。
- 语音转写结果进入文本框，发送前仍可编辑。
- 输入文字后，语音输入与 Voice Chat 换成高亮的发送按钮；附件保留。

### 2.3 Workspace 与 Computer

Workspace 决定 Computer，并在会话开始前确定。

- 新会话的 Chatbox 底部左侧、模型与思考强度合并选择左边选择一个 Workspace，按 Computer 分组，组名显示电脑与在线状态。
- 每个选项显示 Workspace 名称与 Private / Team 作用域。
- 只列出当前用户可访问的 Workspace。
- 选中 Workspace 即确定绑定的 Computer，不需要再选一次。
- 会话开始后主线 的 Workspace 固定，Chatbox 不提供切换入口。
- 会话详情右上角显示当前 Workspace，点击在 Browser 打开工作区文件。
- 支线默认继承同一 Workspace；自动支线是否允许使用其他 Workspace 由会话 Settings 设置。

```text
Mac mini · online
  Research · Private
  Team handbook · Team
Windows box · online
  Sandbox · Private
```

### 2.4 附件

- 支持添加多个文件。
- 已选文件以 chip 显示，可移除。
- 附件属于本次会话，不改变 Workspace 内容。

### 2.5 模型与思考强度

- 模型与思考强度合并为一个选择，每个选项同时包含模型与档位。
- 选中一项会同时改变模型与思考强度；档位为 `Fast`、`Balanced`、`Deep`。
- 两者都是本次会话的默认值，发送前可改。
- 模型清单与档位由平台配置；示例使用 DeepSeek Flash 4.1，界面按可用清单显示。

### 2.6 底部功能区

- 新会话左侧依次是 Workspace、模型与思考强度合并选择、设置；会话详情左侧是合并选择与设置。
- 右侧空输入时是附件、语音输入与 Voice Chat；输入文字后换成附件与发送按钮。
- 设置按钮在两个页面都位于合并选择之后，右侧组保持一致。
- 发送按钮与附件按钮同尺寸，图标用上箭头。

### 2.7 高级设置

高级设置在新会话与会话详情的 Chatbox 里，按钮位于模型与思考强度合并选择之后；面板在 Chatbox 上方展开并右对齐。本期共六项，支线自动化只在会话详情出现，新会话显示其余五项：

- **主智能体**：显示当前 Bot 或通用智能体，可以切换；具体规则见 2.8。
- **Models**：显示当前 Provider、Model、思考强度与角色摘要；点击进入二级详情；具体规则见 2.9。
- **Computer 生命周期**：会话结束后停止，或保持运行。
- **Vault access**：默认无访问；打开选择器后可以多选分组或单条密钥，分组支持全选与部分选中，不自动加载整个 Vault。
- **工具审批**：写入类工具是否每次确认。
- **支线自动化**：主面板只显示摘要与入口，点击进入二级详情；二级详情包含自动创建、并发上限，以及自动支线的模型、Workspace 与权限覆盖策略；自动创建无需确认。

会话中的设置面板在 Chatbox 上方展开，不遮挡输入区；`Esc` 或关闭键收起。

具体交互后续单独讨论。这里只保证入口存在，且不把密钥值显示在界面上。

### 2.8 主智能体

主智能体只描述 Session 由哪个 Bot 执行，不是 App 入口。

主智能体在 Settings 中是单行摘要，点击后进入二级详情；摘要显示 `Bot · Runner`。

- 二级详情包含 Bot 与 Runner 两项；
- Runner 是执行环境与会话存储，不是模型或 Provider；
- 首次选择 Model 时 Runner 默认联动：Claude → claude，DeepSeek → dsh，其他 → tai；首轮前可手动调整；
- 联动结果由后端接口解析，前端不硬编码映射；
- 选择器只列 Bot 与通用智能体，不列 App；
- New Session 可以切换主智能体，切换后 Session 由新的 Bot 执行；
- 首轮对话前可以选择或重新确定 Runner；
- 首轮对话后 Runner 已固定，只读展示，只允许切换到支持当前 Runner 的 Bot；
- 切换不重置 Session 上下文，Workspace 与已有消息保留；
- Bots 模块的默认会话与分享服务的主智能体固定，设置里只读展示；
- App 使用独立界面，不进入平台 Chatbox 的主智能体选择器。

### 2.9 Models

Models 是 Settings 的第二行，位于主智能体之后。

- 主面板显示当前 `default` 角色的 Provider、Model 与角色摘要；
- 点击后进入二级详情，逐项设置 `default`、`heavy`、`light`、`vision`、`audio`、`embedding` 与 `decision`；
- 未单独设置的角色继承 `default`，模型能力不足时显示不可用；
- Chatbox 底部的模型与思考强度是 `default` 角色的快捷控制，选择器内按 Provider → Model → 思考强度组织；
- 主智能体与 Models 解耦，切换主智能体不改变模型或角色选择；
- 角色修改从下一轮生效，不重建 Session。

完整规则见 [`llm-provider.md`](llm-provider.md)。

## 3. 状态

- 空：显示语音输入与 Voice Chat，发送按钮不出现。
- 输入中：语音入口换成品牌色发送按钮。
- 已选 Bot：显示 chip。
- 创建模式：显示 Create App / Create Bot，提示文案切换。
- 录音中：显示 Listening，按钮进入激活态。
- 发送中：进入会话起点，显示资源与 Agent run 状态。

## 4. 与 Apps / Bots 的关系

- **App 卡点击进入独立的 App 界面**，不把 App 塞进 Chatbox，也不把 App 变成主智能体。
- **Bot 卡点击选中主智能体**，在 Chatbox 里直接开始对话；之后可在设置中切换。
- Create App / Create Bot 从 Chatbox 进入创建流程；本版使用会话方式创建，2.1.0 接入 App Builder 后直接进入对应的创建应用。
- Chatbox 可以没有 Bot，直接描述任务；此时由通用智能体执行。

## 5. 待定

- 模型与思考强度的具体档位。
- Computer 生命周期的默认值。
- 分组是否允许跨 App 复用、是否允许嵌套；会话临时授权的默认时长。
- 语音输入是否支持多语言自动识别。
- 工具审批的默认策略。
