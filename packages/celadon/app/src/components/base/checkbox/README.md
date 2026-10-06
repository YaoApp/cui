# components/base/checkbox

`components/base/checkbox` is the product's independent choice control. It wraps Base UI's Checkbox and
renders a hidden native `<input type="checkbox">`; the visible square, the tick and the bar are decoration. It
is used for terms, per-item choices and a select-all control that needs an indeterminate state.

## Contents

| File | Contents |
| --- | --- |
| `checkbox.tsx` | The `Checkbox` component and `CheckboxProps`. |
| `checkbox.less` | The self-contained `.checkbox*` classes: the box, the tick and the bar, the label, the hover surface, the states and the three size steps. |
| `checkbox.test.tsx` | Unit tests for label association, callbacks, keyboard, checked and mixed state, disabled, read-only, messages, sizes, the mark and the no-label case. |
| `index.ts` | The module's public surface, namely `Checkbox` and `CheckboxProps`. |

## Structure and classes

| Part | Classes | Notes |
| --- | --- | --- |
| Field | `.checkbox` | Adds `checkbox--small` / `checkbox--large`, `is-error` when `error` is given, and `is-<state>` for the static state. The static state lives here because the hover surface is painted on the whole row. |
| Row | `.checkbox__row` | Holds the box, the label and the hover surface. |
| Box | `.checkbox__box` | The Base UI root. It contains the hidden native checkbox and the `.checkbox__mark` indicator. Checked exposes `data-checked`, indeterminate exposes `data-indeterminate`, disabled `data-disabled`, read-only `data-readonly`. |
| Mark | `.checkbox__mark` | The check box's indicator; holds the tick icon, or `.checkbox__dash` while indeterminate. Decorative. |
| Label | `.checkbox__label` | `id="{id}-label"` and `htmlFor={id}`; rendered only when `label` is given. |
| Messages | `.checkbox__message` → `.checkbox__hint`, `.checkbox__error` | Rendered only when `hint` or `error` is given. |

## Props

