# components/base/captcha-field

`components/base/captcha-field` is the product's graphical captcha field. It puts an image control on the
right of the text field; the caller keeps the typed characters, the component keeps the current image and
hands its identifier back on every fetch. The fetch goes through the interface declaration `entryCaptcha`
(`GET /user/entry/captcha`) with `useRequest`, so the component neither builds the address nor carries a
credential.

## Contents

| File | Contents |
| --- | --- |
| `captcha-field.tsx` | The `CaptchaField` component and `CaptchaFieldProps`. |
| `captcha-field.less` | The `.captcha-field__control` control with its three process states, the `.captcha-field__picture` image and the `.captcha-field__retry` text. |
| `captcha-field.test.tsx` | Unit tests for label association, the accessible name of the control, the value callback, disabled, the caller error, the fetch states and the `captcha_id` hand-off. |
| `index.ts` | The module's public surface, namely `CaptchaField` and `CaptchaFieldProps`. |

## Structure and classes

The field frame is the shared `Input`, so the label, the hint, the error and the size steps come from there.
The captcha part is the trailing slot of that field. The slot is sized per step: three times the field
height of that step, namely 72 for `small`, 96 for `medium` and 120 for `large`. The input reserves the same
width plus one spacing step (`--spacing-8`), so the image and the typed text each keep their own place.

| Part | Classes | Notes |
| --- | --- | --- |
| Field | `.captcha-field` | Wrapper around the `Input`; carries `className` from the caller. |
| Frame | `.field`, `.field__label`, `.field__box`, `.field__message` | Rendered by `Input`; the error and the hint are linked through `aria-describedby`. |
| Control | `.captcha-field__control` | A native `<button type="button">` in the trailing slot; its `aria-label` is `refreshLabel`. |
| Picture | `.captcha-field__picture` | An `<img>` with `src={captcha_image}` and `alt={imageAlt}`; shown once the fetch returns. |
| Retry | `.captcha-field__retry` | The text inside the control when the fetch fails; clicking it fetches again. |

The image fills the trailing slot width (`inline-size: 100%`) and its height follows the image ratio
(`block-size: auto`). The backend image is about 3:1, so the picture measures 72 wide by 24 high, 96 by 32
and 120 by 40 across the three steps, and a swap does not change the field geometry.

## Props

