# components/base/spinner

`components/base/spinner` is the loading indicator. Two quarter arcs 180 degrees apart draw a directional
ring; one turn takes `--duration-loop`. It honours `prefers-reduced-motion` and stops completely when the
preference asks for less motion.

Buttons and text fields use it for their loading state, and waiting areas inside pages can use it too.

## Contents

| File | Contents |
| --- | --- |
| `spinner.tsx` | The `Spinner` component, no props. |
| `spinner.less` | Size, colour and the rotation; stops when motion is reduced. |
| `spinner.test.tsx` | Unit tests. |
| `index.ts` | The module's public surface. |

## Props

`Spinner` takes no props. Size and colour come from the parent: it is `--spacing-16` square and uses
`currentColor`, so a larger spinner needs a wrapper, and a different speed needs `--spinner-duration`.

## Usage

```tsx
<Button loading>{t('auth.action.login')}</Button>
```

## Accessibility

- The indicator itself is hidden from screen readers. The control that hosts it expresses the loading state,
  for example `aria-busy="true"` on a button.

## Verification

Unit tests sit next to the component: `spinner.test.tsx`.

## Known limits

- One shape only. Percentage-style progress indicators are added when a screen needs one.
