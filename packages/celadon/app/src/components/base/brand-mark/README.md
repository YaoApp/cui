# components/base/brand-mark

`components/base/brand-mark` renders the brand graphics. Brand marks use the `brand-` prefixed ids and are a
separate set from interface icons: interface icons come from `components/base/icon`, brand marks from here, and
the two are never mixed.

## Contents

| File | Contents |
| --- | --- |
| `brand-mark.tsx` | The `BrandMark` component, `BrandMarkProps` and `BrandId`. |
| `brand-mark.less` | Sizing and proportional placement; the current mark carries its own colours. |
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

- The current `brand-yao-agents` uses `app/public/brand/yao-agents-ghost.svg` (v1.9, 863 × 995, proportionally fitted into the square slot); dark theme switches to the Cream body in `-dark.svg`. The old robot mark stays in `design/reference/logo-previous.svg` and the sprite, no longer as the current mark.
- The full icon series lives in `design/logo/v1.9/`, with Mark / app icon SVGs, nine PNG sizes and the specification. Only the mark is wired into the component.
- Other brand graphics still come from the sprite. Register a new graphic in `design/icons/manifest.json` first, then wire it up.
