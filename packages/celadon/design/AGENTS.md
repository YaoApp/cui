# design/ — 设计体系索引与红线（给 Agent 与复核者）

本目录是 2.0 设计体系的**唯一来源**：token、色卡、字体、图标、多语言样例，以及产品草图（`prototype/`）。
产品代码只消费这里产出的 `tokens.css` 与 `i18n/bundle.js`，不复制色值、字号与间距。

## 1. 索引

| 路径 | 内容 | 状态 |
| --- | --- | --- |
| [`tokens.less`](tokens.less) | **设计 token 唯一来源**（浅 + 暗，作用域 `.celadon`）+ 用法约定 | 现行 |
| [`tokens.css`](tokens.css) | 由 `tokens.less` 生成（`node packages/celadon/scripts/build-css.mjs`）| 生成物，勿手改 |
| [`color-card.html`](color-card.html) · [`color-card.md`](color-card.md) | **色卡**：色值与尺寸实时读 `tokens.css`；对比度按真实内容底实算 | 现行 |
| [`foundations.html`](foundations.html) · [`foundations.md`](foundations.md) | **基线五项**：间距 · 圆角 · 层级 · 动效 · 边框 | 现行 |
| [`icons.html`](icons.html) · [`icons/`](icons/) | 图标样本与 PNG 七档（16–1024）| 现行 |
| [`css-logical.html`](css-logical.html) · [`css-logical.md`](css-logical.md) | 逻辑属性样例（inline / block 方向）| 现行 |
| [`data-format.html`](data-format.html) · [`data-format.md`](data-format.md) | 数据格式样例（数字 · 时间 · 金额等）| 现行 |
| [`index.html`](index.html) · [`index.md`](index.md) | 设计入口页 | 现行 |
| [`mock.html`](mock.html) | 组件与页面拼装样例 | 现行 |
| [`logo-mark-celadon.svg`](logo-mark-celadon.svg) · [`logo-app-celadon.svg`](logo-app-celadon.svg) · [`reference/logo-previous.svg`](reference/logo-previous.svg) | Logo（**仅设计，尚未进生产**）| 交付物 |
| [`i18n/*.json`](i18n/) + `bundle.js` | **多语言样例**（`ui.*` 界面文案 / `sample.*` 演示数据）；构建 `node packages/celadon/scripts/build-i18n.mjs` | 现行 |
| [`prototype/`](prototype/) | **产品草图（纯 HTML + token）**：登录、注册、服务器选择等；先评审 UE/UI，再进产品代码 | 新增 |
| [`serve.mjs`](serve.mjs) | 本地静态服务（默认 8080，`Cache-Control: no-store`）| 工具 |

## 2. 红线（写代码或评审前必读）

1. **唯一来源**：颜色、间距、字号、圆角、描边一律经 token（`var(--…)`）。出现字面量色值或自造尺寸即为缺陷。
2. **改色只改 `tokens.less`** → 跑 `build-css.mjs` → 色卡与产品自动跟随。`tokens.css` 与 `i18n/bundle.js` 是生成物。
3. **四语齐**：`zh-CN` · `zh-TW` · `en-US` · `ja`（代码里的 `en` 视为 `en-US`）；缺语或缺键即为缺陷。
4. **对比度实测**：正文 ≥ 4.5:1；控件边界按 WCAG 1.4.11 ≥ 3:1。新增配色必须在色卡里给出浅、暗两套实测值。
5. **浅暗成对**：任何新样式都要在浅色与暗色两套主题下成立，截图各一张。
6. **键盘可达**：焦点环用 `--focus-ring`，组件外不写内联边框（会露出浏览器默认蓝环）；Tab 顺序与回车提交要有用例或截图。
7. **字体分栈**：`.celadon:lang(…)` 自动映射 hans / hant / japanese；中日文行距用 `--line-height-cjk`。
8. **草图约定**（`prototype/`）：只引 `tokens.css`；覆盖完整状态而非只画成功路径；附交互说明（焦点顺序 · 回车提交 · 错误定位 · 禁用与加载态 · 断点行为）。

## 3. 怎么看

```bash
node packages/celadon/design/serve.mjs        # 默认 8080，浏览器打开 /index.html
```

`file://` 直接打开亦可（`bundle.js` 为免 fetch 而生成）。

## 4. 评审

**分两个阶段，别把后一阶段的活提前干**：

| 阶段 | 做什么 | 不做什么 |
| --- | --- | --- |
| **设计稿阶段**（`prototype/` 还在改形态）| 只看**看得见的东西**：版面 · 状态怎么表达 · 文案与语言 · 交互形态；改完自己起服务看一眼即可 | 不派 `design-review`、不跑门禁、不列截图清单、不做四语缺键核对、不写归档记录 —— 此时代码里没有真实接口与组件，查了也不算数 |
| **代码阶段**（页面接真接口、控件做成 `components/base` 之后）| 才走 **`design-review`**：派只读复核者，先读本文件，再看代码，最后看截图，输出报告；并补做对比度实测 · 键盘可达性 · 四语核对 · 死代码与残留标签清理 | 不再回头改设计形态（那属于设计稿阶段的事）|

设计稿阶段留下的问题清单（如 [`../plan/07-design-review-entry.md`](../plan/07-design-review-entry.md)）就作为**代码阶段的待办**。

**例外：控件边界对比度从设计稿阶段就要核，不许往后拖。**

- **软件内页**（客户端里的页面，如 `?from=connect` 的入口页与服务器选择页）的输入框 · 复选框 · 按钮 · 选择器边界**必须**满足 WCAG 1.4.11 的 **≥ 3:1**（取 `--border-control` 默认档或 `--border-control-strong` 达标档）。
- **只有对外的独立登录/注册页**允许用更浅的边界（`--border-control-low`），属**已认可的特殊情况**；一旦这些页要嵌进客户端，按软件内页的标准核。

## 5. 与别处的关系

- 产品实现（组件与页面样式）在 `app/src/components/` 与 `app/src/features/`；**本目录不放产品代码**。
- token 的语义与用法约定写在 `tokens.less` 的注释与其说明文档里；本文件只做索引与红线。
- 计划与进度在 `../plan/`（登录与注册见 [`../plan/06-login.md`](../plan/06-login.md)）。
