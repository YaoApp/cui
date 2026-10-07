# components/base/button

`components/base/button` is the product's button. It renders a native `<button>` through Base UI, so keyboard
activation, the `disabled` attribute and form participation stay native, and it paints one of eight visual
variants through the shared button design classes. Primary form actions, toolbar actions, icon-only controls and
destructive actions all use it.

## Contents

| File | Contents |
| --- | --- |
| `button.tsx` | The `Button` component and `ButtonProps`. |
| `button.less` | The design classes of the button family and the component's own layout: variants with their four states, the three size steps, the pill shape, the icon form and the loading state. |
| `button.test.tsx` | Unit tests for the variant and size classes, callbacks, disabled, keyboard activation, loading and static states. |
| `parts/label/label.tsx` | The private `Label` part. Every button's content is wrapped in `<span class="button__label">`. |
| `parts/label/index.ts` | Re-export of the `Label` part. |
| `index.ts` | The module's public surface, namely `Button` and `ButtonProps`. |

## Structure and classes

A button renders one `<button>` element. The base class is `.button` and the size class is
`.button--small`, `.button--medium` or `.button--large`. The variant contributes its own classes, and the
optional modifiers `.button--pill`, `.button--block`, `.button--icon`, `.is-loading` and `.is-hover` /
`.is-active` / `.is-focus` are added on top. The content sits in `<span class="button__label">`. While the
button is loading a `.spinner` is rendered before the label.

| Part | Classes |
| --- | --- |
| Element | `.button` plus `.button--<size>` |
| Shape | `.button--pill`; the default `rounded` shape adds no class |
| Variant | `.btn-primary.is-solid` · `.btn-primary` · `.btn-ghost` · `.btn-warn` · `.btn-success` · `.btn-danger` · `.button--inverse` · `.button--plain` |
| Modifiers | `.button--block` · `.button--icon` · `.is-loading` · `.is-hover` / `.is-active` / `.is-focus` |
| Content | `.button__label`; the loading indicator is `.spinner` |

## Props

`ButtonProps` extends the native button attributes, so `type`, `disabled`, `name`, `value`, `onClick` and the
rest pass through unchanged. Base UI's Button renders a native `<button type="button">` and exposes its state
through `data-*` attributes, so the visual classes above are the only theming layer. The component's own props
are:

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `'solid' \| 'soft' \| 'ghost' \| 'plain' \| 'warn' \| 'success' \| 'danger' \| 'inverse'` | `'soft'` | Visual variant. `solid` is the brand fill, `soft` the brand tint, `ghost` a bordered surface, `plain` a control without background or border, `warn` / `success` / `danger` outline variants, and `inverse` the dark filled form. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Control height 24 / 32 / 40. |
| `shape` | `'rounded' \| 'pill'` | `'rounded'` | `rounded` takes the radius token of the size step; `pill` takes `--radius-pill`. |
| `block` | `boolean` | `false` | Fills the row. Used for the primary action of a form. |
| `loading` | `boolean` | `false` | Disables the button, sets `aria-busy="true"` and renders the indicator. |
| `state` | `'hover' \| 'active' \| 'focus'` | none | Static state class for side-by-side display. Real interaction is still driven by the CSS pseudo-classes. |
| `iconOnly` | `boolean` | `false` | Square icon button. An `aria-label` is required. |
| `icon` | `ReactNode` | none | Icon shown next to the label. |
| `iconPosition` | `'start' \| 'end'` | `'start'` | Where the icon is placed inside `.button__label`. |
| `children` | `ReactNode` | none | The label text. Optional so that an icon-only button can omit it. |

## States

| State | How it is expressed |
| --- | --- |
| Default | The resting colours of the variant. |
| Hover | The next colour of the same family, through `:hover` or `.is-hover`. |
| Active | `transform: scale(.94)` with no colour change, through `:active` or `.is-active`. |
| Focus | `box-shadow: var(--focus-ring)`, or the variant's own ring for the semantic and inverse variants, through `:focus-visible` or `.is-focus`. |
| Disabled | The real `disabled` attribute; disabled background, text and border tokens, and `cursor: not-allowed`. |
| Loading | `disabled`, `aria-busy="true"`, `.is-loading` and a `.spinner` before the label. |

