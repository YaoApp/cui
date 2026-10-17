# components/base/segmented-control

`components/base/segmented-control` is a segmented selector: a set of mutually exclusive short options laid
out in one segment, with the selected one highlighted. The wrapper is a `role="group"`, each option is a
native button and selection is expressed with `aria-pressed`, so the group is one mutually exclusive choice
rather than a row of independent toggles.

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
| `options` | `readonly SegmentedOption[]` | none | The options. Each has `value` and `label`, plus an optional `icon` (drawn at the left of the segment) and `disabled`. |
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

- The wrapper is a `role="group"` with an `aria-label`; every option is a button and the selected one carries
  `aria-pressed="true"`.
- The left and right arrow keys move between options and switch the selection directly. Tests use
  `getByRole('button')` and `toHaveAttribute('aria-pressed', 'true')`, not `.selectOption()` or `toHaveValue()`.
- `aria-label` is required so screen readers know what the group selects.

## Verification

Unit tests sit next to the component: `segmented-control.test.tsx`.

## Known limits

- Options carry an icon and a label; richer custom content is not part of this component and is a separate
  decision.
