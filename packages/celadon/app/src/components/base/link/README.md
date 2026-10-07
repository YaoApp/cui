# `components/base/link`

A text link, shared by in-app and external addresses.

## Contents

| File | Contents |
| --- | --- |
| `link.tsx` | The component: renders an `<a>` by default, adds `target` and `rel` for `external`, and swaps the element through `render`. |
| `link.less` | The `.link` class with its three states (rest, hover, keyboard focus). |
| `link.test.tsx` | Unit cases: the anchor and its `href`, an external address, `render`, class merging, the click handler, and a missing `href`. |
| `index.ts` | Directory export. |

## Structure and class names

The component has no parts. It renders an anchor and puts `.link` on it; a `className` from the caller is joined
to it rather than replacing it. An element given through `render` receives the same classes and attributes, so
swapping in an application router link keeps both the look and the behaviour.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `href` | `string` | none | The target. When absent the `href` attribute is not written, so the element carries no link semantics. |
| `external` | `boolean` | `false` | Writes `target="_blank"` and `rel="noopener noreferrer"`. |
| `render` | `ReactElement \| (props, state) => ReactElement` | none | Swaps the rendered element, with the contract of the upstream `useRender`. |
| `className` | `string` | none | Joined with `.link`. |
| `children` | `ReactNode` | none | The link text. |

Every other prop (`title`, `aria-*`, event handlers) lands on the rendered element. Merging follows the
upstream `mergeProps` rules: later values win, `className` is joined, and event handlers all run in order.

## States

| State | Expression |
| --- | --- |
| Rest | Brand ink with an underline. |
| Hover | A brand soft ground appears; the colour and the underline stay. |
| Keyboard focus | The `--focus-ring` ring, with the browser default outline removed. |
| Visited | Not distinguished. The links on a page sit inside a card and point at external documents, so browsing history is not the information to express here. |

## Classes and tokens

`link.less` holds three rules and takes every value from the token set: `--brand-ink` (which switches to the
lifted step in the dark theme), `--brand-soft`, `--focus-ring` and `--radius-xs`. No font size or line height is
set: a link follows the typography of the paragraph it sits in.

## Usage

```tsx
<Link href={config.form?.terms_of_service_link} external>
  {t('auth.terms.service')}
</Link>
```

To use an application router link, pass it through `render`:

```tsx
<Link href="/app/register" render={<RouterLink to="/app/register" />}>
  {t('auth.footnote.link')}
</Link>
```

## Verification

The unit cases hold the anchor and its `href`, the `target` and `rel` of an external address, the classes and
attributes that survive a `render` swap, class merging, the click handler, and the absent `href` attribute. The
gallery lists a link group with the rest, hover, focus and external forms.

## Known limitations

The upstream ships no link component, so this one is our own: the rendering contract follows the upstream
`useRender` and `mergeProps`, and the look has a single form with no size steps. External links do not announce
that they open a new window; the two on the page sit in the terms row, where the context is clear.
