# design/ 资产索引（对应 index.html）

CUI 2.0 设计资产 · 设计体系代号 **Celadon** · 版本 **v2.0.0**。
全部色值**实时读 `tokens.css`**，零硬编码。

## 页面与配套文档（给 Agent）

| 页面 | 内容 | 配套 md |
| --- | --- | --- |
| [index.html](index.html) | 本入口页 | [index.md](index.md) |
| [color-card.html](color-card.html) | 色卡 Color card | [color-card.md](color-card.md) |
| [foundations.html](foundations.html) | 规范 Foundations | [foundations.md](foundations.md) |
| [css-logical.html](css-logical.html) | CSS 约定 Conventions | [css-logical.md](css-logical.md) |
| [data-format.html](data-format.html) | 数据格式 Data format | [data-format.md](data-format.md) |
| [icons.html](icons.html) | 图标与品牌 Icons | [icons.md](icons.md) |
| [mock.html](mock.html) | 界面稿 Mock | **无**（界面稿不配文档） |
| [README.md](README.md) | 设计说明 README | — |
| [tokens.less](tokens.less) | 唯一来源 | — |

> `mock.html` 是界面稿，**按约定不配文档**（`plan/` 与 `README.md` 已覆盖它的规则）。

## 改色流程

```
改 tokens.less → node packages/celadon/scripts/build-css.mjs → 所有规范页自动跟随
```

**不要直接改 `tokens.css`**（它是产物）—— `check-generated` 会拦住。

## 资产

| 文件 | 说明 |
| --- | --- |
| `tokens.less` / `tokens.css` | 唯一来源 / 产物（624 行，**不要手改**） |
| `logo-mark-celadon.svg` | Logo 标记 —— **浅暗同版（同一个文件）** |
| `icons/icon-16…1024.png` | App 图标 **七档** · 方形画布 · **图形内缩 78%** |
| `reference/logo-previous.svg` | 上一版旧蓝色原版 —— **只作比对基准，不在这里展示** |
| `icons/manifest.json` | 图标清单（语义名 ↔ lucide 名） |
| `icons/own-sprite.svg` | 自建图标符号 |
| `icons/brand-sprite-*.svg` | 第三方品牌雪碧图（外部引用） |
| `i18n/<locale>.json` | 四语：`zh-CN` · `zh-TW` · `en` · `ja`（缺 key 回退 `zh-CN`） |

## 本地浏览

```bash
node packages/celadon/design/serve.mjs 8080   # 零依赖，一律 no-store
```

**不要用 `python3 -m http.server`** —— 它不发 `Cache-Control`，改完 token 刷新还是旧样式。

