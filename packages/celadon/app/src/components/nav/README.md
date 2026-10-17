# components/nav

The navigation column on the left of the app. Its rules come from `design/main-shell.md` section three and
`design/foundations.md` F6, and this document matches those two point by point; it adds nothing they do not
say.

The column has two **independent** ways to fold, which is the easiest thing to confuse in this module:

| Fold | State source | Effect | Exit |
| --- | --- | --- | --- |
| Whole column collapsed | `collapsed` | The column width becomes `0`, the whole navigation area is invisible, and the content column starts at the far left | **The open key at the left end of the content column head**, outside this component |
| Upper area folded | `mainFolded` | The six main entries fold away; the current row and the expand key stay at the foot | The expand key in the foot row |

The two do not affect each other: a collapsed column still renders its upper area (the column is simply
invisible), and folding the upper area leaves the column width unchanged. The component knows nothing about
the product; entries, the current area and the account name all come from the assembly layer.

## Contents

| File | Contents |
| --- | --- |
| `nav.tsx` | The `Nav` component and `NavProps`. Four-part assembly; both fold states and their actions come from the caller, and the column width is managed by `useNavResize`. |
| `nav.types.ts` | `NavItem`: `key`, `icon`, `labelKey`, `to`, `badge?`, `active?`. |
| `nav.less` | The column container, the four-part layout, both folds, the folded menu and the states. Width comes from `--nav-width` (written at runtime by dragging, `--nav-default` by default, bounded by `--nav-min` and `--nav-max`); a collapsed column is `0`, expressed by one rule on `[data-width='zero']`. |
| `hooks/use-nav-resize.ts` | Column width dragging: pointer down, per-frame application, arrow keys, double-click reset, hover highlight and cursor. |
| `parts/header/` | The head block: the collapse key; on the web it also draws the brand (mark and product name). When the desktop client reports `controls` as `own` the whole block is not rendered and the shell owns the window keys. |
| `parts/brand/` | The brand row: mark and product name, drawn under the head on the two ends where `controls` is not `none`. |
| `parts/main/` | The upper main navigation: an inner block (area name and fold key) and the six entries. When folded the whole part takes no height, and the list stays in the tree while the animation closes it. |
| `parts/scene/` | The lower area: the secondary navigation slot; when the upper area is folded this area gains the current row and the expand key at its top. |
| `parts/footer/` | The foot row: avatar and name on the left, shortcut icons on the right, pinned to the foot with `margin-block-start: auto`. |
| `parts/list/` | The upper area's list container, rendering one row per entry. |
| `parts/list/parts/item/` | One entry: icon, text, unread badge, current state. Renders a real link. |
| `parts/menu/` | The find-back menu in the folded state, built on Base UI's `Menu` part. |
| `index.ts` | The module's public surface: `Nav`, `NavProps` and `NavItem`. |

The four parts each have an `index.ts` that exports only their component and props type. There is **one**
`nav.less`, imported by `nav.tsx`: column-level and cross-part state rules live there, and each part's own
rules sit in the same file under its own heading.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `items` | `NavItem[]` | none | The six main entries. With none, no entries render. |
| `shortcuts` | `NavItem[]` | none | The shortcut icons in the foot row, the same content as the matching main entries. |
| `scene` | `I18nKey` | none | The scene name in the current-scene row. Pass `shell.navigation.scene.none` when there is no scene. |
| `sceneIcon` | `IconId` | none | The scene icon, drawn first in the current row. |
| `accountName` | `string` | none | The name in the foot row; the assembly layer passes a placeholder when no session user is available. |
| `navWidth` | `number \| null` | `null` | The stored column width; `null` means the default. |
| `onNavWidth` | `(width: number \| null) => void` | none | Writes the width back after a drag or a keyboard adjustment. |
| `collapsed` | `boolean` | none | Whether the whole column is collapsed. The caller holds the value; the component stores no preference. |
| `onToggle` | `() => void` | none | The action of the collapse key. |
| `mainFolded` | `boolean` | none | Whether the upper area is folded, which is a different thing from the collapsed column. |
| `onToggleMain` | `() => void` | none | The action shared by the fold key in the upper area and the expand key in the foot. |
| `children` | `ReactNode` | none | The secondary navigation in the lower area, supplied by the feature as a slot; without it the lower area shows only the scene title. |
| `onSelect` | `(item: NavItem) => void` | none | Selects an entry. Entries are real links, so modified clicks are handed back to the browser. |

Part-level props: `NavHeader` takes `onToggle` (on the web it also does an internal platform check);
`NavMain` takes `items`, `compact`, `folded`, `onToggleFold` and `onSelect`;
`NavScene` takes `items`, `currentLabel`, `sceneIcon`, `folded`, `columnWidth`, `onSelect`, `onUnfold` and
`children`; `NavFooter` takes `name`, `shortcuts` and `onSelect`; `NavList` takes `items`, `label`, `compact`
and `onSelect`; `NavItemRow` takes `item`, `compact` and `onSelect`; `NavMenu` takes `items`, `currentLabel`,
`sceneIcon`, `columnWidth` and `onSelect`.

Fields of `NavItem`:

