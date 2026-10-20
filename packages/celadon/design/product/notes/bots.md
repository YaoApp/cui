# Bots

Bot 是可选择、可发布的 Agent 定义，也是 New Session 中可以直接选择的会话入口。Agent 是 Session 中实际执行任务的智能体。Bot 不是 Runner，也不是模型；Runner 与 LLM Provider 都是 Agent 的执行属性。

本文先定义 Agent、Bot 与 Session 的边界，不描述具体页面实现。

## 1. Agent 与 Bot

```text
Agent
  instruct          行为约束与 prompts
  skills            能力集合
  runner            执行壳
  llm               LLM Provider 与模型
  vault access      当前会话可用的 Vault 引用
  identity          名称、头像、描述、欢迎语
```

Agent 是运行时对象。一个 Session 有一个当前主 Agent，负责理解用户消息、调用技能、产生回复。Agent 的 Vault access 由会话授权与 Bot 的 Vault access policy 共同决定。

Bot 是保存下来的 Agent 定义，带固定的默认身份与发布入口：

```text
Bot
  identity
  instruct
  llm policy
  runner policy
  skills
  vault access policy
  publish
```

Bot 与 Agent 的关系：

- Agent 是执行角色；
- Bot 是 Agent 的可保存、可发布形态；
- 选择一个 Bot，就是用一个已经定义好的 Agent 开始 Session；
- New Session 也可以运行一个没有 Bot 身份的空白 Agent，只带 Runner、System Skills 与 Workspace Skills。

Bot 与 App 的关系：

- App 同时有人面与 Agent 面；
- Bot 是固定形态的 App，没有独立人面；
- 分享一个 Bot，得到的是一个 chat 入口。

## 2. Bot 的组成

Bot 的能力统一由 Skill 声明。MCP、知识库、外部工具与脚本都是 Skill 的能力内容，由 Skill 统一声明、授权与加载。

Bot 由以下几部分组成：

```text
Bot
  identity          名称、头像、描述、欢迎语
  instruct          prompts 与行为约束
  llm policy        LLM Provider 与默认模型
  runner policy     可选；允许使用的 Runner 清单
  skills            Bot 携带的技能，包含 MCP、知识库、外部工具与脚本
  vault access policy 可选；允许访问的 Vault 分组或密钥范围
  publish           可见范围、共享方式与 chat 入口
```

Bot 的核心是固定身份与声明式执行策略。用户选择一个 Bot，就是选择一个已经组装好的 Agent，不需要在会话里再拼装 Runner、模型、instruct 与技能。

Vault access policy 是 Bot 的凭据范围策略，不属于 Skill。Bot 只声明允许访问的 Vault 分组或密钥范围，不保存密钥值，也不允许声明整个 Vault。会话在运行中可以在这个范围内设定与切换具体引用。

Runner 与 LLM Provider 都是 Bot 的可选策略，不是固定字段。大多数 Bot 只需要声明 LLM Provider 与 Skills，Runner 由系统按 Provider 与模型推断；只有依赖特定执行壳的 Bot 才声明 Runner 策略。

## 3. Bot 与 Session 的三种绑定

Bot 是可复用定义，不是每种场景都拥有自己的 Session。按 Session 的归属分三种：

| 场景 | Session 归属 | Workspace | Bot 可切换 | 说明 |
| --- | --- | --- | --- | --- |
| New Session | 用户创建的 Session | 用户选择 | 可切换 | Bot 作为执行者，Session 是主对象 |
| Bots 模块 | Bot 的默认会话 | Bot 专属 Workspace | 不可切换 | 一个 Bot 绑定一个持久会话 |
| 分享服务 | 每个外部用户各自的 Session | 每个外部用户各自的 Workspace | 不可切换 | Bot 定义共享，会话与数据隔离 |

三种场景对应同一个 Bot 定义的三种绑定模式：

```text
executor    New Session 的执行者
home        Bots 模块的默认会话
service     分享给外部用户的服务
```

绑定模式决定 Session 归属、Workspace 归属与 Bot 是否可切换，不改变 Bot 定义。

### 3.1 New Session

New Session 中，Bot 是 Session 的执行者，不是 Session 的所有者。

- Session 可以没有 Bot，只使用空白 Agent；
- Bot 可以切换，切换后主 Agent 变为新的 Bot；
- 首轮对话前切换 Bot，可以按新 Bot 重新确定 Runner；
- 首轮对话后 Runner 已固定，只允许切换到支持当前 Runner 的 Bot；
- Workspace 由用户选择，属于 Session，Bot 的默认 Workspace 不覆盖它；
- 切换 Bot 只改变 instruct、Skills 与身份，不重置 Session 上下文。

