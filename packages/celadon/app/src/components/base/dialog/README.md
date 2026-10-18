# components/base/dialog

`components/base/dialog` is the overlay page: a whole page placed in a floating layer. It builds on Base UI's
Dialog, so the focus trap, closing on `Esc`, closing on an overlay click and scroll locking are handled
upstream; this component adds two width steps and one head-and-foot structure.

Per `design/main-shell.md` section six, navigation entries appear in such an overlay (the large dialog form),
while a reference from a conversation opens a page in the third column.

## Contents

| File | Contents |
| --- | --- |
| `dialog.tsx` | The `DialogPage` component, `DialogProps`, `DialogSize` and `DialogOpenType`, plus re-exports of the upstream parts. |
| `dialog.less` | The two width steps, the height cap, and the layout of head, body and foot. |
| `dialog.test.tsx` | Unit tests: opening and closing, size steps, focus and the close key. |
| `index.ts` | The module's public surface: `DialogPage` and `DialogParts`. |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `open` | `boolean` | none | Whether it is open. Controlled. |
| `onOpenChange` | `(open: boolean) => void` | none | Called when the open state changes. |
| `onOpenChangeComplete` | `(open: boolean) => void` | none | Called after the transition ends, which suits cleanup after the close animation. |
| `title` | `ReactNode` | none | The title. |
| `description` | `ReactNode` | none | Supporting text. |
| `closeLabel` | `string` | none | Accessible name of the close key; the caller reads it from the language bundle. |
| `footer` | `ReactNode` | none | The action area at the foot. |
| `size` | `'form' \| 'page' \| 'full'` | `'form'` | Width step: the form step is 480, the page step takes the content column's readable cap, the full step fills the window with a 12 pixel margin. |
| `disablePointerDismissal` | `boolean` | `false` | When true an overlay click does not close it, for flows that must not be dismissed by accident. |
| `initialFocus` | `boolean \| RefObject \| ((openType) => …)` | none | Where focus lands after opening; third-party controls such as human verification keep focus untouched. |
| `className` | `string` | none | Extra class names. |
| `children` | `ReactNode` | none | The overlay body. |

## Usage

```tsx
<DialogPage
  open={open}
  onOpenChange={setOpen}
  title={t('auth.captcha.title')}
  closeLabel={t('modal.close')}
  size="form"
  footer={<Button onClick={submit}>{t('auth.action.confirm')}</Button>}
>
  <CaptchaField … />
</DialogPage>
```

## Accessibility

- Title and description are wired to the upstream `aria-labelledby` and `aria-describedby`; the close key must
  have an `aria-label`.
- `initialFocus` follows the content by default: it enters a text field when one exists, and leaves focus
  untouched for third-party controls.

## Verification

Unit tests sit next to the component: `dialog.test.tsx`.

## Known limits

- Two width steps only (480 and the content column's readable cap). The 880 by 620 form in
  `design/main-shell.md` section six has no matching step yet.