The component has no error state and no empty state. A button always carries a label or an icon; a failed
action is expressed with `variant="danger"`, which is a visual variant rather than a validation state, and an
icon-only button takes its accessible name from `aria-label`.

## Sizes

| Size | Height | Horizontal padding | Font size | Radius | Icon |
| --- | --- | --- | --- | --- | --- |
| `small` | 24 | 12 | 12 | `--radius-small` | 16 |
| `medium` | 32 | 16 | 14 | `--radius-medium` | 16 |
| `large` | 40 | 24 | 16 | `--radius-large` | 20 |

The heights 24 / 32 / 40 are derived from the spacing scale (`--spacing-24`, `--spacing-32` and `32 + 8`). A
pill keeps the same height. An icon-only button is square: its inline size equals the control height of its
step (24 / 32 / 40) and its horizontal padding is zero, so a pill icon button becomes a circle. Icon sizes
come from the icon ladder 16 / 16 / 20 and are set by the component, so a `size` passed on the `icon` element
is overridden.

## Accessibility

- Base UI renders a native `<button type="button">` and sets `data-disabled` while disabled, so activation
  with Enter and Space, the disabled attribute and form participation are the native ones.
- An icon-only button has no visible text. It must receive an `aria-label`, otherwise the button has no
  accessible name.
- `loading` also disables the button and exposes `aria-busy="true"`; the indicator itself is decoration.
- The focus ring is drawn from the token and the browser outline is removed. Keyboard focus is visible on
  every variant.
- `state` is for static display only. It changes no behaviour, and `state="focus"` does not move focus.

## Classes and tokens

The variant classes live in `button/button.less`, next to the component, and take every colour from the token
set. They use `--brand`, `--brand-soft`, `--brand-solid-hover`, `--brand-soft-hover`, `--warm`, `--success`,
`--danger`, `--danger-ink`, `--background-surface`, `--background-inverse`, `--background-inverse-hover`,
`--background-disabled`, `--text-disabled`, `--border-disabled` and the variant focus rings. The component's
own layout uses the spacing scale, the radius tokens, `--line-height-control`, `--font-size-caption` /
`--font-size-body` / `--font-size-body-lg`, and the motion tokens `--duration-fast` and `--easing-standard`.
Pressing a button is the `press` scene of the motion rules and only scales the element.

The font family is not chosen here. The browser's default stylesheet gives a native `<button>` a `font`
shorthand, so the family set on the design scope never reaches inside the button. The button root therefore
declares `font-family: inherit` to take the family from the scope. Without it, switching the language leaves
button text in the browser default family, and the primary action is the first place where that shows.

## Usage

```tsx
import { Button, Icon } from '@/components/base'

<Button variant="solid" onClick={save}>Save</Button>
<Button icon={<Icon name="i-plus" />}>New task</Button>
<Button variant="plain" iconOnly aria-label={t('actions.close')}>
  <Icon name="i-act-close" />
</Button>
```

The sample page groups buttons by props, states, sizes, icon buttons and icon with text in
`app/src/features/scaffold/base/base.tsx`, and the page is served at `/app/scaffold/base`.

## Verification

```bash
pnpm lint        # stylelint, eslint and tsc
pnpm check       # token, i18n and convention checkers
pnpm test        # unit tests, including button.test.tsx
pnpm build       # production build
pnpm exec playwright test app/src/features/scaffold/base/tests/   # browser cases for the sample page
```

The browser case measures the three heights 24 / 32 / 40, the radius tokens, the painted difference of every
variant in its default, hover, active and focus states, the `.94` press scale, the square sizes of the icon
buttons and the icon sizes 16 / 16 / 20.

## Known limitations

- There is no `error` prop. Failure is expressed with `variant="danger"`, which is a visual variant and not a
  validation state.
- There is no empty state. A button always has a label, or an icon plus an `aria-label`.
- `loading` always places the indicator before `.button__label`. There is no option for a custom loading label
  or for a trailing indicator.
- `state` covers only `hover`, `active` and `focus`. A disabled sample is produced with the real `disabled`
  prop rather than a static class.
- The `size` of the `icon` element is ignored on purpose: the component sets the icon size for each step.
