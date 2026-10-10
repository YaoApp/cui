# components/base/brand-mark

`components/base/brand-mark` 是品牌标识。它画的是品牌图形（`brand-` 前缀的图形标识），与界面图标分属两套：
界面图标用 `components/base/icon`，品牌图形用这里，两者不混用。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `brand-mark.tsx` | `BrandMark` 组件、`BrandMarkProps` 与 `BrandId`。 |
| `brand-mark.less` | 品牌图形的颜色，取 `--brand-graphic`，深浅主题各一套值。 |
| `brand-mark.test.tsx` | 单元用例。 |
| `index.ts` | 对外出口。 |

## 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `name` | `BrandId`，形如 `brand-<名>` | 无 | 图形名，限定为 `brand-` 前缀的那些 id。 |
| `size` | `number` | `24` | 像素尺寸，最小 16；再小用应用图标。 |
| `label` | `string` | 无 | 无障碍名。品牌标识有含义，导航列这类有语义的位置要传。 |
| `className` | `string` | 无 | 追加类名。 |

## 使用方式

```tsx
<BrandMark name="brand-yao-agents" size={20} label={t('app.name')} />
```

## 验证方式

单元用例与组件同目录：`brand-mark.test.tsx`。

## 已知限制

- 只支持清单里登记的品牌图形；新增图形先在 `design/icons/manifest.json` 登记再装配。
