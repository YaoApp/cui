# `components/base/otp-field`

A one-time code field: the code is split into one square box per digit. It is a **multi-control** field, so it
does not wrap the single-control `Field` primitive; it builds the field structure itself with the same
`.field*` classes the text input uses, which keeps the two visually identical.

## Contents

| Path | Role |
| --- | --- |
| `otp-field.tsx` | The component, its props and the keyboard, paste and focus rules. |
| `otp-field.less` | The boxes: surface, border, radius, focus ring, error, disabled and read-only. |
| `otp-field.test.tsx` | Unit cases: filling, completion, keyboard, paste, digits only, states, sizes. |
| `index.ts` | Re-exports the component and its props type. |

## Structure and class names

```
.field                                   the field column (label · boxes · message)
├── label.field__label                   points at the first box
├── .otp-field.otp-field--{size}
│   └── .otp-field__cells[role=group]    named by the label, carries aria-required
│       └── input.otp-field__cell  × N   one box per digit
├── input[type=hidden][name]             only when `name` is given
└── .field__message
    ├── p.field__hint
    └── p.hint-error
```

## Props

| Prop | Type | Default | Meaning |
| --- | --- | --- | --- |
| `id` | `string` | required | First box's id; the label and the error refer to it. Other boxes derive `${id}-2` … |
| `value` | `string` | required | The code so far: digits only, filled from the left. |
| `onValueChange` | `(value: string) => void` | required | Called on every accepted change. |
| `onComplete` | `(value: string) => void` | – | Called once, on the change that fills the last box. |
| `label` | `string` | – | Visible label; also the group's accessible name. |
| `hint` | `string` | – | Shown under the boxes. |
| `error` | `string` | – | The caller's validation error; makes the boxes invalid and shows the message. |
| `disabled` | `boolean` | `false` | Locks every box. |
| `readOnly` | `boolean` | `false` | Keeps the code readable but not editable. |
| `required` | `boolean` | `false` | `aria-required` on the group. Native validation is the caller's, through the hidden field. |
| `name` | `string` | – | Renders a hidden input carrying the whole code for form submission. |
| `length` | `number` | `6` | Number of boxes. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Step, same ladder as the input: 24 / 32 / 40. |
| `className` | `string` | – | Extra class on the field column. |
| `autoComplete` | `string` | `'one-time-code'` | Autocomplete of the first box only, so the browser can fill the code. |
| `cellLabel` | `(index: number) => string` | – | Accessible name per box; falls back to `label` plus the position. Four languages are the caller's job. |
| `state` | `'hover' \| 'focus'` | – | Static state for side-by-side samples; real interaction still runs on the pseudo-classes. |

## Behaviour

The value is a left-to-right run of digits and the boxes are a view of it, so no gaps can appear. Typing a
digit appends it, or replaces the digit already at that position. The first box carries the `id`, and clicking
an empty box further right moves the caret back to the first empty one, which keeps the run contiguous.

| Key or gesture | Result |
| --- | --- |
| Digit | Accepted, caret moves to the next box. |
| Letter or other character | Ignored; the digit already in the box stays. |
| `Backspace` / `Delete` | Clears that box and everything to its right; the caret moves one box left. |
| `ArrowLeft` / `ArrowRight` | Moves the caret. |
| `Home` / `End` | First box, or the first empty box. |
| Paste (whole code) | Digits spread from the current box, characters other than digits are dropped. |
| Autofill (several digits into one box) | Treated like a paste. |

`onComplete` fires only on the change that fills the last box, so a caller can submit without watching every
keystroke. The boxes take only digits; the code's length is fixed by `length`.

## Sizes and measured values

The boxes match the input step for step, which is the point of the ladder. Measured in the gallery next to an
input of the same step:

| Step | Box | Input height | Font | Line height |
| --- | --- | --- | --- | --- |
| `small` | 24 × 24 | 24 | 12 | 20 |
| `medium` | 32 × 32 | 32 | 14 | 24 |
| `large` | 40 × 40 | 40 | 16 | 24 |

Boxes are squares (side = the step's control height) and sit in a flex row with `--spacing-8` between them.
Radii follow the step (`--radius-small` / `--radius-medium` / `--radius-large`).

## States

| State | Appearance |
| --- | --- |
| Default | Field surface, control border, primary text. |
| Hover | `--border-hover` on the box under the pointer. |
| Focus (keyboard or click) | Brand border plus a ring in the same colour, surface lifted to the focus surface; the box content is selected so typing replaces it. |
| Error | Danger border on every box, danger ring while focused, message under the boxes. Hover and focus do not change the border colour. |
| Read-only | Read-only surface and secondary text. |
| Disabled | Disabled surface and border, disabled text, `not-allowed` pointer. |
| Empty | The same as default; the code is simply not filled yet. |
| Loading | Not offered: a code entry does not load. The submit button that uses the code carries the pending state. |

## Accessibility

The boxes live in a `role="group"` named by the visible label through `aria-labelledby`; the hint and the
error are attached with `aria-describedby`, and an error also sets `aria-invalid` on every box. Each box has
its own accessible name (the caller's `cellLabel`, or the label plus the position), so a screen reader says
which digit it is on. `inputMode="numeric"` brings up the number pad, and the first box asks the platform for
`one-time-code` autofill.

## Classes and tokens

| Where | What |
| --- | --- |
| `.otp-field__cell` | `--background-field`, `--border-control`, `--text-primary`, control line height and font size per step. |
| Focus | `--brand` for border and ring, `--background-field-focus`. |
| Error | `--danger` for border and ring. |
| Disabled / read-only | `--background-disabled`, `--border-disabled`, `--text-disabled` / `--background-readonly`, `--text-secondary`. |
| Spacing | `--spacing-8` between boxes; box side from `--spacing-24` / `--spacing-32` / `calc(--spacing-32 + --spacing-8)`. |

## Usage

```tsx
const [code, setCode] = useState('')
const [otpId, setOtpId] = useState('')

<OtpField
  id="verification-code"
  value={code}
  onValueChange={setCode}
  onComplete={(value) => verify(value, otpId)}
  label={t('auth.code.label')}
  hint={t('auth.code.hint')}
  error={error}
  name="verification_code"
  cellLabel={(index) => t('auth.code.cell', { index: index + 1 })}
/>
```

The caller owns the value, the error and the copy; the component owns the boxes and the input rules.

## Verification

- `otp-field.test.tsx`: one box per digit, label wiring, keyboard order, backspace, paste, letters ignored,
  completion fired once, error and state classes, disabled and read-only, the hidden field.
- `base.browser.ts`: the box side and height against an input of the same step at 24 / 32 / 40 with matching
  fonts, typing six digits, ignoring a letter, pasting a whole code, the hidden field, the error sample, and
  the disabled and read-only samples.

## Known limits

- Digits only. An alphanumeric code would need a different filter and a wider box.
- `required` is expressed as `aria-required` on the group; native form validation runs on the hidden field the
  caller gets with `name`.