| Field | Type | Notes |
| --- | --- | --- |
| `key` | `string` | A stable key, used for selection and as the list key. |
| `icon` | `IconId` | The icon, taken from `design/icons/manifest.json`. |
| `labelKey` | `I18nKey` | The language-bundle key of the text. |
| `to` | `string` | An in-app path without a namespace. |
| `badge` | `number` | Unread count; neither a missing value nor 0 draws a badge. |
| `active` | `boolean` | The current entry, decided by the assembly layer from the address. |

## Usage

Entries and states are prepared in the assembly layer; the column only draws and calls back:

```tsx
const items: NavItem[] = [
  { key: 'inbox', icon: 'i-inbox', labelKey: 'shell.navigation.item.inbox', to: '/inbox' },
]

<Nav
  items={items}
  shortcuts={items.filter((item) => item.key === 'workspace')}
  scene="inbox.title"
  sceneIcon="i-inbox"
  accountName={account?.name ?? t('shell.navigation.account.placeholder')}
  navWidth={navWidth}
  onNavWidth={setNavWidth}
  collapsed={collapsed}
  onToggle={toggleNav}
  mainFolded={mainFolded}
  onToggleMain={toggleMain}
  onSelect={(item) => navigate(item.to)}
>
  <InboxNav />
</Nav>
```

## States

| State | How it shows |
| --- | --- |
| Default | Entries have a transparent background and use `--text-primary`. |
| Hover | Background takes `--nav-hover` (the navigation-only step; the generic `--background-hover` serves white surfaces); the keyboard highlight `[data-highlighted]` uses the same step. |
| Focus | `box-shadow: var(--focus-ring)`, triggered by `:focus-visible`. |
| Current | Background takes `--nav-select`, text takes `--text-primary`, and the entry carries `aria-current="page"`; selection is expressed by lightness, not by the brand colour. |
| Unread | The badge background takes `--brand-soft` and its text `--brand-ink`; on the current entry the badge is not rendered, though its style stays. |
| Column collapsed | Width is `0` (`[data-width='zero']`), padding and the right border go to zero with it, and the column is invisible; the way back is the left end of the content column head. |
| Upper area folded | The upper area shrinks to zero height: Motion animates the folded body to `0` (`overflow: hidden`) and the area itself is `flex: 0 1 auto` so it takes no remaining height; the current row and the expand key appear at the foot. |
| Dragging the width | Once the pointer enters the 4 pixel band on the right edge the cursor changes at once and the highlight appears after 300 milliseconds; a press applies per frame, a double click resets, and the arrow keys adjust. The handle is marked `data-no-drag`, so window dragging does not take it. |
| Window drag and double click | In the blank part of the top band (`--window-drag-band`, 48 pixels): a **press plus movement** drags the window, a double click toggles maximise and restore, and a single click does nothing; both platforms are handled by the app. Column heads can be dragged; the keys inside them and the right-edge handle do not take these two actions, and the band never selects text and always shows an arrow cursor. |
| Content taller than the area | The upper and lower areas **each** scroll: the area clips itself (`overflow: hidden`) and the inner scroll area takes the remaining height and **shows its scrollbar on hover**. The two areas never overlap. |

## Accessibility

- The whole column is a `<nav>` with an accessible name; the upper list carries its own name.
- Every entry is a link with a real `href`, so it can be copied, opened in a new window and right-clicked;
  a plain left click goes to the caller's router.
- Once folded, the current row is the menu trigger and carries `aria-expanded`; opening the menu moves focus
  into it, the arrow keys move between entries, and `Esc` closes it and returns focus to the row.
- Icon buttons always have an `aria-label` and a text hint; a collapsed column leaves the focus order.
- The drag handle is `role="separator"` with `aria-valuemin`, `aria-valuemax` and `aria-valuenow`, and it
  responds to the arrow keys.

## Verification

- Unit tests sit next to the component: `nav.test.tsx` covers entries and the current state, modified clicks,
  the fold and expand keys, the collapsed column (asserting `data-collapsed`), the two separate actions and
  the secondary navigation slot; `hooks/use-nav-resize.test.tsx` covers dragging, the keyboard and the reset.
- In the browser: `app/src/features/inbox/tests/layout.shell.browser.ts` covers collapsing the column and
  keeping it across a reload, folding, and finding the column back with the keyboard;
  `layout.motion.browser.ts` covers entry geometry during the animation.
- Geometry is checked by measurement: column width and both area heights come from `getBoundingClientRect()`;
  the collapsed reading is a width of `0` with the content starting at `0`, and the folded reading is an upper
  area height of `0` with the folded row against the top of the user area.

## Known limits

- The fold animation uses Motion spring parameters (`stiffness 420`, `damping 38`, `mass 0.9`) and degrades to
  instant under the reduced-motion preference; those parameters are not bound to the duration steps in
  `design/foundations.md`, so changing the styles does not change them.
- The draggable width range is `264` to `420`. Below a viewport width of `987`, the `--nav-auto-collapse`
  step (`988`) collapses the column automatically through the same state and the same styles; the overlay
  that would open it temporarily over
  the middle column is not implemented yet.
- Secondary navigation is wired for the inbox only; other scenes follow their own features.
- Unread counts come only through `badge`; real numbers are supplied by the assembly layer.
