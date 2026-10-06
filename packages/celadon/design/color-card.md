# 色卡（对应 color-card.html）

> 色值**唯一来源**是 `tokens.less` → `build-css.mjs` → `tokens.css`；页面与本文件都只是它的呈现。
> 改 token 后跑 `pnpm design:css`，**不要改 `tokens.css`**。

## 1. token 全量（浅 / 暗）

### 品牌

| token | 浅色 | 暗色 | 用法 |
| --- | --- | --- | --- |
| `--brand` | `#2A7B7B` | `#2A7B7B` | 主按钮 / 徽标 / 选中文字 |
| `--brand-hover` | `#236B6B` | `#338F8F` | 悬停 |
| `--brand-active` | `#1D5C5C` | `#3FA3A3` | 按下 |
| `--brand-solid-hover` | `#236B6B` | `#2C8080` | 实心按钮悬停底（白字 ≥4.5:1） |
| `--brand-solid-active` | `#1D5C5C` | `#266F6F` | 实心按钮按下底（白字 ≥4.5:1） |
| `--brand-soft` | `#ECF3F3` | `#16292A` | 浅底按钮 · 选中底 · 气泡 |
| `--brand-display` | `#96C5C5` | `#96C5C5` | 大面积填充/图形（不承载文字） |
| `--brand-text` | `#FFFFFF` | `#FFFFFF` | 品牌底上的文字 |
| `--brand-ink` | `#287575` | `#389F9F` | 品牌色文字/图标（浅底按钮 · 选中底 · 气泡；软底 4.8:1，暗色自动切提亮档） |
| `--brand-lift` | `#389F9F` | `#389F9F` | 仅暗色用（文字/描边档） |

### 交互态

| token | 浅色 | 暗色 | 用法 |
| --- | --- | --- | --- |
| `--focus-ring-color` | `#2A7B7B` | `#389F9F` | 键盘焦点环颜色（2px offset + 2px 宽） |
| `--focus-ring-width` | `2px` | `2px` | 焦点环宽度 |
| `--focus-ring-offset` | `2px` | `2px` | 焦点环与控件间隙 |
| `--background-disabled` | `#F0F0F2` | `#232119` | 禁用底 |
| `--text-disabled` | `#A8A69E` | `#5F5A52` | 禁用字（豁免对比度） |
| `--border-disabled` | `#E3E1DA` | `#322F29` | 禁用边界 |
| `--scrim` | `rgba(18, 17, 16, 0.32)` | `rgba(18, 17, 16, 0.6)` | 弹窗/抽屉遮罩 |

### 中性 · 面

| token | 浅色 | 暗色 | 用法 |
| --- | --- | --- | --- |
| `--background-app` | `#F4F4F6` | `#121110` | 窗口底 |
| `--background-navigation` | `#F8F8FA` | `#151413` | ① 导航列 |
| `--background-content` | `#FAFAFB` | `#191816` | ② 内容区（非纯白） |
| `--background-surface` | `#FFFFFF` | `#1F1E1A` | ③ 面板/卡片 |
| `--background-field` | `#F4F4F5` | `#262420` | 输入框/字段 |
| `--background-hover` | `#F0F0F2` | `#2C2A26` | 悬停 |
| `--background-selected` | `#ECF3F3` | `#17292A` | 选中底（= 品牌浅底） |

### 中性 · 界

| token | 浅色 | 暗色 | 用法 |
| --- | --- | --- | --- |
| `--border-subtle` | `#EBEAE6` | `#2E2C28` | 装饰线 |
| `--border-default` | `#DEDCD7` | `#3B3933` | 常规边界 |
| `--border-control` | `#C9C7C0` | `#4A4740` | 控件边界 |
| `--border-hover` | `#9F9D96` | `#5E5A52` | 控件悬停边界 |

### 中性 · 字

| token | 浅色 | 暗色 | 用法 |
| --- | --- | --- | --- |
| `--text-primary` | `#14120E` | `#F4F1EA` | 主文字 |
| `--text-secondary` | `#5E5A52` | `#B8B3A8` | 次要文字 |
| `--text-tertiary` | `#6B6962` | `#9A9489` | 第三级 |
| `--text-placeholder` | `#6B6962` | `#9A9489` | 输入占位文字（与三级文字同色） |
| `--text-muted` | `#A8A69E` | `#736E64` | 纯装饰（分隔符/水印；不承载文字） |

### 语义

