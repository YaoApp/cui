# celadon/design — 2.0 设计 token（v1.1）

| 文件 | 内容 |
| --- | --- |
| [`tokens.less`](tokens.less) | **2.0 设计 token 唯一来源**（浅 + 暗，作用域 `.celadon`）+ 用法约定 |
| [`build-css.mjs`](build-css.mjs) | 由 `tokens.less` 生成 `tokens.css`（色卡与后续主题生成都从这里派生） |
| [`tokens.css`](tokens.css) | **自动生成，勿手改** |
| [`color-card.html`](color-card.html) | **色卡**（浏览器直接打开）：所有色值/尺寸**实时读 `tokens.css`**，零硬编码；对比度按各主题真实内容底自动实算；点击 hex 复制 |
| [`i18n/`](i18n/) | **多语言文案**：`zh-CN.json` · `zh-TW.json` · `en.json` · `ja.json`（`ui.*` 界面文案 / `sample.*` 演示数据）+ `bundle.js`（自动生成） |
| [`build-i18n.mjs`](build-i18n.mjs) | 由 `i18n/*.json` 生成 `i18n/bundle.js`（**不用 fetch**，file:// 直接可用） |
| [`logo-mark-celadon.svg`](logo-mark-celadon.svg) 等 | **Logo 设计交付物（仅设计，尚未应用到生产）**：官方原版换色版（浅/暗）· [`reference/`](reference/) 官方正源存档 |
| [`icons/`](icons/) | **图标 PNG 七档（16–1024）**：由 `logo-mark-celadon.svg` 导出，**等比居中**（实测中心偏移 0，留白 6%，比例 1.179） |

> 改色只改 `tokens.less` → 跑 `node packages/celadon/design/build-css.mjs` → 色卡自动跟随（**不用改 HTML**）。

## 字体（四语）

- **字体规范**：本目录 `tokens.less` 内的 `--font-family-*` 即为规范（下方「字体」一节）
- **按语言分栈（必须）**：`--font-family-ui-hans` / `-hant` / `-japanese`，由 `.celadon:lang(zh-CN|zh-TW|zh-Hant|ja)` 自动映射 —— 繁中不走 SC 字形、日文不走中文字形；
- **度量**：`--font-weight-normal: 430`（非整百字重，屏幕更清晰）· `--line-height-normal: 1.5` vs `--line-height-cjk: 1.7`（中日文笔画密，需要更大行距）· `--font-size-minimum-cjk: 12px` · 中文 `letter-spacing: 0`；
- **样本**：`color-card.html` →「字体样本」区，四语并列 + **同一段字的字形对照**（SC/TC/JP 差异一眼可见）。

## 定稿色

| 角色 | 浅色 | 暗色 | 校验 |
| --- | --- | --- | --- |
| **品牌** | **`#2A7B7B`**（青 · 中国传统色） | 同值 | 真实内容底 `#FAFAFB` **4.77:1 ✓ AA**；白字压它 **4.98:1 ✓** |
| 品牌 hover / active（浅底/描边档） | `#236B6B` / `#1D5C5C` | `#338F8F` / `#3FA3A3` | 作文字/描边色 |
| 品牌 hover / active（**实心档**） | `#236B6B` / `#1D5C5C` | `#2C8080` / `#266F6F` | 作**底**（压白字 ≥4.5:1：暗 4.66/5.86 ✓） |
| 品牌浅底 / 填充 | `#ECF3F3` / `#96C5C5` | `#16292A` / `#96C5C5` | 填充**不承载文字/图标** |
| 品牌文字档（暗） | — | `#389F9F` | on `#191816` **5.60:1 ✓** |
| 中性底 | `#FAFAFB` / `#F4F4F6` | `#191816` / `#121110`（暖墨） | `text-1` **17.93:1** / 15.73:1（暖墨后，仍 AAA） |
| 成功 / 警示 / 危险 | `#057748` / `#8B6214` / `#D93B30` | `#4ADE80` / `#C4A767` / `#F87171` | 5.62 / 5.45 / 4.55 ✓ |
| **琥珀配对** | `--warm` + `--warm-contrast`（白） | + `--warm-contrast`（`#2A1B05`） | 5.45 / 7.21 ✓；**浅底**用 `--warm-soft` + `--warm-text` 6.78 ✓ |
| 焦点环 | `--brand` + 2px offset | `--brand-lift` | 键盘可达性必备 |
| 遮罩 | `rgba(18,17,16,.32)` | `rgba(18,17,16,.60)` | 两套主题同源（暖墨） |
| 禁用（底/字/边） | `#F0F0F2` / `#A8A69E` / `#E3E1DA` | `#232119` / `#5F5A52` / `#322F29` | 豁免对比度要求（底未随暖墨改） |
| 控件边界（默认档） | `#C9C7C0`（悬停 `#9F9D96`） | `#4A4740`（悬停 `#5E5A52`） | 观感轻；字段底对比 浅 1.54 / 暗 1.91 |
| 控件边界（**达标档**） | `#8D8A80`（悬停 `#847F73`） | `#7C776B`（悬停 `#827D70`） | **WCAG 1.4.11 要 ≥3:1**（字段底 3.14 / 3.47）；`prefers-contrast: more` 自动切换；组件用 **`.input.is-strong`** |
| 控件边界（低对比档） | `#D5D3CC`（悬停 `#C2BEB4`） | `#3E3C36`（悬停 `#474540`） | `prefers-contrast: less` 自动切换 |
| 装饰线 / 容器边界 | `--border-subtle` `#EBEAE6` · `--border-default` `#DEDCD7` | `#2E2C28` / `#3B3933` | **不受 1.4.11 约束**（分隔线/卡片边），保持轻 |
| 焦点环 | `--focus-ring` = `--brand` + 2px offset | `--brand-lift` | **组件外不要写内联边框**（会露出浏览器默认蓝环）|
| 控件边界（默认档） | `#C9C7C0`（悬停 `#9F9D96`） | `#4A4740`（悬停 `#5E5A52`） | 观感轻；字段底对比浅 1.54 / 暗 1.91 |
| 控件边界（**达标档**） | `#8D8A80`（悬停 `#847F73`） | `#7C776B`（悬停 `#827D70`） | **WCAG 1.4.11 要 ≥3:1**（字段底实测 3.14 / 3.47）；`prefers-contrast: more` 下自动切换 |

