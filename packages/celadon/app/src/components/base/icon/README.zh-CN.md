# components/base/icon

`components/base/icon` 是界面图标。图标本体来自仓库的雪碧图（源是 `design/icons/manifest.json`，经
`node scripts/build-icons.mjs` 装配），组件按 24 网格缩放到四档尺寸并让描边保持一致。

界面里任何图标都用它，不许自绘 `<svg>`，也不许在组件里写图标路径。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `icon.tsx` | `Icon` 组件、`IconProps` 与尺寸档 `IconSize`。 |
| `icon.less` | 图标的描边、颜色与对齐。颜色取 `currentColor`，随文字色走。 |
| `icon.test.tsx` | 单元用例：名字、尺寸档、无障碍名与装饰态。 |
| `index.ts` | 对外出口。 |

## 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `name` | `IconId` | 无 | 图标名，与清单一一对应；写错名字由类型拦下。 |
| `size` | `14 \| 16 \| 20 \| 24` | `16` | 尺寸档。产品默认 16。 |
| `label` | `string` | 无 | 有语义时传它，图标成为 `role="img"` 并带可访问名；纯装饰不传，图标对读屏隐藏。 |
| `className` | `string` | 无 | 追加类名。 |

## 使用方式

```tsx
<Icon name="i-inbox" size={16} />
<Icon name="i-inbox" size={16} label={t('shell.navigation.item.inbox')} />
```

## 验证方式

单元用例与组件同目录：`icon.test.tsx`。图标集合与雪碧图的一致性由 `pnpm check` 的生成物检查核对。

## 已知限制

- 只有 24 网格的描边图标；品牌标识用 `components/base/brand-mark`，两者不混用。