| token | 浅色 | 暗色 | 用法 |
| --- | --- | --- | --- |
| `--success` | `#057748` | `#4ADE80` | 成功（松花绿 · 传统色） |
| `--success-soft` | `#D9F0E0` | `#12261A` | 成功软底 |
| `--warning` | `#8B6214` | `#C4A767` | 警示（= --warm 别名） |
| `--warning-soft` | `#F7F0E2` | `#2C2718` | 警示软底 |
| `--warm` | `#8B6214` | `#C4A767` | 琥珀实心底（须配 --warm-contrast） |
| `--warm-soft` | `#F7F0E2` | `#2C2718` | 琥珀浅底（须配 --warm-text） |
| `--warm-text` | `#6E4D0C` | `#E4CE9C` | 琥珀浅底上的文字 |
| `--warm-contrast` | `#FFFFFF` | `#2A1B05` | 压在 --warm 实心底上的文字 |
| `--danger` | `#D93B30` | `#F87171` | 危险（朱红） |
| `--danger-soft` | `#FBECEA` | `#2A1614` | 危险软底 |
| `--danger-ink` | `#B32B22` | `#EC7A6E` | 危险底上的文字 |
| `--brand-soft-hover` | `#E4EFEF` | `#182C2D` | 品牌浅底按钮的悬停底（文字 `--brand-ink`，实测 4.60:1 / 4.61:1） |
| `--success-soft-hover` | `#F0F9F3` | `#12261A` | 描边式成功按钮的悬停淡影（文字 `--success`，实测 5.23:1 / 9.14:1；边框对底 5.23:1 / 9.14:1） |
| `--danger-soft-hover` | `#FDF7F7` | `#2A1614` | 描边式危险按钮的悬停淡影（文字 `--danger-ink`，实测 6.03:1 / 6.19:1；边框对底 4.29:1 / 6.21:1） |
| `--warm-soft-hover` | `#FCF9F3` | `#2C2718` | 描边式琥珀按钮的悬停淡影（文字 `--warm-text`，实测 7.32:1 / 9.65:1；边框对底 5.18:1 / 6.43:1） |
| `--background-inverse` | `#14120E` | `#F4F1EA` | 反色按钮常态底（须配 `--text-inverse`，实测 17.93:1 / 15.73:1） |
| `--background-inverse-hover` | `#2A2723` | `#DDD8CE` | 反色按钮悬停底（同族一小步，须配 `--text-inverse`，实测 14.25:1 / 12.49:1） |
| `--text-inverse` | `#FAFAFB` | `#191816` | 反色按钮上的文字 |
| `--focus-ring-success` | 环色 `--success` | 同左（随主题） | 成功按钮的焦点环，环色对内容底 5.38:1 / 10.18:1 |
| `--focus-ring-danger` | 环色 `--danger` | 同左（随主题） | 危险按钮的焦点环，环色对内容底 4.36:1 / 6.41:1 |
| `--focus-ring-warm` | 环色 `--warm` | 同左（随主题） | 琥珀按钮的焦点环，环色对内容底 5.22:1 / 7.66:1 |
| `--focus-ring-inverse` | 环色 `--background-inverse` | 同左（随主题） | 反色按钮的焦点环，环色对内容底 17.93:1 / 15.73:1 |

### 尺寸 · 圆角 · 动效

| token | 浅色 | 暗色 | 用法 |
| --- | --- | --- | --- |
| `--font-family-ui` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", "Noto Sans", sans-serif` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", "Noto Sans", sans-serif` | 界面字体（拉丁 + 兜底） |
| `--font-family-monospace` | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Cascadia Mono", "Liberation Mono", monospace` | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Cascadia Mono", "Liberation Mono", monospace` | 等宽字体 |
| `--font-size-11` | `11px` | `11px` | 仅西文/数字角标 |
| `--font-size-12` | `12px` | `12px` | 中文最小档 |
| `--font-size-13` | `13px` | `13px` | 正文默认 |
| `--font-size-16` | `16px` | `16px` | 补档（原 15→17 断档） |
| `--spacing-8` | `8px` | `8px` | 间距 8 |
| `--spacing-12` | `12px` | `12px` | 间距 12 |
| `--spacing-16` | `16px` | `16px` | 间距 16 |
| `--radius-small` | `6px` | `6px` | 6px |
| `--radius-medium` | `8px` | `8px` | 主档 8px |
| `--radius-large` | `12px` | `12px` | 12px |
| `--radius-pill` | `999px` | `999px` | 仅徽标/标签/头像 |
| `--row-height` | `40px` | `40px` | 行高 40 |
| `--column-header-height` | `40px` | `40px` | 列头 40（三列等高） |
| `--duration-fast` | `120ms` | `120ms` | hover 120ms |
| `--duration-base` | `200ms` | `200ms` | 展开 200ms |
| `--easing` | `cubic-bezier(0.4, 0, 0.2, 1)` | `cubic-bezier(0.4, 0, 0.2, 1)` | 缓动曲线 |
| `--shadow-subtle` | `0 1px 2px rgba(18, 17, 16, 0.05)` | `inset 0 1px 0 var(--elevation-highlight), 0 1px 3px rgba(18, 17, 16, 0.55)` | hairline |
| `--shadow-floating` | `0 10px 30px rgba(18, 17, 16, 0.1), 0 2px 6px rgba(18, 17, 16, 0.06)` | `inset 0 1px 0 var(--elevation-highlight), 0 12px 34px rgba(18, 17, 16, 0.7)` | 浮层 |

