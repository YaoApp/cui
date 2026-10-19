# Chatbox

> 状态：草案 · 2026-10-19

## 1. 定位

Chatbox 是新会话的独立章节，不是推荐列表的一部分。它负责收集一次会话的输入、资源与运行参数，然后创建会话。

推荐列表回答“用什么”，Chatbox 回答“这次要做什么、在哪台电脑、用哪个模型”。

## 2. 结构

```text
Chatbox
  ├─ 意图输入
  ├─ 语言输入入口
  ├─ Workspace（含 Computer）
  ├─ 附件
  ├─ 模型
  ├─ 思考强度
  ├─ 高级设置
  └─ 发送
```

### 2.1 意图输入

- 多行文本，支持直接描述任务。
- 选中 Bot 后显示对应 chip；Create App / Create Bot 时显示创建模式。
- 空输入时发送按钮禁用。

### 2.2 语言输入入口

- 输入区提供语音输入按钮。
- 录音时显示明确的 Listening 状态，再次点击停止。
- 语音转写结果进入文本框，发送前仍可编辑。

### 2.3 Workspace 与 Computer

Workspace 决定 Computer，不提供两个独立选择器。

- 一个下拉按 Computer 分组，组名显示电脑与在线状态。
- 每个选项显示 Workspace 名称与 Private / Team 作用域。
- 只列出当前用户可访问的 Workspace。
- 选中 Workspace 即确定绑定的 Computer，不需要再选一次。

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

- 模型选择会话使用的主模型。
- 思考强度选择 `Fast`、`Balanced`、`Deep`。
- 两者都是本次会话的默认值，发送前可改。
- 模型清单与档位由平台配置；示例使用 DeepSeek Flash 4.1，界面按可用清单显示。

### 2.6 高级设置

高级设置收在 Chatbox 的更多入口里，默认不展开。本期先放三项：

- **Computer 生命周期**：会话结束后停止，或保持运行。
- **Vault access**：默认无访问；打开选择器后可以多选分组或单条密钥，分组支持全选与部分选中，不自动加载整个 Vault。
- **工具审批**：写入类工具是否每次确认。

具体交互后续单独讨论。这里只保证入口存在，且不把密钥值显示在界面上。

## 3. 状态

- 空：发送禁用。
- 输入中：发送可用。
- 已选 Bot：显示 chip。
- 创建模式：显示 Create App / Create Bot，提示文案切换。
- 录音中：显示 Listening，按钮进入激活态。
- 发送中：进入会话起点，显示资源与 Agent run 状态。

## 4. 与 Apps / Bots 的关系

- **App 卡点击进入独立的 App 界面**，不把 App 塞进 Chatbox。
- **Bot 卡点击选中 chat 入口**，在 Chatbox 里直接开始对话。
- Create App / Create Bot 从 Chatbox 进入创建流程。
- Chatbox 可以没有 App 或 Bot，直接描述任务；此时由默认 Agent 执行。

## 5. 待定

- 模型与思考强度的具体档位。
- Computer 生命周期的默认值。
- 分组是否允许跨 App 复用、是否允许嵌套；会话临时授权的默认时长。
- 语音输入是否支持多语言自动识别。
- 工具审批的默认策略。
