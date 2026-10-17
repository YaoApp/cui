# components/base/icon

`components/base/icon` renders interface icons. The artwork comes from the repository sprite, whose source is
`design/icons/manifest.json` and which is assembled by `node scripts/build-icons.mjs`; the component scales
a 24-unit grid to five sizes and keeps the stroke consistent.

Every icon in the interface uses this component. Do not hand-draw `<svg>` and do not put icon paths in
components.

## Contents

| File | Contents |
| --- | --- |
| `icon.tsx` | The `Icon` component, `IconProps` and the size step type `IconSize`. |
| `icon.less` | Stroke, colour and alignment. Colour is `currentColor`, so it follows the text colour. |
| `icon.test.tsx` | Unit tests: name, size step, accessible name and decorative mode. |
| `index.ts` | The module's public surface. |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `name` | `IconId` | none | The icon name, one to one with the manifest; a wrong name is caught by the type. |
| `size` | `14 \| 16 \| 18 \| 20 \| 24` | `16` | Size step. 16 is the product default; navigation entries pass 18. |
| `label` | `string` | none | Pass it when the icon carries meaning: the icon becomes `role="img"` with an accessible name. Leave it out for decoration and the icon is hidden from screen readers. |
| `className` | `string` | none | Extra class names. |

## Usage

```tsx
<Icon name="i-inbox" size={16} />
<Icon name="i-inbox" size={16} label={t('shell.navigation.item.inbox')} />
```

## Verification

Unit tests sit next to the component: `icon.test.tsx`. The consistency between the icon set and the sprite is
checked by the generated-file check inside `pnpm check`.

## Known limits

- Stroke icons on a 24-unit grid only. Brand marks use `components/base/brand-mark`, and the two are never
  mixed.