## Foundations（P0 补齐）· `foundations.html`

间距 / 圆角 / 层级 / 动效 / 边框 五项基线，浅/暗分列、数值实时读 `tokens.css`：

| 项 | token | 规则 |
| --- | --- | --- |
| 间距 | `--spacing-4 … 48`（**7 档，纯 4 基数列**） | 组件内距 4/8/12 · 元素间 8/12/16 · 区块间 24/32/48 · 槽宽 16/24；**不设细档**（档位越少越有节奏，避免"该 4 还是 6"） |
| 圆角 | `--radius-small/medium/large/pill` | 小控件 small · 按钮/输入 medium · 卡片/面板 large · 标签/胶囊 pill |
| 层级 | `--shadow-subtle/floating/overlay` + `--z-base/raised/sticky/overlay/modal/toast/tooltip` | L0 无 · L1 卡片 · L2 浮层 · L3 弹窗（配 `--scrim`）|
| 动效 | `--duration-fast/base/slow`（三档：quiet 80/140/220 · 默认 120/200/320 · rich 180/300/480）+ `--easing-standard/decelerate/accelerate` | 微反馈 fast · 常规 base · 大位移 slow；进场 decelerate、退场 accelerate |
| 动效强度（两级） | ① **`prefers-reduced-motion` = 总开关**（时长归零，`*{…!important}`，任何局部覆盖不掉）② 场景级：容器加 `.motion-quiet` / `.motion-rich` / `.motion-still` | 局部指定随继承生效；全局默认标准 |
| 三栏竖分割（导航区 \| 内容区 \| 侧栏） | 导航 `264–420`（默认 `280`）· **收起形态按端**：客户端 `--nav-collapsed-desktop` `0`（导航区消失，内容从最左铺满；红绿灯与收起键**位置不变**，顶行让出 `--titlebar-inset` `96`）/ Web `--nav-collapsed` `56`（`--nav-rail-icon` `24` + `--nav-rail-pad` `16`×2）/ Web <`768` 转抽屉 · 中栏最小 `400` · 侧栏最小 `300`、按视图类型给默认宽 `400/600/640/840`、**可拖拽调整**（把手 `--side-resize-handle` `6`）| 让位顺序：**侧栏先缩 → 侧栏整条消失 → 中栏才低于最小**，**导航不参与宽度让步**；**侧栏上限 = 总宽 −（导航区 + 内容区最小 + 把手）**，不写死比例；阈值按**视口 CSS px**（4K@200% 与 1080p 同构）|
| 图标 Icons | 来源 **lucide**（v1.49 · **ISC 许可** · 24 × 24 网格 · 描边 2 · 约 1857 个）：本包 **67 个** = 原有 25 个换源 + 按缺口补齐 42 个，语义名 `i-<域>-<名>` 与 lucide 名一一对应（`icons/manifest.json`）· 显示档 `14/16/20/24`（默认 16）· **自绘仅限**品牌标识 / 彩色文件类型 / lucide 缺的语义 / 状态图形 / 14px 简化版，且同样画在 24 网格 2px，**自绘硬规则采用 lucide 规范**（must：24 画布 · 2 描边且沿路径居中 · 圆头圆角 · ≥1px 安全区 · 元素间距 ≥2px · 90° 圆角 2/1/2.41px；外加 should 6 组），我们只声明 **3 处例外**（显示档 14/16/20/24 与按档调线宽 · 命名 `i-<域>-<名>` · 自绘限 5 类）。**自建 `i-yaoagents`**（品牌标识：由 `logo-mark-celadon.svg` 归一化到 24 网格、留 1px 安全区、去掉导出画板；头部 `--brand-graphic`、眼睛 `--brand-text`，随主题切换），品牌区与界面共用同一个符号 |
| 排版 Typography | 字体族三套（简 / 繁 / 日）· 字重 `--font-weight-normal` `430` / `medium` `500` / `strong` `650` · 行高 `--line-height-normal` `1.5` / `cjk` `1.7` · **字号阶梯 6 档**（页面一律用这几档，**不写裸像素**）：`label` `11`（纯拉丁/数字）/ `caption` `12`（= `--font-size-minimum-cjk`，**含中日韩文字的最小档**）/ `body` `12.5` / `body-lg` `13` / `subtitle` `15` / `title` `20` |