### 3.2 Bots 模块

Bots 模块中的 Bot 是产品化入口，一个 Bot 绑定一个持久会话和一个专属 Workspace。

- 打开 Bot 进入它的默认会话；
- 主 Agent 固定为该 Bot，不显示选择器；
- Runner 在 Bot 默认会话创建时从清单与节点可用 Runner 的交集中确定，之后固定；交集为空时阻止创建；
- LLM Provider 与模型由 Bot 提供默认值，可在会话内切换；
- Workspace 使用 Bot 专属 Workspace，不跟随 New Session 选择；
- Bot 的 Vault access policy 范围内的引用可在默认会话中选择与切换，密钥值不展示；
- Bot 可以调用 A2A 专家，也可以被其他 Agent 通过 A2A 调用。

这是 Bot 的主页，不是 New Session 列表。

### 3.3 分享服务

分享出去的 Bot 是服务化的 Bot 定义，不是共享同一个会话。

- 每个外部用户访问时，创建自己的 Session，并从 Runner 清单与可用节点的交集中确定 Runner；交集为空时服务不可用；
- 平台为每个外部用户创建或复用其 Workspace，用户会话不在 Bot 的 Builder Workspace 中运行；
- Bot 定义共享，Session、Workspace 与上下文隔离；
- 用户不能切换 Bot 或 Runner；LLM Provider 在 Bot 允许范围内可以切换；
- Bot 的 Vault access policy 由运行侧执行，外部用户不能读取密钥值，也不能超出 policy 范围；
- 外部用户的数据不写回 Bot 的 Builder Workspace。

### 3.4 Bot 更新

Bot 定义更新后，Bots 模块的默认会话与分享服务的已有会话都跟随新定义。

- 下一轮对话开始使用新的身份、instruct、Skills、LLM policy 与 Vault access policy；
- 历史消息不重写，保留原有署名与内容；
- Workspace 与 Session 上下文保留；
- Runner 仍按会话固定，不随 Bot 更新改变；
- 新定义若不再允许当前 Runner，会话暂停并提示新建 Session。

### 3.5 会话生命周期

Bots 默认会话的重置、归档与上下文压缩由 Runner 管理，不由 Bot 页面单独定义。

后端可以按入口设置上下文压缩阈值：

```text
普通 Session     0.8
Bots 模块入口    0.6
```

Bots 入口更早压缩，是为持久会话控制上下文体积。具体数值属于 Runner 配置，不作为 Bot 定义的一部分，也不在 Chatbox 暴露。

## 4. 主 Agent 与 Runner

主 Agent 的切换能力由使用场景决定：

- New Session 可以切换主 Agent，即切换 Bot 或调整空白 Agent；
- Bots 模块与分享服务中主 Agent 固定；
- 切换主 Agent 不改变已确定的 Runner；
- 新 Bot 必须支持当前 Runner，否则只能新建 Session。

Runner 只有在 Session 首轮对话前才能确定。首轮之后，Runner 随 Session 固定，不随 Bot 切换而改变。

Runner 的内部会话应按 Session 绑定，而不是按主 Agent 绑定。这样 New Session 切换 Bot 时，Session 上下文不会因为 Runner 会话键变化而丢失。

## 5. Runner 与 LLM Provider

这两个概念必须分开：

| 概念 | 含义 | 例子 |
| --- | --- | --- |
| LLM Provider | 模型供应方连接，包含一组模型 | DeepSeek、Anthropic、OpenAI |
| Model | Provider 下的具体模型 | DeepSeek V3、Claude Sonnet |
| Runner | 执行壳与会话存储 | `dsh`、`claude`、`opencode`、`tai`、`yaocode` |

Runner 决定任务如何执行、使用哪个 CLI 或 SDK，以及内部会话保存在哪里。LLM Provider 决定调用哪个模型服务。

产品文档与界面统一使用 LLM Provider，不再使用 Connector 作为产品概念。Connector 只保留为兼容层。

Runner 由 Bot 声明为可执行壳清单，不在 Bot 上直接固定一个值：

```text
runner policy
  []                默认，按 LLM Provider 与模型推断
  [dsh, tai]        只允许清单内的 Runner
```

