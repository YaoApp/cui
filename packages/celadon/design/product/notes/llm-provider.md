# LLM Provider

> 状态：草案 · 2026-10-22

LLM Provider 是模型供应方连接，Model 是 Provider 下的具体模型，Role 是会话某一类模型任务的默认选择。

## 1. 概念

| 概念 | 含义 | 例子 |
| --- | --- | --- |
| LLM Provider | 模型供应方连接，包含一组模型 | OpenAI、Anthropic、DeepSeek |
| Model | Provider 下的具体模型 | DeepSeek Flash 4.1、Claude Sonnet 4.5 |
| Role | 一类模型任务的默认 Provider、Model 与思考强度 | `default`、`heavy`、`light`、`vision` |
| Runner | 执行壳与会话存储 | `dsh`、`claude`、`tai` |

Provider 不是 Connector。Connector 只作为兼容层保留。产品界面的主入口使用 Models，Provider 只在明细中出现。

Provider 不是 Runner。Provider 决定调用哪个模型服务，Runner 决定任务如何执行。

首次选择 Model 时默认联动 Runner：

```text
Claude / Anthropic   claude
DeepSeek             dsh
其他                  tai
```

Runner 写入 Session 后固定；首轮前可以手动覆盖推断值。

Model 到 Runner 的映射由后端接口解析，前端只展示返回结果。后端可以结合 Bot 的 Runner 清单、节点可用性与模型策略调整最终 Runner，前端不硬编码切换逻辑。

## 2. Provider 矩阵

Provider 矩阵由内置预设、用户自建 Provider 与团队 Provider 组成。

| 类型 | 预设示例 | 协议 | 常见能力 |
| --- | --- | --- | --- |
| 通用云模型 | `openai`、`anthropic`、`google`、`xai` | openai / anthropic / google | 文本、视觉、工具、流式、推理 |
| 自建与本地 | `azure`、`ollama` | openai / ollama | 文本、视觉、工具、流式 |
| 聚合平台 | `openrouter`、`siliconflow`、`nvidia` | openai | 多模型、视觉、工具、流式 |
| 国内平台 | `deepseek`、`kimi_intl`、`kimi_cn`、`minimax_intl`、`minimax_cn`、`stepfun`、`xiaomimimo` | openai | 文本、推理、视觉、工具 |
| 云服务商 | `volcengine`、`tencent_maas`、`dtmaas_token_plan`、`scnet` | openai | 文本、视觉、工具、流式 |
| 编码与聚合 | `opencode_go`、`opencode_go_anthropic`、`typesafe` | openai / anthropic | 文本、推理、工具、视觉 |
| 自定义 | `custom` | custom | 由 Provider 声明 |

同一 Provider 下不同模型的能力可以不同。Provider 出现在矩阵里，不代表它的所有模型都支持所有角色。

## 3. 模型能力

模型能力用于角色校验与筛选。

| 能力 | 含义 | 常见角色 |
| --- | --- | --- |
| `tool_calls` | 支持工具调用 | `default`、`decision` |
| `streaming` | 支持流式输出 | `default`、`light` |
| `json` | 支持结构化输出 | `decision` |
| `reasoning` | 支持推理强度或思考模式 | `default`、`heavy`、`decision` |
| `vision` | 支持图像理解 | `vision` |
| `audio` | 支持音频理解 | `audio` |
| `embedding` | 支持向量化 | `embedding` |
| `image_generation` | 支持图像生成 | 图像 Skill |
| `image_editing` | 支持图像编辑 | 图像 Skill |
| `ocr` | 支持文字识别 | OCR Skill |

角色选择只展示满足该角色能力的模型。Provider 可以被选择，但模型能力不足时，角色仍然不可用。

## 4. 角色

当前固定角色：

```text
default      主对话
heavy        复杂推理
light        轻量任务：标题、关键词、摘要
vision       图像理解
audio        音频理解
embedding    向量化
decision     结构化判定
```

角色保存为 Provider、Model 与思考强度：

```text
default    provider=deepseek    model=deepseek-flash-4.1    effort=balanced
heavy      provider=anthropic   model=claude-opus-4-5      effort=deep
light      provider=deepseek    model=deepseek-flash-4.1    effort=fast
vision     provider=openai      model=gpt-4o                effort=balanced
embedding  provider=openai      model=text-embedding-3-large
```

规则：

- `default` 必须有值；
- 其他角色未配置时，回退到 `default`，前提是模型具备该角色能力；
- 回退后仍不具备能力，角色不可用；
- 角色可以按系统、团队、用户三层配置，团队覆盖用户，用户覆盖系统；
- 角色能力要求是平台通用规则，主智能体不限制模型选择；
- 角色切换只影响后续轮次，不重建 Session；
- 角色目标不能为空 Provider，也不能选择未启用的模型。

## 5. Chatbox 与 Settings

Chatbox 的主选择是主智能体，不是 Models。

```text
Chatbox
  主智能体          Bot 或通用智能体
  default role      独立于主智能体，以 Session 当前选择为准
  其他角色          默认继承 default，可在 Settings 修改
```

Chatbox 底部的模型与思考强度是 `default` 角色的快捷控制，不改变其他角色。选择器按 Provider → Model → 思考强度组织，在一个控件内完成。

Settings 的第二行是 Models 明细：

```text
Settings
  1  主智能体
  2  Models
  3  Computer 生命周期
  4  Vault access
  5  工具审批
  6  Branch automation
```

第二行显示当前摘要，例如：

```text
Default · DeepSeek Flash 4.1 · 7 roles
```

点击后进入二级详情，逐项设置：

```text
Default      DeepSeek · DeepSeek Flash 4.1 · Balanced
Heavy        Anthropic · Claude Opus 4.5 · Deep
Light        Inherit default
Vision       OpenAI · GPT-4o · Balanced
Audio        Inherit default
Embedding    OpenAI · text-embedding-3-large
Decision     Inherit default
```

二级详情只列平台可用的 Provider 与 Model。没有可用模型的角色显示继承状态或不可用状态，不显示不可用的 Provider。主智能体与 Models 解耦，切换主智能体不改变当前模型选择。

## 6. 变更规则

- 切换主智能体不改变 Settings 第二行的 Models 与角色选择；
- Models 与主智能体独立，切换后不需要重新计算模型；
- 修改角色后，从下一轮开始生效；
- 角色详情不写回 Bot 定义，只作用于当前 Session；
- Bot 更新不重新校验已有 Session 的模型选择。

## 7. 待确认

- 角色是否允许完全自定义名称；
- `audio` 与 `embedding` 的 Provider 是否要求独立能力标记；
- 团队角色覆盖用户角色时，是否允许 Session 临时覆盖。
