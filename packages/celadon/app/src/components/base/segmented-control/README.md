# components/base/segmented-control

`components/base/segmented-control` is a segmented selector: a set of mutually exclusive short options laid
out in one segment, with the selected one highlighted. It is built on Base UI's RadioGroup, so it carries
radio semantics rather than a row of independent buttons.

It suits view switching, filter levels and choices between two and four options. With more than five options
or with long labels, use `components/base/select` instead.

## Contents

| File | Contents |
| --- | --- |
| `segmented-control.tsx` | The `SegmentedControl` component, `SegmentedControlProps` and `SegmentedOption`. |
| `segmented-control.less` | The segment background, the thumb, the sizes and the states. |
| `segmented-control.test.tsx` | Unit tests: controlled switching, disabled, keyboard, no leftover styles. |
| `index.ts` | The module's public surface. |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `options` | `readonly SegmentedOption[]` | none | The options. Each has `value` and `label`. |
| `value` | `string` | none | The current value. Controlled; the component keeps no state. |
| `onValueChange` | `(value: string) => void` | none | Called when the selection changes. |
| `aria-label` | `string` | none | The name of the group. Required. |
| `inverse` | `boolean` | `false` | Inverted variant for dark backgrounds. |
| `disabled` | `boolean` | `false` | Disables the whole group. |
| `state` | `'hover' \| 'focus'` | none | Static state class for side-by-side display. Real interaction is still driven by CSS pseudo classes. |
| `className` | `string` | none | Extra class names. |

## Usage

```tsx
<SegmentedControl
  options={[{ value: 'light', label: t('…light') }, { value: 'dark', label: t('…dark') }]}
  value={theme}
  onValueChange={setTheme}
  aria-label={t('…theme')}
/>
```

## Accessibility

- Radio semantics: the arrow keys move between options. Do not use `.selectOption()` or `toHaveValue()` in
  tests.
- `aria-label` is required so screen readers know what the group selects.

## Verification

Unit tests sit next to the component: `segmented-control.test.tsx`.

## Known limits

- Options are text only; icons or richer content are a separate decision.
