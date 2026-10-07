# components/base/input

`components/base/input` is the product's text field. It composes Base UI's Field and Input, so label
association, the controlled value, disabled and form participation are the native ones, and it renders the
`.field` frame around the `.input` control. Username, email, password and numeric fields all use it and are
told apart by `type` and the caller's validation rules.

## Contents

| File | Contents |
| --- | --- |
| `input.tsx` | The `Input` component and `InputProps`. |
| `input.less` | The `.field` frame and its slots, the `.input` control with its states and three size steps, and the `.hint-error` text. |
| `input.test.tsx` | Unit tests for label and message association, callbacks, disabled, the shake trigger, size classes, slots and the static states. |
| `index.ts` | The module's public surface, namely `Input` and `InputProps`. |

## Structure and classes

The control is a real `<input>` carrying `.input`, so the design rules apply to the control itself rather than
to the frame. The frame is `.field`, with an optional `.field__label`, a `.field__box` that holds the icon
slot, the control and the trailing slot, and an always-present `.field__message` that holds the hint and the
error when they are given.

| Part | Classes | Notes |
| --- | --- | --- |
| Frame | `.field` | `Field.Root`; carries `className` from the caller and `disabled` / `invalid` state. |
| Label | `.field__label` | `Field.Label` with `htmlFor={id}`; rendered only when `label` is given. |
| Box | `.field__box` | Adds `is-error` when `error` is given. |
| Icon slot | `.field__icon` | `aria-hidden="true"`; rendered only when `icon` is given. |
| Control | `.input` | Adds `input--small` / `input--large`, `is-error`, `is-<state>` and `is-shake`. |
| Trailing slot | `.field__trail` | Holds `.spinner` while `state="loading"` and no `trailing` is given, otherwise the caller's `trailing`. |
| Messages | `.field__message` → `.field__hint`, `.hint-error` | The message container is always rendered and is empty when there is neither a hint nor an error. |

## Props

