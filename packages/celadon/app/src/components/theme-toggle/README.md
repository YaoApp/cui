# `components/theme-toggle`

A single icon button that switches between the light and the dark theme. It is a platform control, not a base
component: it reads a resolved theme and reports which theme the next click should apply, so the caller keeps
the store and the persistence. The form follows the tool bar of the sign-in prototype: an icon-only plain
button whose icon states the action.

## Contents

| Path | Role |
| --- | --- |
| `theme-toggle.tsx` | The component and its props. |
| `theme-toggle.test.tsx` | Unit cases: icon inversion, accessible name, click target, size step. |
| `index.ts` | Re-exports the component and its props type. |

## Structure and class names

```
.button.button--{size}.button--plain.button--icon.theme-toggle
└── svg.icon            the moon or the sun
```

`.theme-toggle` is the only class this component owns; the look comes from the button's plain variant, so the
component ships no stylesheet of its own.

## Props

| Prop | Type | Default | Meaning |
| --- | --- | --- | --- |
| `theme` | `'light' \| 'dark'` | required | The theme in effect now. |
| `onSelect` | `(theme: Theme) => void` | required | Called with the opposite theme when clicked. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Square step, 24 / 32 / 40. |

The component takes no `className` and no children: one icon button, one purpose.

## Behaviour

The icon is **inverted**: it shows the theme the click switches to, not the theme in effect. With a light
theme the button paints the moon, with a dark theme the sun. Measured in the gallery: theme `light` with
`#i-moon`, after the click theme `dark` with `#i-sun`.

The accessible name is the action as well, so a screen reader announces what pressing the button will do.
The two strings live in the shared language pack as `themeToggle.switchToLight` and `themeToggle.switchToDark`
(「切换到浅色」 and 「切换到深色」), not in this directory, because the control is used on the home page, the
overview and the scaffold.

## Sizes and measured values

| Step | Button box | Icon |
| --- | --- | --- |
| `small` | 24 × 24 | 16 |
| `medium` | 32 × 32 | 16 |
| `large` | 40 × 40 | 20 |

The icon follows the icon ladder rather than the font size, as everywhere else. The button is square because
`iconOnly` sets one side and zero horizontal padding; callers must pass `aria-label`, which this component
always does.

## States

| State | Appearance |
| --- | --- |
| Default | No surface, no border, text-secondary icon. |
| Hover | `--background-hover` surface, text-primary icon. |
| Focus (keyboard) | `--focus-ring` around the button; a pointer click paints no ring. |
| Disabled | Not exposed: a caller that cannot switch themes simply does not render the button. |
| Loading | Not exposed. |

## Accessibility

The button is a native `<button>` with an `aria-label` that names the action, so it needs no `aria-pressed`
and no tooltip. It is keyboard reachable and shows a focus ring only for keyboard focus. `iconOnly` marks it
as an icon-only button for styling; the label carries the meaning.

## Classes and tokens

| Where | What |
| --- | --- |
| `.theme-toggle` | The component's own hook; no rules of its own today. |
| `.button--plain` | Surface, hover surface, focus ring, disabled colour. |
| `.button--icon` | Square box and icon size per step. |
| `--background-hover`, `--focus-ring`, `--text-secondary`, `--text-primary` | The colours the plain variant reads. |

## Usage

```tsx
const { theme, setTheme } = useThemePreference()

<ThemeToggle theme={theme} onSelect={setTheme} />
```

`useThemePreference` resolves `system` to a concrete theme and persists an explicit choice once the user makes
one. The component stays pure, so a caller that needs a different policy (for example a settings page that
offers all three preferences) can keep it.

## Verification

- `app/src/components/theme-toggle/theme-toggle.test.tsx`: icon inversion for both themes, the action name,
  the click target, the size class, and the absence of visible text.
- `app/src/features/scaffold/base/tests/base.browser.ts`: the square box and icon size, the icon matching the
  current theme inverted, and the theme actually flipping on click.

## Known limits

- The button toggles between light and dark. Returning to "follow the system" is not offered here; the initial
  default follows the system until the user makes a choice.
- The icon depends on the sprite (`i-moon`, `i-sun`); both are interface icons and are covered by the icon
  tests.
