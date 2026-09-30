# CSS / LESS 编码规范

> 只写**我们已经踩过坑、或已经用门禁拦住**的规矩；没定过的先不写，等真遇到再加。
> 语言相关的约定（TS / 组件 / 命名）后续需要时另起小节。

## 1. 颜色只用 token

- **禁止**任何颜色字面量（`#fff` · `rgb()` · `hsl()`），一律 `var(--token)`
- 唯一的例外是**品牌官方色**（logo 自带色，商标规范要求不得改色）与**系统再现**（macOS 红黄绿灯）
- **装饰色（`--text-muted`）不能承载文字** —— 它只用于分隔符、水印
- 检查：`scripts/check-tokens.mjs` · `scripts/check-generated.mjs`

## 2. 尺寸只用 token

| 类别 | 用什么 | 不用什么 |
| --- | --- | --- |
| 间距 | `--spacing-*`（4/8/12/16/24/32/48） | `padding: 6px` / `margin: 10px` |
| 圆角 | `--radius-*`（xs/small/medium/large/pill） | `border-radius: 10px` |
| 字号 | `--font-size-*` | `font-size: 11.5px` |
| 行高 | `--line-height-normal`（拉丁）/ `--line-height-cjk`（中日文） | `line-height: 1.6` |
| 线宽 | `--border-width` | `border: 1px solid …` |
| 阴影 | `--shadow-*` | 手写 `box-shadow` |

- **不要用 `font:` 简写** —— 它会把字号与行高一起写死、绕过 token。拆成 `font-family` / `font-size` / `font-weight` / `line-height`
- 检查：`scripts/check-tokens.mjs`（含"漏分号"与"`font:` 简写夹带字号"两条）

## 3. 布局只用逻辑属性（为 RTL 留门）

这条是**现在**的约定，不是"以后做 RTL 再说" —— 事后改要动全站布局，事前几乎免费。

| 物理写法 ✗ | 逻辑写法 ✓ |
| --- | --- |
| `margin-left` / `margin-right` | `margin-inline-start` / `margin-inline-end` |
| `padding-left` / `padding-right` | `padding-inline-start` / `padding-inline-end` |
| `left: 0` / `right: 0` | `inset-inline-start: 0` / `inset-inline-end: 0` |
| `text-align: left` / `right` | `text-align: start` / `end` |
| `border-left` / `border-right` | `border-inline-start` / `border-inline-end` |
| `border-top-left-radius` 等 | `border-start-start-radius` 等 |

**有意保留物理方向的例外**（使用时必须在代码里注明理由）：

1. **窗口红绿灯** —— macOS 在 RTL 语言下也放在**左上**，这是系统行为
2. 明确以"屏幕绝对方位"为语义的元素（如拖拽把手的物理位置）

**现状**：三张规范页（`icons.html` / `index.html` / `mock.html`）是**演示稿**，不要求回改；**产品代码从第一行起就守这条**。逻辑属性的实际效果见 `design/css-logical.html`。

## 4. 怎么检查

| 检查 | 脚本 | 覆盖 |
| --- | --- | --- |
| 颜色 / 字号 / 行高 / 圆角 / 间距 / 线宽 / 漏分号 | `check-tokens.mjs` | 规范页 + 展示页 |
| 生成物与源一致 · 品牌标记色 | `check-generated.mjs` | `icons.html` / `mock.html` / `index.html` |
| i18n 缺 key / 漏翻 | `check-i18n.mjs` | 四语 JSON |
| **物理方向属性**（§3 这条）| `check-css-conventions.mjs` | 产品代码与展示页（演示稿登记为存量）|
| README 色值与 tokens 一致 | `check-readme-values.mjs` | `design/README.md` |

跑法：`node packages/celadon/scripts/<脚本>`（脚本自己切到 `design/` 工作，从哪跑都行）；四个都应为 0 退出码。

> **已经有扫描版**（`check-css-conventions.mjs`，不依赖构建工具）—— 新增页面里出现物理方向属性会直接失败。
> stylelint 版待 `01 基础设施` 选型后接线，届时连产品样式表也一起拦。
