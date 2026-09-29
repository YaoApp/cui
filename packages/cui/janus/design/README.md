# janus/design — 2.0 设计 token（Option A · Codex 化）

## 是什么

| 文件 | 内容 |
| --- | --- |
| [`tokens.less`](tokens.less) | **2.0 设计 token 单一来源**：浅色 + 暗色两套 CSS 变量（作用域 `.jn2`）+ 用法约定 |

## 色值依据（有出处）

**OpenAI Codex 官方色**（`openai/codex` · `codex-rs/tui/src/style.rs`）：

| Codex 常量 | 色值 | 我们用在哪 |
| --- | --- | --- |
| `CHATGPT_BLUE_200` / `UI_ACCENT` | `#63A8F8` | 暗色 `--brand` |
| `CHATGPT_BLUE_100` | `#A4CDFB` | `--brand-display`（大面积/填充） |
| `LIGHT_BG_ACCENT_RGB` | `#1C64C8` | 浅色 `--brand` |
| 警示淡琥珀（浅/暗） | `#8B6214` / `#C4A767` | `--warm`（"可见但不像错误"） |
| OpenAI 品牌中性 | Cod Gray `#080808` + White | 暗色底 / 浅色面 |

**规则**：
1. **单一蓝分档**（浅底 `#1C64C8` / 暗底 `#63A8F8` / 填充 `#A4CDFB`）——不引入第二个品牌色相；
2. **中性底**（近白 `#F7F7F8`↔`#FFFFFF` / 近黑 `#080808`）承载内容；
3. **暗色由 semantic 覆盖**，component 层不重复写死；
4. **禁硬编码 hex**（less/tsx 里不得出现颜色字面量）。

## 对比度自检（WCAG）

| 组合 | 比值 | 结论 |
| --- | --- | --- |
| 白字 on `--brand`(浅 `#1C64C8`) | **5.67:1** | AA ✓ |
| 深字 on `--brand`(暗 `#63A8F8`) | **6.63:1** | AA ✓ |
| `--text-1` on `--bg-content`（浅） | 19.8:1 | AAA ✓ |
| `--text-2` on `--bg-content`（浅） | 6.63:1 | AA ✓ |
| `--text-1` on `--bg-content`（暗） | 17.45:1 | AAA ✓ |
| `--warm-text` on `--warm-soft` | 6.78:1 | AA ✓ |

## 用法（"浅底"为默认观感）

```less
.btn-primary      { background: var(--brand-soft); color: var(--brand); border: 1px solid var(--brand); }
.btn-primary.is-solid { background: var(--brand); color: var(--brand-text); }
.badge-warn       { background: var(--warm-soft);  color: var(--warm-text); border: 1px solid var(--warm); }
```

> 效果图见 workspace `design/v2/render/mock-a.html` 与 `shots/A-*.png`。
