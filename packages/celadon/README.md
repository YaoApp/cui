# celadon — CUI **2.0**（代号 Celadon · 青瓷）

> **Celadon（青瓷）** —— 青瓷釉色正是我们最终定下的品牌色 **`#2A7B7B`**：
> 青而不艳、温润、耐看。它同时承载「**双面 App**」的器物隐喻：**同一件器，一面看人，一面看 Agent**。
> **本目录即 CUI 2.0 的新代码落点**。当前**只包含设计资产 `design/`**；应用骨架与构建工具（**尚未定，不预设某框架**）在后续步骤中加入。

- 状态：**建设中**（2026-09-29 起）。
- 备份：1.x 冻结在 **`git tag v1-final`**（`2622079c`）。

## 设计规范（本仓库内自包含）

| 项 | 规范 |
| --- | --- |
| **配色** | **中国传统色**：品牌「青」`#2A7B7B`（青瓷釉色）· 成功「松花绿」`#057748` · 危险「朱红」`#D93B30` · 警示「琥珀」`#8B6214`；单一来源 [`design/tokens.less`](design/tokens.less) |
| **字体** | 四语分栈 `--font-family-ui-hans` / `-hant` / `-japanese`（`.celadon:lang(...)` 自动映射，繁中不走简中字形、日文不走中文字形）；等宽补 CJK |
| **命名** | 变量/类名**全称，不用缩写**；状态用 `is-*` |
| **字号/行高** | 中文最小 12px；行高 1.5（拉丁）/ 1.7（中日文）；中文 `letter-spacing: 0` |
| **主题** | `data-theme` 挂 `.celadon` 或其祖先；暗色只覆盖语义层 |
| **设计资产生成** | `node packages/celadon/design/build-css.mjs`（tokens.less → tokens.css）· `node packages/celadon/design/build-i18n.mjs`（i18n/*.json → bundle.js） |

## 目录

```
celadon/
  README.md   本文件
  design/     设计资产（token 单一来源 · 色卡 · 界面稿 · i18n · logo）
              —— 与应用构建方式无关，可直接用浏览器打开
```

## 约定

- **契约优先**：消息按 `@/openapi` 的 `MessageType`（17 种）渲染；缺字段记入文档，不擅自改后端契约。
- **复用不复制**：`openapi/` `types/` `utils/` `hooks/` `chatbox` 流解析 → import 复用。
- **不碰老界面**：新样式作用域化在 `.celadon` 下，迁移完成后再切入口。
- **命名**：变量/类名**用全称，不用缩写**（`--background-content` 而非 `--bg-content`、`--radius-medium` 而非 `--r-md`）。
