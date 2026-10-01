# CSS 约定：布局只用逻辑属性（对应 css-logical.html）

**规则**：布局一律用逻辑方向，不用物理方向 —— 目的是一行 `dir="rtl"` 就能整体镜像。

## 对照（检查器拦的就是这些）

| 物理 ✗ | 逻辑 ✓ |
| --- | --- |
| `margin-left` | `margin-inline-start` |
| `margin-right` | `margin-inline-end` |
| `padding-left` | `padding-inline-start` |
| `padding-right` | `padding-inline-end` |
| `left` | `inset-inline-start` |
| `right` | `inset-inline-end` |
| `text-align: left / right` | `text-align: start / end` |
| `border-left` | `border-inline-start` |
| `border-right` | `border-inline-end` |
| `border-top-left-radius` 等四角 | `border-start-start-radius` 等逻辑角 |

## 怎么验

`css-logical.html` 右上角切 **LTR / RTL**  同一组件的两份实现并排
**物理版会错位**（计数跑到左边、强调线跑到右边） **逻辑版跟着文字方向正确镜像**

演示的三处：导航项尾计数（`margin-left:auto` vs `margin-inline-start:auto`）· 引用块强调线（`border-left` vs `border-inline-start`）· 内距（`padding-left` vs `padding-inline-start`）。

## 允许保留物理方向的两处

1. **窗口红绿灯** —— macOS 在 RTL 语言下也把红黄绿灯放在左上，这是系统行为，不是我们的布局。
2. **语义就是"屏幕绝对方位"的元素**（如拖拽把手的物理位置）—— **用到时必须在代码里注明理由**。

## 检查器与豁免

- 检查器：`node scripts/check-css-conventions.mjs`，扫 `design/**` 的 `<style>` 段落与 `tokens.less` · `tokens.css`。
- 需要故意写反例时，在段落里加行内标记：`/* css-conventions: allow-physical —— 理由 */`（`css-logical.html` 用的就是这个）。
- **5 个演示页目前在豁免名单里**（`LEGACY`：`icons.html` · `index.html` · `mock.html` · `color-card.html` · `foundations.html`）：
  它们里的物理属性**只登记、不打印细节、不阻塞** —— 这条规矩约束的是**产品代码**。