`InputProps` extends `Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>`. The native `size` attribute is
omitted because this component's `size` is the size step, which is a different meaning. `value`, `onChange`,
`type`, `placeholder`, `disabled`, `readOnly` and the rest pass through. The component's own props are:

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` | required | The label's `htmlFor`, the hint id `{id}-hint` and the error id `{id}-error` are all built from it. |
| `label` | `string` | none | Field label. |
| `hint` | `string` | none | Hint below the field, linked through `aria-describedby`. |
| `error` | `string` | none | Error text below the field, linked through `aria-describedby`; also marks the box and the control with `is-error`. |
| `icon` | `ReactNode` | none | Left slot, rendered as decoration. |
| `trailing` | `ReactNode` | none | Right slot, for example a password visibility toggle. |
| `className` | `string` | none | Extra class on `.field`. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Control height 24 / 32 / 40, on the same ladder as the button, the select trigger and the checkbox. |
| `state` | `'hover' \| 'focus' \| 'error' \| 'loading'` | none | Static state class for side-by-side display. Real interaction is still driven by the CSS pseudo-classes. |
| `shake` | `boolean \| number` | none | One-off error shake. A counter replays it on every change, so the caller does not have to reset a boolean. |
| `strong` | `boolean` | `false` | Takes the compliant control boundary `--border-control-strong` instead of the lighter default. Entry screens (sign-in, registration, server selection) use it: measured 3.45:1 in the light theme and 3.74:1 in the dark theme, both above the 3:1 the control boundary needs. |

## States

| State | How it is expressed |
| --- | --- |
| Default | `--background-field`, `--border-control` and `--text-primary`. |
| Hover | Border `--border-hover`, through `:hover` or `.is-hover`. |
| Focus | Border `--brand`, a 1px `--brand` ring and background `--background-field-focus`, through `:focus` or `.is-focus`. |
| Disabled | The real `disabled` attribute; `--background-disabled`, `--text-disabled` and `--border-disabled`, with `cursor: not-allowed`. |
| Error | `--danger` border, a `--danger` focus ring, `is-error` on the control and the box, and `.hint-error` text in `--danger-ink`. Hover and focus do not change the dangerous border. |
| Loading | `aria-busy="true"`, `cursor: progress` and a `.spinner` in the right slot. The background, text colour and clipping are unchanged. |
| Empty | The native `placeholder`, drawn in `--text-placeholder`; the sample also covers an empty value. |
| Read-only | The native `read-only` attribute, `--background-readonly` and `--text-secondary`. |
| Shake | `.is-shake` plays a one-off horizontal translation. It is off by default and only runs when the caller passes `shake`. |

Errors are a sustained state: as long as the error text is present, hover and focus keep the dangerous border
and the focus ring takes the dangerous colour rather than the brand colour.

## Sizes

| Size | Height | Line height | Font size | Radius | Inline padding |
| --- | --- | --- | --- | --- | --- |
| `small` | 24 | 20 | 12 | `--radius-small` | 8 |
| `medium` | 32 | 24 | 14 | `--radius-medium` | 8 |
| `large` | 40 | 24 | 16 | `--radius-large` | 12 |

The heights 24 / 32 / 40 are measured in the browser case, and the line heights 20 / 24 / 24 come from the
control line-height tokens. The whole height
comes from `min-block-size` with zero block padding, and the line height is the integer control line height, so
the text box never lands on a fractional position. The radius follows the rule of taking the token with the
same name as the step. When an icon or a trailing slot is present the control gives that side a
`--spacing-32` inline padding so the text does not run under the slot.

The position and the size of the leading icon slot belong to the component, not to the caller: the icon is 16 at
every step (the set is drawn on a 24 grid), the slot is a box whose edge equals the icon, and its distance from
the left edge of the field box equals the icon's own top and bottom clearance, that is half of "step height minus
icon height", which gives 4 · 8 · 12; a gap of 6 then separates the icon from the text. Whatever the caller
passes (an SVG with fixed attributes or an `<img>` with its own width) is normalised to 16. The three steps and
the seven states measure: icons of 16×16, a left edge and a top clearance of 4, 8 and 12, an icon centre that
matches the box centre, and text starting at 27, 31 and 35 from the left edge (a 1px border plus the left
clearance, the icon and the gap of 6). A `size` passed by the caller therefore affects only the icon the caller
renders, never the slot.

## Accessibility

- `id` is required. The label is associated with `htmlFor={id}`, and the control receives
  `aria-describedby="<id>-hint <id>-error"` with whichever of the two exist, hint first.
- The error is a server-side message rather than a native validation result, so `Field.Error` is rendered with
  `match={Boolean(error)}`.
- The icon slot is `aria-hidden="true"` and the loading indicator is decoration; the busy state is expressed by
  `aria-busy="true"` on the control.
- `disabled` and `readOnly` are passed to the native control.
- The `state` prop is for static display only and does not change focus or value.

## Classes and tokens

`.field` and `.input` are defined in `input/input.less`. They take every colour, spacing, radius, font size and
line height from the token set, for example `--background-field`, `--background-field-focus`,
`--background-readonly`, `--background-disabled`, `--border-control`, `--border-hover`, `--brand`, `--danger`,
`--danger-ink`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-placeholder`,
`--text-disabled` and `--focus-ring`. The loading ring is the shared `.spinner`. The number input has its
native stepper removed, because the browser draws it and it does not follow the theme. The compliant boundary
of `--border-control-strong` is applied automatically when the system asks for more contrast.

## Usage

```tsx
import { Input } from '@/components/base'

<Input
  id="account"
  label="Account"
  hint="Use an email address"
  error={error}
  value={account}
  onChange={(event) => setAccount(event.target.value)}
  shake={attempt}
/>
```

The sample page groups inputs by props, states, messages, types and sizes in
`app/src/features/scaffold/base/base.tsx`, and the page is served at `/app/scaffold/base`.

## Verification

```bash
pnpm lint        # stylelint, eslint and tsc
pnpm check       # token, i18n and convention checkers
pnpm test        # unit tests, including input.test.tsx
pnpm build       # production build
pnpm exec playwright test app/src/features/scaffold/base/tests/   # browser cases for the sample page
```

The browser case measures the three heights 24 / 32 / 40, the seven state samples, the hint and error
association and their equal gap to the box, the loading ring and the unchanged paint of a loading field.

## Known limitations

- There is no `variant` prop. The plain and inverse field classes exist in `input.less`, but the `Input`
  component does not expose them.
- The strong boundary is opt-in through `strong`; the media query in `tokens.less` raises it further when the
  system asks for more contrast.
- The message container is always rendered but does not reserve a row. Fields with and without messages are
  grouped separately instead of being aligned by an empty placeholder.
- `label`, `hint` and `error` are strings. The component does not accept a node.
- `shake` only plays the animation. Deciding when a value is invalid belongs to the caller.
