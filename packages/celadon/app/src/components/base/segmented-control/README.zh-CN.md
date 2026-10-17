# components/base/segmented-control

`components/base/segmented-control` 是分段选择器：一组互斥的短选项排成一段，选中项高亮。外层是一组
`role="group"`，每个选项是原生按钮并用 `aria-pressed` 表达选中，因此是一组互斥选择，而不是若干独立开关。

适合视图切换、过滤档位、二到四选一的场景。选项多于五个，或文字较长时改用 `components/base/select`。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `segmented-control.tsx` | `SegmentedControl` 组件、`SegmentedControlProps` 与 `SegmentedOption`。 |
| `segmented-control.less` | 分段底、滑块、各尺寸与状态。 |
| `segmented-control.test.tsx` | 单元用例：受控切换、禁用、键盘、无样式遗留。 |
| `index.ts` | 对外出口。 |

## 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `options` | `readonly SegmentedOption[]` | 无 | 选项。每项含 `value` 与 `label`，可选 `icon`（段内左侧图标）与 `disabled`。 |
| `value` | `string` | 无 | 当前值。受控，组件不自己存。 |
| `onValueChange` | `(value: string) => void` | 无 | 切换回调。 |
| `aria-label` | `string` | 无 | 这一组选项的名字，必填。 |
| `inverse` | `boolean` | `false` | 反色档，用于深底。 |
| `disabled` | `boolean` | `false` | 整体禁用。 |
| `state` | `'hover' \| 'focus'` | 无 | 静态态类，供并排展示。真实交互仍由 CSS 伪类驱动。 |
| `className` | `string` | 无 | 追加类名。 |

## 使用方式

```tsx
<SegmentedControl
  options={[{ value: 'light', label: t('…light') }, { value: 'dark', label: t('…dark') }]}
  value={theme}
  onValueChange={setTheme}
  aria-label={t('…theme')}
/>
```

## 无障碍

- 外层是 `role="group"` 并带 `aria-label`；每个选项是按钮，选中态用 `aria-pressed="true"` 表达。
- 左右方向键在选项间移动并直接切换选中；测试用 `getByRole('button')` 与 `toHaveAttribute('aria-pressed', 'true')`，不要用 `.selectOption()` 或 `toHaveValue()`。
- 必须给 `aria-label`，让读屏知道这一组在选什么。

## 验证方式

单元用例与组件同目录：`segmented-control.test.tsx`。

## 已知限制

- 选项由图标与文字组成；更复杂的自定义内容不在这一件里，另议。
