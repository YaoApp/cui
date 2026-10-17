# components/content

`components/content` is the middle column of the three: the content area. It owns only its minimum width and
its own scrolling; the column width comes from the three-column track. The give-way order is in
`design/foundations.md` F6: the third column shrinks first and disappears entirely before the middle column
can go below its minimum.

The same directory holds a generic `PlaceholderPage`: while a feature is still a skeleton it draws only the
page name and one line of explanation, and real content follows. It knows nothing about the product; the page
name comes from the caller.

## Contents

| File | Contents |
| --- | --- |
| `content.tsx` | The `Content` component and `ContentProps`, wrapping one scroll container. |
| `content.less` | The middle column's minimum width, background, padding and guidance text. |
| `parts/head/` | `ContentHead`: the column head with its title and the keys at both ends. |
| `parts/placeholder/` | `PlaceholderPage`: a page name plus one line of explanation. |
| `index.ts` | The module's public surface: `Content`, `PlaceholderPage` and their types. |

## Props

`Content`:

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `children` | `ReactNode` | none | The page content, usually the router outlet. |
| `title` | `string` | none | The column head title; without it no head is drawn. |
| `navCollapsed` | `boolean` | `false` | Whether the navigation column is collapsed; only then does the head take the traffic-light inset. |
| `lead` | `HeadKey` | none | The key in the head's left slot; left empty when omitted. |
| `trail` | `HeadKey` | none | The key in the head's right slot; left empty when omitted. |
| `hidden` | `boolean` | `false` | This column is collapsed (after a swap the content column is the secondary one): the content becomes unreachable and leaves the accessibility tree. |

`PlaceholderPage`:

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `titleKey` | `I18nKey` | none | The language-bundle key of the page name. |

## Usage

```tsx
<Content title={t('shell.navigation.item.inbox')} lead={navKey} trail={browserKey}>
  <Outlet />
</Content>
```

```tsx
{ path: 'board', element: <PlaceholderPage titleKey="shell.navigation.item.board" /> }
```

## Accessibility and states

- The content area is a `<main>`, exactly one per page.
- Overflow draws edge shadows, and the scrollbar appears only on hover or while scrolling (see
  `components/base/scroll-area`).
- The placeholder's page name is a level-two heading and its explanation uses the secondary text colour.

## Verification

- Unit tests sit next to the component: `content.test.tsx`.
- In the browser: `app/src/features/inbox/tests/layout.shell.browser.ts` measures that the middle column stays
  at 400 or wider and that it widens once the third column is collapsed.

## Known limits

- Of the four content forms in `design/main-shell.md` section four, only the single block exists so far; the
  other three are added when a screen needs them.
