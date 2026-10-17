# components/base/brand-mark

`components/base/brand-mark` renders the brand graphics. Brand marks use the `brand-` prefixed ids and are a
separate set from interface icons: interface icons come from `components/base/icon`, brand marks from here, and
the two are never mixed.

## Contents

| File | Contents |
| --- | --- |
| `brand-mark.tsx` | The `BrandMark` component, `BrandMarkProps` and `BrandId`. |
| `brand-mark.less` | The colour of the brand graphic, `--brand-graphic`, with one value per theme. |
| `brand-mark.test.tsx` | Unit tests. |
| `index.ts` | The module's public surface. |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `name` | `BrandId`, shaped `brand-<name>` | none | The graphic name, limited to ids with the `brand-` prefix. |
| `size` | `number` | `24` | Pixel size, 16 at minimum; anything smaller uses the app icon. |
| `label` | `string` | none | Accessible name. A brand mark carries meaning, so pass it wherever the mark is semantic, such as the navigation column. |
| `className` | `string` | none | Extra class names. |

## Usage

```tsx
<BrandMark name="brand-yao-agents" size={20} label={t('app.name')} />
```

## Verification

Unit tests sit next to the component: `brand-mark.test.tsx`.

## Known limits

- Only the brand graphics registered in the manifest are supported. Register a new graphic in
  `design/icons/manifest.json` first, then wire it up.
