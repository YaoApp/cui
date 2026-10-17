# components/base/alert-dialog

`components/base/alert-dialog` is a confirmation overlay that cannot be dismissed by accident. It is built on
Base UI's AlertDialog. What separates it from `components/base/dialog`: there is no close cross, an overlay
click does not close it, and one explicit choice is required.

Use it for actions that lose work or carry consequences, such as overwriting, deleting, or leaving an
unsaved page.

## Contents

| File | Contents |
| --- | --- |
| `alert-dialog.tsx` | The `AlertDialog` component and `AlertDialogProps`. |
| `index.ts` | The module's public surface. |
| `alert-dialog.test.tsx` | Unit tests: only two exits, `Esc` counts as cancel, focus placement. |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `open` | `boolean` | none | Whether it is open. Controlled. |
| `onOpenChange` | `(open: boolean) => void` | none | Called when the open state changes; cancel and `Esc` both go through it. |
| `title` | `ReactNode` | none | The title, tied to `role="alertdialog"`. |
| `description` | `ReactNode` | none | The body: state the consequence and what cannot be undone. |
| `confirm` | `ReactNode` | none | The primary action, usually a danger or brand solid button. |
| `cancel` | `ReactNode` | none | The secondary action. |
| `className` | `string` | none | Extra class names. |
| `children` | `ReactNode` | none | Anything extra to show. |

## Usage

```tsx
<AlertDialog
  open={open}
  onOpenChange={setOpen}
  title={t('…title')}
  description={t('…description')}
  confirm={<Button variant="danger" onClick={confirm}>{t('auth.action.confirm')}</Button>}
  cancel={<Button variant="ghost" onClick={() => setOpen(false)}>{t('auth.action.cancel')}</Button>}
/>
```

## Accessibility

- The upstream part supplies `role="alertdialog"`; title and body are wired to `aria-labelledby` and
  `aria-describedby`.
- After opening, focus lands on the primary action or the body, and `Esc` counts as cancel.

## Verification

Unit tests sit next to the component: `alert-dialog.test.tsx`.

## Known limits

- Only a title, a body and two exits. When a form or more branches are needed, use `components/base/dialog`.
