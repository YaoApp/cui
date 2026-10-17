# components/base/drawer

`components/base/drawer` is a panel that slides in from one side of the window. It is built on Base UI's
Dialog and laid out as a drawer. It sits closer to the edge than `components/base/dialog` and suits content
you look at alongside the page, such as filters, details and settings.

## Contents

| File | Contents |
| --- | --- |
| `drawer.tsx` | The `Drawer` component and `DrawerProps`. |
| `drawer.less` | The drawer's width, edge placement, and the layout of its head and foot. |
| `index.ts` | The module's public surface. |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `open` | `boolean` | none | Whether it is open. Controlled. |
| `onOpenChange` | `(open: boolean) => void` | none | Called when the open state changes. |
| `title` | `ReactNode` | none | The title. |
| `closeLabel` | `string` | none | Accessible name of the close key; the caller reads it from the language bundle. |
| `footer` | `ReactNode` | none | The action area at the foot. |
| `side` | `'start' \| 'end'` | `'end'` | Which side it slides in from. A logical direction, so it flips in mirrored languages. |
| `initialFocus` | `boolean \| RefObject` | none | Where focus lands after opening. |
| `className` | `string` | none | Extra class names. |
| `children` | `ReactNode` | none | The drawer body. |

## Usage

```tsx
<Drawer open={open} onOpenChange={setOpen} title={t('…title')} closeLabel={t('modal.close')}>
  <Filters />
</Drawer>
```

## Accessibility

- Logical direction properties are used (`inset-inline-start` and the like), so the drawer flips in mirrored
  languages.
- The close key must have an `aria-label`; closing on `Esc` is handled upstream.

## Verification

- Width and edge placement are checked by measurement: the drawer's `getBoundingClientRect()` sits against
  the matching side of the window.

## Known limits

- One panel width only. A large dialog that matches the content column uses `components/base/dialog`.