大多数 Bot 使用空清单，只有依赖特定执行壳的 Bot 才声明清单。

Runner 清单只描述执行壳，例如 `dsh`、`tai`，不描述模型。

LLM 策略声明默认 Provider 与 Model，以及允许切换的范围。会话内切换只影响后续轮次，不重建 Session。

Runner 的具体值在 Session 首次创建时确定：

1. Bots 模块创建 Bot 默认会话时；
2. 分享服务为外部用户创建会话时；
3. New Session 的首轮对话前，在 Settings 的高级项中选择。

选择规则：

- 只从 Bot 清单与节点可用 Runner 的交集中选择；
- 优先使用 LLM Provider 推断出的 Runner，前提是它在清单内；
- 推断结果不在清单内时，按清单顺序选择可用的 Runner；
- 交集为空时阻止会话创建，不回退到清单外的 Runner。

Runner 写入 Session 后不可更换。Session 内所有 Bot 都跟随这个 Runner 执行；Bot 的清单不包含当前 Runner 时，不能被选为主 Agent，也不能出现在 A2A 可调用列表。

运行中节点不可用时，不自动切换到清单内的其他 Runner。Session 应暂停或失败，需要更换 Runner 时新建 Session。

LLM Provider 与模型不受首轮限制，可以在任意轮次切换；切换范围受当前 Runner 与 Bot 的 LLM 策略约束。

会话开始后，Runner 只读展示，不放在 Chatbox 中；Chatbox 中的模型选择是 LLM Provider 与 Model，不是 Runner。

## 6. Skills 三层

Skills 是统一的能力单元。MCP、知识库、外部工具与脚本都通过 Skill 声明与加载。

Skills 按来源分为三层：

| 层级 | 归属 | 作用域 | 是否随 Bot |
| --- | --- | --- | --- |
| System Skills | Yao 系统 | 全局 | 否 |
| Bot Skills | Bot | 当前 Bot | 是 |
| Workspace Extension Skills | Workspace | 当前 Workspace 的所有 Session | 否 |

规则：

- System Skills 始终可用，不能被 Bot 或 Workspace 覆盖；
- Bot Skills 跟随 Bot；在 Bots 模块与分享服务中只读，在 New Session 切换 Bot 时随之切换；
- Workspace Extension Skills 属于 Workspace，可跨 Session 复用，可编辑；
- A2A 专家使用自己的 Bot Skills，加上当前 Workspace 的 Extension Skills，不继承主 Bot 的 Bot Skills；
- 三层按来源隔离，不做隐式同名覆盖。

## 7. Vault access policy

Bot 声明可访问的 Vault 范围，运行中的会话在这个范围内选择与切换具体引用。

Vault access policy 的规则：

- 只能声明允许访问的 Vault 分组或单条密钥范围，不能声明整个 Vault；
- Bot 定义中不保存密钥值，运行时由平台按引用注入；
- 会话可以在 policy 范围内设定与切换引用，不能超出范围读取；
- 未选择引用时为空，不自动使用整个 policy；
- 切换引用只影响后续调用，不重建 Session；
- New Session 切换 Bot 时，Vault access 随 Bot 的 policy 切换，原有选择重新校验，超出新 policy 的引用被移除，临时授权不自动转移；
- 分享服务中，外部用户不能查看密钥值，也不能超出 Bot 的 policy 范围；
- A2A Guest 使用自己的 Vault access policy，不继承主 Bot 的 policy；
- 每次读取与使用都按 Bot、Session 与密钥引用记录审计。

Vault access policy 与 Skill 分开：Skill 声明能力，Vault 声明能力可以访问哪些凭据。

## 8. A2A

A2A 是调用外部 Agent，不是切换主 Agent，也不是 Subagent。

A2A 的规则：

- 继承当前 Workspace；
- 父 Session 始终只有一个 Runner 与一份主线上下文；
- Guest 跟随父 Session 的 Runner 执行；Guest 的 Runner 清单不包含当前 Runner 时，不出现在 @ 可调用列表；
- Guest 接收任务上下文，不拥有第二条主线；
- Guest 使用自己的 Bot Skills，加上当前 Workspace 的 Extension Skills；
- Guest 的输出回到主线，作为 A2A 结果呈现；
- Guest 不进入主 Agent 选择器；
- Subagent 标记为 `Subagent`，A2A Guest 标记为 `A2A`。

Bot 可以作为 A2A Guest 被调用，但被调用不会把父 Session 变成 Bots 模块的默认会话。
