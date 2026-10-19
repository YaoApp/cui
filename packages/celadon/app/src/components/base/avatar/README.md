# components/base/avatar

`components/base/avatar` renders an account avatar: the photo when there is one, otherwise the first
letter of the name on a solid brand background with the inverse text colour. A team account gets a
smaller team badge stacked on the bottom right.

It is presentational only: it knows nothing about accounts, teams or requests.

## Contents

| File | Contents |
| --- | --- |
| `avatar.tsx` | The `Avatar` component, `AvatarProps`, `AvatarSize` and `AvatarTeam`. |
| `avatar.less` | Sizes, brand background, team badge and the loading pulse. |
| `avatar.test.tsx` | Unit tests: initials, CJK names, image fallback, team badge, loading, labelling. |
| `index.ts` | Public exports. |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `name` | `string` | none | Display name; the first character is used, `U` when empty. |
| `src` | `string` | none | Photo URL; a failed load falls back to the initial. |
| `size` | `16 \| 24 \| 32 \| 64` | `32` | 16 for an inline icon slot, 24 for compact rows, 32 for the menu and the navigation footer, 64 for the profile page. |
| `team` | `{ name: string }` | none | Draws the 16 (32 avatar) or 24 (64 avatar) badge with the team initial. The 16 size has no room for it. |
| `loading` | `boolean` | `false` | Draws a same-size skeleton instead of the initial. |
| `label` | `string` | none | Accessible name; without it the avatar is decorative. |
| `className` | `string` | none | Appended to the root class. |

## Usage

```tsx
<Avatar name="Mock OAuth User" team={{ name: 'Administrator Team' }} />
<Avatar name="Mock OAuth User" src={profile.avatar} size={64} label="Mock OAuth User" />
```

## Accessibility

- Without `label` the avatar is `aria-hidden`; the visible name next to it carries the meaning.
- With `label` it becomes `role="img"` with that name; use this on the profile page.
- The team badge is decorative: the team name is always written next to it or in the team row.

## Conventions

- Colours come from tokens only: `--brand`, `--brand-text`, `--brand-soft`, `--brand-ink`.
- The badge ring is two border widths of `--background-surface`, so the two circles stay visually separate.
- The initial and the badge letter use `--line-height-none` (1); with a 20px line box the glyph sits 4px low in a 16px badge, for Latin and CJK alike.
- No literal sizes: the four steps use `--spacing-16`, `--spacing-24`, `--spacing-32` and twice `--spacing-32`.

## Verification

Unit tests sit next to the component: `avatar.test.tsx`.