| 边框 | `--border-control` + `--border-control-strong` | 默认弱边界（观感）；高对比偏好自动切达标档（1.4.11 要 3:1） |

## 组件草图与状态

`tokens.less` 末尾附**组件草图**（`.btn-primary` / `.btn-ghost` / `.input` / `.badge-*` / `.bubble-*` / `.nav-item.is-active` …），色卡「控件状态」面板即实时渲染这些类。

- **输入框六态**：默认 / 悬停 / 聚焦 / 占位 / 只读 / 禁用 / 错误；
- **按钮五态**：默认 / 悬停 / 按下 / 聚焦 / 禁用；
- 真实伪类（`:hover` `:focus` `:read-only` `:disabled`）与 **`.is-*` 静态类一一对应** —— 后者用于设计稿/静态页**同时展示多态**；
- 「危险」色分两档：`--danger` **只做填充**（文字仅 3.96:1），文字/图标用 `--danger-ink`（软底 5.57:1 ✓）。

## 本地浏览

设计资产是纯静态的，起一个本地服务器最方便（入口页 [index.html](index.html) 汇总了色卡 / 规范 / **图标与品牌页** / 界面稿 / 应用图标）：

```bash
node packages/celadon/design/serve.mjs 8080     # 零依赖，推荐
# 然后打开 http://127.0.0.1:8080/  （局域网用 http://<本机IP>:8080/）
```

> **为什么不用 `python3 -m http.server`**：它不发 `Cache-Control`，浏览器会启发式缓存 `tokens.css` / `bundle.js` —— 改完 token 刷新还是旧样式（"我改了但看不出变化"）。本服务器一律 `no-store`，改完刷新即见，并支持目录浏览（如 `/icons/`）。
> 也可以直接用浏览器打开 `color-card.html` / `mock.html`（`file://` 亦可，产物已随包）。

- **暗色 = 暖墨（松烟墨）**：暗面不再是纯黑（`#080808/#101010` 会在 OLED 上产生光晕），改为暖墨阶梯 `#121110 → #191816 → #1F1E1A`（内容底 `#191816`），文字用暖白 `#F4F1EA`；
- **实心按钮两套状态 token**：浅底/描边档用 `--brand-hover/-active`（作文字/描边色）；**实心档**用 `--brand-solid-hover/-active`（作底，保证压白字 ≥4.5:1）；
- **成功软底 `#D9F0E0`**：与品牌软底 `#ECF3F3` 的色差从 ΔE 3.4 拉到 10.4，避免"已完成"与"选中"同色。

## 配色来源（中国传统色）

| 角色 | 色值 | 传统色 | 说明 |
| --- | --- | --- | --- |
| 品牌 | **`#2A7B7B`** | **青** | 青瓷釉色：青而不艳、温润耐看；中文里唯一"既是蓝又是绿"的颜色词 |
| 成功 | `#057748` | 松花绿 | 与品牌青拉开色相，避免"成功=品牌"混淆 |
| 危险 | `#D93B30` | 朱红 | 警示明确，不做荧光红 |
| 警示 | `#8B6214` | 琥珀（淡） | 可见但不像错误 |

> 取「青瓷」作为代号与品牌色，器物隐喻也顺：**同一件器，一面看人，一面看 Agent**（双面 App）。