`CaptchaFieldProps` is a discrete prop type; it does not extend the native input attributes. The
component's own props are:

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` | required | The input id; the label's `htmlFor`, the hint id `{id}-hint` and the error id `{id}-error` are built from it. |
| `value` | `string` | required | The characters the user typed. |
| `onValueChange` | `(value: string) => void` | required | Called on every keystroke. |
| `onCaptchaIdChange` | `(captchaId: string) => void` | none | Called with the new `captcha_id` after every successful fetch. |
| `label` | `string` | none | Field label. |
| `placeholder` | `string` | none | Placeholder inside the input. |
| `hint` | `string` | none | Hint below the field, linked through `aria-describedby`. |
| `error` | `string` | none | The caller's error text, linked through `aria-describedby`. |
| `disabled` | `boolean` | `false` | Disables the input and the refresh control. |
| `required` | `boolean` | `false` | Marks the input as required. |
| `name` | `string` | none | The input's form name. |
| `autoComplete` | `string` | `'off'` | The input's `autocomplete`; off by default because a captcha is never reused. |
| `size` | `'small' \| 'medium' \| 'large'` | none | Size step passed to the field; field height 24 / 32 / 40 and trailing slot 72 / 96 / 120. |
| `strong` | `boolean` | `false` | Passed to the input: takes the compliant control boundary `--border-control-strong`. Entry screens use it. |
| `className` | `string` | none | Extra class on `.captcha-field`. |
| `refreshLabel` | `string` | none | The control's accessible name and, on failure, its visible retry text. Four languages are supplied by the caller. |
| `imageAlt` | `string` | none | The image's alternative text. Four languages are supplied by the caller; an empty string makes the image decorative. |

## Process states

One image has three states, and all three live in the same control:

| State | `state.status` | What the control shows | What the field shows |
| --- | --- | --- | --- |
| Loading | `'loading'` | The shared `.spinner`. | `aria-busy="true"` and `cursor: progress`; background, text colour and clipping are unchanged. |
| Returned | `'ok'` | The `.captcha-field__picture` image. | Nothing extra. |
| Failed | `'error'` | The `.captcha-field__retry` text; clicking it fetches again. | The failure text is the field error, unless the caller passed an `error` of its own. |

The fetch runs once on mount. Every click on the control runs it again, and each success hands the new
`captcha_id` to `onCaptchaIdChange`.

## Sizes

| Size | Field height | Trailing slot | Picture (width × height) |
| --- | --- | --- | --- |
| `small` | 24 | 72 | 72 × 24 |
| `medium` | 32 | 96 | 96 × 32 |
| `large` | 40 | 120 | 120 × 40 |

The three heights come from the shared field ladder, which the button, the input, the select trigger and
the checkbox also use. The trailing slot is three times the field height of the same step, and the input
reserves the slot width plus one spacing step (`--spacing-8`). The picture fills the slot width
(`inline-size: 100%`) and its height follows the image ratio (`block-size: auto`). The large step is written
as `calc(var(--spacing-32) * 3 + var(--spacing-8) * 3)`, because the spacing ladder has no 40 step and the
control height at that step is written as 32 plus 8.

## Accessibility

- `id` is required. The label is associated with `htmlFor={id}`, and the input receives
  `aria-describedby="<id>-hint <id>-error"` with whichever of the two exist, hint first.
- The control carries `aria-label={refreshLabel}`, so it has an accessible name in every process state.
- The image `alt` is `imageAlt`, or an empty string when it is not given, which marks the image as
  decoration.
- The control is a native `<button type="button">`. It is reachable by Tab and activated with Enter or
  Space, and `type="button"` keeps it from submitting the surrounding form.
- While the fetch is running, the field is marked `aria-busy="true"`; the spinner itself is decoration.
- `disabled` is passed to both the input and the control, so a disabled field cannot be refreshed.
- The caller's `error` wins over the component's failure text, so the field never shows two messages.

## Classes and tokens

`.captcha-field__control`, `.captcha-field__picture` and `.captcha-field__retry` are defined in
`captcha-field.less`. They take colour, spacing, radius, font size and line height from the token set:
`--text-secondary`, `--text-disabled`, `--focus-ring`, `--radius-xs`, `--font-size-caption`,
`--line-height-tight`, `--spacing-8`, `--spacing-24` and `--spacing-32`. The frame and the size steps come
from the shared field classes in `input/input.less`.

## Usage

```tsx
import { useState } from 'react'
import { Button, CaptchaField } from '@/components/base'
import { useTranslation } from '@/platform/i18n'

const { t } = useTranslation()
const [captcha, setCaptcha] = useState('')
const [captchaId, setCaptchaId] = useState('')

<form onSubmit={(event) => {
  event.preventDefault()
  // captcha_id travels beside the typed characters, under the name the service reads.
  void verify({ username, captcha, captcha_id: captchaId })
}}>
  <CaptchaField
    id="captcha"
    label={t('login.captcha.label')}
    placeholder={t('login.captcha.placeholder')}
    refreshLabel={t('login.captcha.refresh')}
    imageAlt={t('login.captcha.image')}
    value={captcha}
    onValueChange={setCaptcha}
    onCaptchaIdChange={setCaptchaId}
    error={error}
  />
  <Button type="submit">{t('login.submit')}</Button>
</form>
```

The sample page groups the field by props and sizes in
`app/src/features/scaffold/base/base.tsx`, and the page is served at `/app/scaffold/base`.

## Verification

```bash
pnpm lint        # stylelint, eslint and tsc
pnpm check       # token, i18n and convention checkers
pnpm test        # unit tests, including captcha-field.test.tsx
pnpm build       # production build
pnpm exec playwright test app/src/features/scaffold/base/tests/   # browser cases for the sample page
```

The unit cases mock the platform transport and therefore exercise the real `send` path. The sample page
fetches from the running service, so the browser cases do not assert that an image is present.

## Known limitations

- `GET /user/entry/captcha` accepts an optional `captcha_id` that returns the next state of the same
  image. This version does not use it: every refresh fetches a new image.
- `refreshLabel` and `imageAlt` are strings supplied by the caller. Without `refreshLabel` the control has
  no accessible name, and without `imageAlt` the image is decorative.
- `label`, `placeholder`, `hint` and `error` are strings; the component does not accept a node.
- The fetch runs on mount even when `disabled` is set. The disabled control cannot be clicked, but the
  first image is still requested.
- The component only reports the failure and offers a retry. Deciding what a wrong captcha means, and when
  to clear the error, belongs to the caller.
- The trailing slot width is a fixed value derived from an image at about 3:1. If the backend changes the
  image ratio, the picture grows or shrinks with it and the slot does not follow.