## 2. 关键配对（前景 on 背景 · 实算对比度）

| 前景 on 背景 | 浅色 | 暗色 |
| --- | --- | --- |
| 输入占位文字（与三级文字同色） | `#6B6962` on `#F4F4F5` → **5.00:1** AA | `#9A9489` on `#262420` → **5.14:1** AA |
| 主按钮 / 徽标 / 选中文字 | `#FFFFFF` on `#2A7B7B` → **4.98:1** AA | `#FFFFFF` on `#2A7B7B` → **4.98:1** AA |
| 实心按钮悬停底（白字 ≥4.5:1） | `#FFFFFF` on `#236B6B` → **6.20:1** AA | `#FFFFFF` on `#2C8080` → **4.66:1** AA |
| 实心按钮按下底（白字 ≥4.5:1） | `#FFFFFF` on `#1D5C5C` → **7.67:1** AAA | `#FFFFFF` on `#266F6F` → **5.86:1** AA |
| 品牌色文字/图标（浅底按钮 · 选中底 · 气泡；软底 4.8:1，暗色自动切提亮档） | `#287575` on `#ECF3F3` → **4.80:1** AA | `#389F9F` on `#16292A` → **4.79:1** AA |
| 琥珀实心底（须配 --warm-contrast） | `#FFFFFF` on `#8B6214` → **5.45:1** AA | `#2A1B05` on `#C4A767` → **7.21:1** AAA |
| 琥珀浅底（须配 --warm-text） | `#6E4D0C` on `#F7F0E2` → **6.78:1** AA | `#E4CE9C` on `#2C2718` → **9.65:1** AAA |
| 成功（松花绿 · 传统色） | `#057748` on `#D9F0E0` → **4.68:1** AA | `#4ADE80` on `#12261A` → **9.14:1** AAA |
| 危险（朱红） | `#B32B22` on `#FBECEA` → **5.57:1** AA | `#EC7A6E` on `#2A1614` → **6.19:1** AA |
| 主文字 | `#14120E` on `#FAFAFB` → **17.93:1** AAA | `#F4F1EA` on `#191816` → **15.73:1** AAA |
| 次要文字 | `#5E5A52` on `#FAFAFB` → **6.58:1** AA | `#B8B3A8` on `#191816` → **8.49:1** AAA |

> 等级门槛：**AAA ≥ 7:1 · AA ≥ 4.5:1（正文）· 大字/图形 ≥ 3:1 · 不达标 < 3:1**。「填充 / 边界 / 遮罩 / 仅暗色」不参与文字对比度判定；**禁用控件按 WCAG 豁免**。

## 3. 控件状态

- **输入框八态**：默认 · 悬停 · 聚焦 · 已填 · 占位 · 只读 · 禁用 · 错误（错误态带提示「日期格式不正确」）
- **按钮族 × 五态**：实心（`is-solid`）· 浅底 · 幽灵 · 琥珀 · 成功 · 危险 · 反色，各 默认 · 悬停 · 按下 · 聚焦 · 禁用。
  成功与危险取本卡已登记的配对（`--success` on `--success-soft`、`--danger-ink` on `--danger-soft`），不另造文字色。
  按下反馈统一为 `transform: scale(.94)`（F4 的 press 场景），**不是加描边**；聚焦环只在键盘聚焦时出现（`:focus-visible`）。
- 静态类 `.is-*` 与真实伪类（`:hover` `:focus` `:read-only` `:disabled`）**一一对应**，同一份 token

## 4. 字体样本

四语恒显四列（便于横向比字形），字体栈按 `:lang` 分开：**繁中若走 SC 字形会出现「简体字形冒充繁体」的错字；日文若走中文字形会出现汉字写法错误**。
六行样本：混排（正文默认 13px）· 汉字（SC/TC/JP 字形差异）· 假名与浊点 · 拉丁与数字 · 全角标点 · 等宽。
字形对照字串：`直 骨 今 令 収 收 真 具 门 門 温 溫 骨 滑 次`

## 5. 用法红线

1. 品牌分两档：实心档（--brand + 白字）只用于主按钮/徽标（≤2 处）；浅底档（--brand-soft + 品牌字）用于选中/气泡/头像。
2. 琥珀两档不得混用：--warm 配 --warm-contrast；--warm-soft 配 --warm-text。
3. 暗色下"浅底 + 品牌字/描边"一律用 --brand-lift。
4. 交互四态齐（default/hover/active/disabled），键盘焦点必须可见（--focus-ring）。
5. --brand-display 只做填充/图形，不承载文字与图标。
6. success 只用软底 + 图标，不做大面积实心。
7. 控件边界用 --border-default/--border-control，--border-subtle 只作装饰线。
8. 禁硬编码：less/tsx 不得出现颜色字面量（系统色除外）；变量/类名用全称不用缩写。