## 决策依据

品牌 **`#2A7B7B`**：落在「青」带（180°）—— 中文里唯一"既是蓝又是绿"的颜色词（青瓷 / 青花 / 青绿山水），饱和度 49%（不刺眼）。
取值由用户选定的 `#2D8282` 压深 1.5%（L34%→32.5%）：`#2D8282` 压**真实内容底 `#FAFAFB`** 只有 4.35:1（低于 AA），压深后 **4.77:1 ✓**，色相/饱和度不变、肉眼无差。

## 红线（落地必守）

1. **单一来源**：颜色只改本文件；AntD 主题从同一份 token 生成；
2. **禁硬编码**：`less/tsx` 不得出现颜色字面量（系统色如 macOS 红绿灯除外）；
3. **暗色只覆盖 semantic**，component 层不重复写死；
4. **品牌两档**：**实心档**（`--brand` + `--brand-text`）只用于主按钮/徽标（≤2 处）；**浅底档**（`--brand-soft` + `--brand`）用于选中态/气泡/头像等（可多处，单块面积要小）；
5. **暗色下"浅底 + 品牌字/描边"一律用 `--brand-lift`**（`#2A7B7B` 在暖墨底上 3.56:1，只能做图形；文字用 `#389F9F` 5.60:1）；
6. **交互四态齐**：default / hover / active / disabled；键盘焦点必须可见（`--focus-ring`）；
7. **success 只用软底 + 图标**，不做大面积实心；**琥珀两档不得混用**（`--warm` 配 `--warm-contrast`，`--warm-soft` 配 `--warm-text`）；
8. `--radius-pill` 仅用于徽标 / 标签 / 头像；
9. **中文最小 12px**（`--font-size-11` 仅西文/数字角标）。

## 用法

```less
.btn-primary { background: var(--brand-soft); color: var(--brand); border: 1px solid var(--brand);
  &.is-solid { background: var(--brand); color: var(--brand-text); } }
.btn-primary:focus-visible { box-shadow: var(--focus-ring); outline: none; }
.scrim { background: var(--scrim); }
```

> `data-theme` 可挂 `.celadon` 自身或任意祖先（选择器已双写覆盖）。

## 详细界面稿

| 文件 | 内容 |
| --- | --- |
| [`icons.html`](icons.html) | **图标与品牌**：品牌标识（Mark / App Icon · 浅暗 · 反例）· 图标系列（67 个全量画廊，可搜索 / 切 14·16·20·24 / 切浅暗 / 点击复制语义名 / 覆盖度）· **用法与自绘规范**（lucide 选型 · 命名 · 自绘 5 类 · 可访问性 · 新增流程） |
| [`mock.html`](mock.html) | **详细界面稿**（1440×888 真壳，浏览器直接打开）：① 导航列（交通灯 + 品牌 + 新任务 + 固定区 + 收件箱上下文 + 用户行）② 内容列（列头 + 能力图标 + 消息流：工具卡 / 未读分隔 / 确认卡 / 文件 chip / diff）③ 侧边面板（可关 tab + 子任务进度 + 门禁 9 项 + 变更 diff + 相关文件 + 活动时间线） |

- **零硬编码**：所有颜色/圆角/间距都从 `tokens.css` 读（页面里查不到任何色值字面量，已验证）；
- 图标全部为**线性 SVG**，取自 **lucide**（24 网格 / 描边 2）：本页 50 个 `<use>` 实例，全库 67 个符号可选；**无 emoji、无图标字体**；
- 顶部工具条可切 **浅色 / 暗色**；规范相关细节：列头严格 40px、品牌实心/浅底两档、success 只用软底+图标。

## 多语言（i18n）

- **设计规范**：`i18n/*.json` 的 `ui.*` / `sample.*` 命名空间即为规范（界面文案必翻 / 演示数据不翻；缺 key 回退 `zh-CN`）
- **语言**：简 `zh-CN` · 繁 `zh-TW` · 英 `en` · 日 `ja`（缺 key 回退 `zh-CN`）
- **用法**：元素上加 `data-i18n="ui.nav.inbox"`（富文本用 `data-i18n-html`）；带计数用 `data-count="3"` 等属性，文案里写 `{count}`
- **运行时**：只替换元素的**第一个文本节点**（保留计数徽标等子元素）；不刷新页面切换，`<html lang>` 同步
- **生成**：`node packages/celadon/design/build-i18n.mjs` → `i18n/bundle.js`

```bash
node packages/celadon/design/build-css.mjs   # tokens.less → tokens.css
node packages/celadon/design/build-i18n.mjs  # i18n/*.json → bundle.js
```
