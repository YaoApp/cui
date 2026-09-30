# celadon/design — 2.0 设计 token（v1.1）

| 文件 | 内容 |
| --- | --- |
| [`tokens.less`](tokens.less) | **2.0 设计 token 唯一来源**（浅 + 暗，作用域 `.celadon`）+ 用法约定 |
| [`build-css.mjs`](build-css.mjs) | 由 `tokens.less` 生成 `tokens.css`（色卡与后续主题生成都从这里派生） |
| [`tokens.css`](tokens.css) | **自动生成，勿手改** |
| [`color-card.html`](color-card.html) | **色卡**（浏览器直接打开）：所有色值/尺寸**实时读 `tokens.css`**，零硬编码；对比度按各主题真实内容底自动实算；点击 hex 复制 |
| [`i18n/`](i18n/) | **多语言文案**：`zh-CN.json` · `zh-TW.json` · `en.json` · `ja.json`（`ui.*` 界面文案 / `sample.*` 演示数据）+ `bundle.js`（自动生成） |
| [`build-i18n.mjs`](build-i18n.mjs) | 由 `i18n/*.json` 生成 `i18n/bundle.js`（**不用 fetch**，file:// 直接可用） |
| [`logo-mark-celadon.svg`](logo-mark-celadon.svg) 等 | **Logo 设计交付物（仅设计，尚未应用到生产）**：官方原版 logo 换色版（`-dark`）· [`reference/`](reference/) 官方正源存档 |
| [`icons/`](icons/) | **图标 PNG 七档（16–1024）**：由 **网页版剪影**（`logo-mark-celadon.svg`）导出，**等比居中**（实测中心偏移 0，留白 6%，比例 1.179） |

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
| 品牌 hover / active | `#236B6B` / `#1D5C5C` | `#338F8F` / `#3FA3A3` | 四态齐（default/hover/active/disabled） |
| 品牌浅底 / 填充 | `#ECF3F3` / `#96C5C5` | `#16292A` / `#96C5C5` | 填充**不承载文字/图标** |
| 品牌文字档（暗） | — | `#389F9F` | on `#101010` **6.01:1 ✓** |
| 中性底 | `#FAFAFB` / `#F4F4F6` | `#101010` / `#080808` | `text-1` 18.98:1 / 17.45:1 |
| 成功 / 警示 / 危险 | `#057748` / `#8B6214` / `#D93B30` | `#4ADE80` / `#C4A767` / `#F87171` | 5.62 / 5.45 / 4.55 ✓ |
| **琥珀配对** | `--warm` + `--warm-contrast`（白） | + `--warm-contrast`（`#2A1B05`） | 5.45 / 7.21 ✓；**浅底**用 `--warm-soft` + `--warm-text` 6.78 ✓ |
| 焦点环 | `--brand` + 2px offset | `--brand-lift` | 键盘可达性必备 |
| 遮罩 | `rgba(10,10,10,.32)` | `rgba(0,0,0,.56)` | 弹窗/抽屉统一 |
| 禁用 | `#F0F0F2` / `#A8A8B0` / `#E4E4E7` | `#1A1A1A` / `#5A5A5A` / `#2A2A2A` | 豁免对比度要求 |

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
5. **暗色下"浅底 + 品牌字/描边"一律用 `--brand-lift`**（`#2A7B7B` 在近黑上约 4.1:1）；
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
| [`mock.html`](mock.html) | **详细界面稿**（1440×888 真壳，浏览器直接打开）：① 导航列（交通灯 + 品牌 + 新任务 + 固定区 + 收件箱上下文 + 用户行）② 内容列（列头 + 能力图标 + 消息流：工具卡 / 未读分隔 / 确认卡 / 文件 chip / diff）③ 侧边面板（可关 tab + 子任务进度 + 门禁 9 项 + 变更 diff + 相关文件 + 活动时间线） |

- **零硬编码**：所有颜色/圆角/间距都从 `tokens.css` 读（页面里查不到任何色值字面量，已验证）；
- 图标全部为**线性 SVG**（51 个 `<use>`，无 emoji）；
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
