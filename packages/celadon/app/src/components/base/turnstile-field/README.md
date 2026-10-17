# components/base/turnstile-field

`components/base/turnstile-field` is the human verification control, backed by Cloudflare Turnstile. Script
loading, mounting and token hand-back live in one place, so the caller receives a token and never touches the
script or any global object.

Use it on entry forms that require human verification. Image captchas have their own component in
`components/base/captcha-field`.

## Contents

| File | Contents |
| --- | --- |
| `turnstile-field.tsx` | The `TurnstileField` component and `TurnstileFieldProps`. |
| `turnstile-field.less` | The control area, the error state and the placeholder. |
| `turnstile-field.test.tsx` | Unit tests: script loading, token hand-back, error state. |
| `index.ts` | The module's public surface. |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `sitekey` | `string` | none | The site key, taken from the entry configuration. |
| `onTokenChange` | `(token: string) => void` | none | Called with the token; an expired or failed challenge passes an empty string. |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Theme of the widget. |
| `label` | `string` | none | Accessible name of this block. |
| `error` | `string` | none | Error text; passing it puts the control into its error state. |
| `className` | `string` | none | Extra class names. |

## Usage

```tsx
<TurnstileField
  sitekey={config.turnstileSitekey}
  onTokenChange={setToken}
  label={t('auth.captcha.label')}
  error={captchaError}
/>
```

## Accessibility

- The third-party widget brings its own focus behaviour; do not move focus elsewhere when the dialog opens
  (the rule is in `design/layout.md` section six).

## Verification

Unit tests sit next to the component: `turnstile-field.test.tsx`.

## Known limits

- Turnstile only; another provider needs a new base component.
