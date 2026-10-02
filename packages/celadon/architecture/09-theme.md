# 09 · 主题

- **版本**：v1.17
- **最后修改**：2026-10-02 14:08:10
- **说明**：token 单一来源 · 主题映射 · 运行期对比度

## 规则

- **颜色的唯一来源是 `../design/tokens.less`**；`tokens.css` 是产物（`build-css.mjs` 生成，**不许手改**）。
- 浅 / 暗两套**都来自同一份 token**；**不引入第二份颜色来源**。
- 组件**不得**写颜色字面量；**唯一例外**：系统色（如 macOS 红绿灯）与**品牌官方色**（见 `10-icons.md`）。
- 暗色下"浅底 + 品牌字/描边"一律用 `--brand-lift` —— 这条在 token 层已解决（`--brand-ink` 在暗色块里被覆盖为 `var(--brand-lift)`），**组件不需要自己判断主题**。
- 主题挂在 `.celadon` 自身或任意祖先（选择器已双写覆盖）。

## 待做

- **组件库主题映射**（子项 5）：同一份 token 生成组件库主题。
- **运行期对比度校验**（子项 8）：`readableColorOn(fg, bg)` 按**实际绘制的背景**算对比度并给可读替代色；开发期断言 + 关键组件接入。

## 页面底色归壳

**整页底色与整页高度由 `app/src/platform/shell.less` 负责**（`html`/`body` 铺满 + `--background-app` 底色 +
`body` 的默认外边距清零），feature 与组件只管自己那块。组件**不需要知道当前深浅** —— 深浅由 token 决定。

> **整页底色与整页高度是一对**：只改一处，底部就会露出另一层的分界。
> 守住它的是拟人测试的可视断言（页面自身是否跟随主题 · 内容面是否铺满视口）。

## 主题状态与切换

主题归 **`app/src/platform/theme/theme.store.ts`**（zustand + persist）：`theme`（`light` / `dark`）· `setTheme`。
它只做一件事 —— 把当前主题写到根元素的 `data-theme` 上；`tokens.css` 里 `[data-theme='dark'] .celadon` 会切掉整套值，
**组件不需要知道当前深浅**。选择存 `localStorage`（键 `cui.theme`），刷新后还在。
副作用放在**初始写一次 + 订阅变化**里，而不是塞进 `setTheme` —— 这样持久化水合、测试复位等任何改到主题的路径都会同步 DOM。

切换控件是 **`app/src/components/theme-toggle/`** —— 纯组件，只收 `theme` + `onChange` 两个 props，
不碰 store；由 feature 接线。视觉用设计系统里的 `.seg`（分段控件）。测试里的 store 复位是自动的，不必手补。

## 待讨论

- 主题是只支持 `light` / `dark`，还是要预留"跟随系统"的第三态。
- `data-theme` 的挂载点约定（`<html>` 还是应用根容器）。