`CheckboxProps` does not extend the native input attributes; the component's own props are:

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` | required | The label id `{id}-label` and the message ids `{id}-hint` and `{id}-error` are built from it. |
| `label` | `ReactNode` | none | Clicking the label toggles the control. |
| `hint` | `ReactNode` | none | Hint below the field, linked through `aria-describedby`. |
| `error` | `ReactNode` | none | Error text below the field, linked through `aria-describedby`; the field also takes `is-error`. |
| `checked` | `boolean` | none | Controlled value. |
| `defaultChecked` | `boolean` | none | Initial value for an uncontrolled control. |
| `onCheckedChange` | `(checked: boolean) => void` | none | Reports the new value. |
| `indeterminate` | `boolean` | none | Mixed state; the mark becomes a bar. |
| `disabled` | `boolean` | none | Blocks interaction. |
| `readOnly` | `boolean` | none | Focusable and readable, but unchanged by interaction. |
| `required` | `boolean` | none | Form validation. |
| `name` | `string` | none | Form field name. |
| `value` | `string` | none | Form value submitted when checked. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Box 12 / 16 / 20 and row 24 / 32 / 40, on the same ladder as the button, the input and the select trigger. |
| `state` | `'hover' \| 'focus' \| 'error' \| 'loading'` | none | Static state class on the row container for side-by-side display. |
| `className` | `string` | none | Extra class on `.checkbox`. |

## States

| State | How it is expressed |
| --- | --- |
| Unchecked | No background; the boundary is `--border-control-strong` against the content background, measured 3.45:1 in the light theme and 3.74:1 in the dark theme. |
| Checked | Background and boundary `--background-inverse`, mark `--text-inverse`. The checked colour is deliberately not the brand colour. |
| Indeterminate | Same paint as checked, and the tick is replaced by a `.checkbox__dash` bar. |
| Hover | The whole row gets a `--background-hover` surface, painted on `.checkbox__row::before`; the label moves to `--text-primary`; the box itself does not change. The surface is inset by `--spacing-8` inline and `--spacing-4` block so it does not touch the content. |
| Focus | `box-shadow: var(--focus-ring)`, or `--focus-ring-inverse` while checked, through `:focus-visible` only; a mouse click does not leave a ring. |
| Disabled | `aria-disabled="true"`, `data-disabled` and `tabindex="-1"`; disabled background, text and boundary, with `cursor: not-allowed`. |
| Read-only | `aria-readonly="true"`; focusable and readable, but the hover surface, boundary and label colour stay at rest. |
| Error | `is-error` on the field and boundary `--danger`, plus `.checkbox__error` text. The box background does not change. |
| Loading | `state="loading"`, `aria-busy="true"` and `cursor: progress` on the box. |

Hover and focus are frequent micro-interactions and are not animated: the measured `transition-duration` is
`0s` for both the box and the label. Only the tick and the bar have a one-off entrance, which is the `fade`
scene of the motion rules and runs for 0.2s with the decelerate easing. The error is a sustained state that
belongs to the caller: the component paints the red boundary and the message, and the caller clears them.

## Sizes

| Size | Box | Row minimum | Label minimum | Font size |
| --- | --- | --- | --- | --- |
| `small` | 12 | 24 | 24 | 12 |
| `medium` | 16 | 32 | 32 | 14 |
| `large` | 20 | 40 | 40 | 16 |

The box sizes 12 / 16 / 20 and the row heights 24 / 32 / 40 are measured in the browser case, together with
the label height and the font size. The box radius is `--radius-xs` and does not follow the size step. The
tick uses the icon ladder, 14 in the medium step and 16 in the large step; the small step lets the mark fill
the 12 px box, because the smallest icon step is larger than the box. The bar is 8 wide and twice the border
width high. A multi-line label wraps below the box and the box stays aligned with the first line, not with the
centre of the whole block.

## Accessibility

- `id` is required. It lands on the hidden native checkbox, and the box carries
  `aria-labelledby="{id}-label"`. The label element must carry that id, and it does, otherwise the control has
  no accessible name.
- The label also has `htmlFor={id}`, so clicking the label toggles the control.
- Disabled is `aria-disabled="true"` plus `data-disabled` plus `tabindex="-1"`, not the native `disabled`
  attribute.
- Read-only is `aria-readonly="true"`.
- The mixed state is `aria-checked="mixed"`.
- Hint and error are linked through `aria-describedby`, with the ids `{id}-hint` and `{id}-error`. The message
  container is rendered only when at least one of them exists.
- Space toggles the focused control; Tab moves the focus.
- The mark, namely the tick or the bar, is decorative and stays out of the accessibility tree.

## Classes and tokens

The classes are self-contained under `.checkbox*` and do not borrow the input's classes; the two share only
the same token set. The checked and indeterminate states use the inverse family, `--background-inverse` and
`--text-inverse`, so the dark theme flips to a light fill with a dark mark. The unchecked boundary is
`--border-control-strong`, and the failure boundary is `--danger`. The hover surface is `--background-hover`,
the focus ring is `--focus-ring` or `--focus-ring-inverse`, and the disabled state uses
`--background-disabled`, `--text-disabled` and `--border-disabled`. The hover surface is painted on the row's
`::before` pseudo-element so the box and the label do not move and the component adds no margin.

## Usage

```tsx
import { Checkbox } from '@/components/base'

<Checkbox id="updates" label="Send me updates" checked={updatesOn} onCheckedChange={setUpdatesOn} />
```

The sample page groups checkboxes by props, states and sizes in
`app/src/features/scaffold/base/base.tsx`, and the page is served at `/app/scaffold/base`.

## Verification

```bash
pnpm lint        # stylelint, eslint and tsc
pnpm check       # token, i18n and convention checkers
pnpm test        # unit tests, including checkbox.test.tsx
pnpm build       # production build
pnpm exec playwright test app/src/features/scaffold/base/tests/   # browser cases for the sample page
```

The browser case measures both themes: the unchecked boundary against the content background is at least 3:1,
the checked paint equals the inverse tokens, the mixed state draws the bar, the hover surface moves to the
background hover token while the box stays identical, the read-only row has no hover, the multi-line box is
aligned with the first line, the transitions are 0s, the mark animation is the 0.2s fade scene, and the three
size steps measure 12 / 16 / 20 for the box and 24 / 32 / 40 for the row.

## Known limitations

- There is no `inverse` prop. The inverse family is already the checked colour, so there is no separate inverse
  form.
- There is no icon slot. The mark is always the tick, or the bar while indeterminate.
- The error is a node, and the component only paints it. Clearing it after the user changes the value belongs
  to the caller.
- `state` covers `hover`, `focus`, `error` and `loading` for static display only. Checked, indeterminate,
  disabled and read-only use the real props.
- The component is a checkbox only; it is not a radio group or a switch.
