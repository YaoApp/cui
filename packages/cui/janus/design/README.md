# janus/design — 2.0 设计 token（v1.1）

| 文件 | 内容 |
| --- | --- |
| [`tokens.less`](tokens.less) | **2.0 设计 token 唯一来源**（浅 + 暗，作用域 `.jn2`）+ 用法约定 |
| [`build-css.mjs`](build-css.mjs) | 由 `tokens.less` 生成 `tokens.css`（色卡与后续 AntD 主题都从这里派生） |
| [`tokens.css`](tokens.css) | **自动生成，勿手改** |
| [`color-card.html`](color-card.html) | **色卡**（浏览器直接打开）：所有色值/尺寸**实时读 `tokens.css`**，零硬编码；对比度按各主题真实内容底自动实算；点击 hex 复制 |

> 改色只改 `tokens.less` → 跑 `node janus/design/build-css.mjs` → 色卡自动跟随（**不用改 HTML**）。

## 定稿色

| 角色 | 浅色 | 暗色 | 校验 |
| --- | --- | --- | --- |
| **品牌** | **`#2A7B7B`**（青 · 中国传统色） | 同值 | 真实内容底 `#FAFAFB` **4.77:1 ✓ AA**；白字压它 **4.98:1 ✓** |
| 品牌 hover / active | `#236B6B` / `#1D5C5C` | `#338F8F` / `#3FA3A3` | 四态齐（default/hover/active/disabled） |
| 品牌浅底 / 填充 | `#ECF3F3` / `#96C5C5` | `#16292A` / `#96C5C5` | 填充**不承载文字/图标** |
| 品牌文字档（暗） | — | `#389F9F` | on `#101010` **6.01:1 ✓** |
| 中性底 | `#FAFAFB` / `#F4F4F6` | `#101010` / `#080808` | `text-1` 18.98:1 / 17.45:1 |
| 成功 / 警示 / 危险 | `#057748` / `#8B6214` / `#D93B30` | `#4ADE80` / `#C4A767` / `#F87171` | 5.62 / 5.45 / 4.55 ✓ |
| 焦点环 | `--brand` + 2px offset | `--brand-lift` | 键盘可达性必备 |
| 遮罩 | `rgba(10,10,10,.32)` | `rgba(0,0,0,.56)` | 弹窗/抽屉统一 |
| 禁用 | `#F0F0F2` / `#A8A8B0` / `#E4E4E7` | `#1A1A1A` / `#5A5A5A` / `#2A2A2A` | 豁免对比度要求 |

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
7. **success 只用软底 + 图标**，不做大面积实心；
8. `--r-pill` 仅用于徽标 / 标签 / 头像；
9. **中文最小 12px**（`--fs-11` 仅西文/数字角标）。

## 用法

```less
.btn-primary { background: var(--brand-soft); color: var(--brand); border: 1px solid var(--brand);
  &.is-solid { background: var(--brand); color: var(--brand-text); } }
.btn-primary:focus-visible { box-shadow: var(--focus-ring); outline: none; }
.scrim { background: var(--scrim); }
```

> `data-theme` 可挂 `.jn2` 自身或任意祖先（选择器已双写覆盖）。
