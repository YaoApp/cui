# components/browser

`components/browser` is the tab browser on the right of the app, the third of the three columns. Per
`design/main-shell.md` section five it reads as a browser: a tab strip at the top (one tab per page, the new
key at its end, the more key further right), the current page below, and two panes when split. Each pane
carries its own tab group and its own page. The component knows nothing about the product: tab data and page
content come from the assembly layer, and the component reads no store.

## Contents

| File | Contents |
| --- | --- |
| `browser.tsx` | The `Browser` component and `BrowserProps`: the tab strip, the more menu, the two keys at the trailing end, both panes and the divider. |
| `browser.less` | Width and give-way, the two bar segments, tab blocks, the close key, the menus, the divider, the new-tab page and the internal-route placeholder. |
| `types.ts` | `BrowserTab`: `key`, `label`, `closable`, `icon`. |
| `hooks/use-column-resize.ts` | Dragging the boundary between this column and the content column: the width is written to `--side-width` and rounded during the drag. |
| `hooks/use-split-resize.ts` | Dragging the divider between panes: the ratio is the primary pane's share, the displacement is inverted for a column split, and the value stays between 0.2 and 0.8. |
| `hooks/use-tab-overflow.ts` | Overflow measurement for the strip: reserves the new key and returns the visible segment and the part that goes into the menu. |
| `hooks/use-tab-drag.ts` | Reordering by drag: the movement threshold, the drop index, the displacement preview and the insertion line. |
| `parts/page/` | `TabPage`: dispatches per target (home and blank pages to the new-tab page, external addresses to the web page, internal routes and shortcuts to the internal page). |
| `parts/tabs/` | `BrowserTabs`: one row of tabs, the new key at its end, and the overflow menu entry. |
| `parts/item/` | `BrowserTabItem`: one tab block (icon, title, close key). |
| `parts/secondary-pane/` | `SecondaryPane`: the pane the split adds; a column split gives it a page only, a row split gives it its own strip. |
| `parts/tab-menu/` | `TabContextMenu` and `TabOverflowMenu`: two menus whose actions are passed per group. |
| `parts/new-tab/` | `NewTab`: the new-tab page with the address entry and what has been opened on this side; the home page and a blank page from `＋` share it. |
| `parts/web/` | `Web`: the placeholder for an external address and its address row. |
| `parts/internal/` | `Internal`: the placeholder for an internal route and its path (including the path a shortcut resolves to). |
| `index.ts` | The module's public surface: `Browser`, `TabPage`, `NewTab`, `Web` and their types. |

## Props

`Browser`:

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `tabs` | `BrowserTab[]` | none | The primary group's tabs. |
| `activeKey` | `string` | none | The primary group's current page. An unknown key falls back to the home page. |
| `side` | `'right' \| 'left'` | none | Which side this column sits on, written to `data-side`. |
| `collapsed` | `boolean` | `false` | The whole column is zero wide (collapsed by the user or by a narrow viewport). |
| `split` | `'none' \| 'columns' \| 'rows'` | `'none'` | Single pane, or the split direction. |
| `splitBlocked` | `boolean` | `false` | The viewport rules out a column split; the actual column width is judged separately. |
| `splitRatio` | `number` | `0.5` | The primary pane's share, 0.2 to 0.8. |
| `onSplitRatio` | `(ratio: number) => void` | none | Hands the ratio back after a drag, a double click or a keyboard adjustment. |
| `onSplit` | `(split: BrowserSplit) => void` | none | Switches the split direction. |
| `width` | `number \| null` | `null` | The dragged column width; `null` follows the token default. |
| `onWidth` | `(width: number \| null) => void` | none | Hands the width back after a drag or a double-click reset. |
| `onActivate` | `(key: string) => void` | none | Switches the primary group to a page. |
| `onClose` | `(key: string) => void` | none | Closes a page in the primary group. A page with `closable: false` draws no close key. |
| `onNew` | `() => void` | none | Opens a blank page in the primary group and stops on it. |
| `onReorder` | `(key: string, index: number) => void` | none | Commits a reorder in the primary group. |
| `onRefresh` | `(key: string) => void` | none | Refreshes a page in the primary group. |
| `onCloseOthers` | `(key: string) => void` | none | Keeps only that page in the primary group. |
| `onCloseAll` | `() => void` | none | Closes every closable page in the primary group. |
| `onMove` | `() => void` | none | Moves this column to the other side. |
| `onCollapse` | `() => void` | none | Collapses the whole column. |
| `exclusive` | `boolean` | `false` | The pane takes the whole window (the navigation and content columns give way). |
| `onExclusive` | `() => void` | none | Enters or leaves exclusive mode. |
| `children` | `ReactNode` | none | The primary pane's current page. |
| `secondary` | `ReactNode` | none | The second pane's current page; rendered only when split. |
| `secondaryTabs` | `BrowserTab[]` | none | The second pane's own tab group. |
| `secondaryActiveKey` | `string` | none | The second pane's current page. |
| `onSecondaryActivate` · `onSecondaryClose` · `onSecondaryNew` · `onSecondaryReorder` | — | actions | Apply to the second group only. |
| `onSecondaryRefresh` · `onSecondaryCloseOthers` · `onSecondaryCloseAll` | — | actions | The three menu items of the second group; they apply to it only. |
| `onSecondaryFocus` | `() => void` | none | Switches the focus to the second pane when the pointer presses inside it. |
| `focusedPane` | `number` | none | Which pane has focus: the pane background's focus cue and the keyboard target both read it. |
| `onFocusPane` | `(pane: number) => void` | none | Hands the pane number back when a pane is pressed. |

`BrowserTab`: `key` (a stable page identity that survives a content change) · `label` (the name on the tab) ·
`closable` (whether a close key is drawn) · `icon` (optional graphic name; without it the icon follows whether
the page is closable).

`TabPage`: `tab` (the page to render, a `TabEntry` from `stores/browser/tab-group.ts`), `recent` (what has been
opened, shown on the new-tab page), `onOpen` (the input submitted at the address entry), `onOpenRecent` and
`validateAddress`.

`NewTab`: `recent` and `onOpen`. `Web`: `address`. `Internal`: `path`.

## Usage

Page content is dispatched per target and the landing point inside a page is decided by the assembly layer
(see `routes/layout.tsx`):

```tsx
<Browser
  tabs={view}
  activeKey={activeKey}
  side={browserSide}
  split={browserSplit}
  onActivate={(key) => activateTab(key)}
  onClose={(key) => closeTab(key)}
  onNew={() => openBlankTab()}
  secondaryTabs={secondaryView}
  secondaryActiveKey={secondaryActiveKey}
  onSecondaryActivate={activateSecondary}
  secondary={renderSecondaryTab(secondaryActive)}
  onMove={() => setBrowserSide(browserSide === 'right' ? 'left' : 'right')}
  onCollapse={toggleBrowser}
>
  {renderTab(active)}
</Browser>

/* renderTab hands one page to TabPage; a submission lands inside that page */
<TabPage tab={tab} recent={recent} onOpen={(input) => navigateTab(tab.key, parseTarget(input))} />
```

Opening and closing tabs go through `stores/browser/tabs.ts` (primary) and `stores/browser/secondary.ts`
(second group). What an input resolves to is decided in `stores/browser/targets.ts`: an empty string is a
blank page, a leading `/` is an internal route, a known name is a shortcut, and anything else is an external
address.

## Accessibility

- The whole column is an `<aside>` with an accessible name.
- Each group's strip is a `tablist`; their names are "Main pane tabs" and "Second pane tabs". Tabs carry `id`
  and `aria-controls`, and the controlled panel is `role="tabpanel"` with an `aria-labelledby` that follows
  the active page.
- The new key, the more key, the move key, both split keys, maximise or restore, and the collapse key are icon
  buttons with an `aria-label` and a text hint; the new key sits outside the `tablist`.
- The divider is `role="separator"` with `aria-orientation`, an `aria-label`, `aria-valuemin` 20,
  `aria-valuemax` 80 and the current `aria-valuenow`; the arrow keys, `Home`/`End` and `Enter` reset it.
- The close key is `role="button"` with an `aria-label` and is not in the Tab order; the keyboard closes a tab
  with `Delete`.
- When a tab title is truncated, the full text comes from this package's `Tooltip`, and the truncated layer
  never takes the pointer.
- The address row is a text field with a visible label that submits on `Enter`.

## States

| State | How it shows |
| --- | --- |
| Default | Tab blocks have a transparent background; the current page takes `--nav-select`. |
| Hover | The tab block takes `--nav-hover`; the close key appears, scales to 1.2 and lifts from secondary to primary text colour, with no background. |
| Focus | The body draws `--focus-ring`. |
| Empty | The new-tab page shows empty-state text when nothing has been opened. |
| Collapsed | The column is zero wide and carries `inert`; the content column takes the freed width. |
| Give-way | When the width cannot hold this column it goes to zero width rather than being squeezed. |
| Split does not fit | A column split judges the actual width and a row split the actual height; whichever fails is disabled in the menu with the reason written next to it. |

## Verification

- Unit tests sit next to the component: `browser.test.tsx`. Tab sets, target parsing and the two groups live in
  `app/src/stores/browser/`: `tabs.test.ts`, `targets.test.ts`, `tab-group.test.ts` and `secondary.test.ts`.
- Component browser tests: `tests/tab.browser.ts` (tab blocks and the close key),
  `tests/keyboard.browser.ts` (keyboard traversal and closing), `tests/overflow.browser.ts` (overflow and the top
  of the menu), `tests/drag.browser.ts` (reordering by drag), `tests/tab-menu.browser.ts` (both menus),
  `tests/recent-address.browser.ts` (the opened list and the address entry),
  `tests/exclusive-width.browser.ts` (column width when exclusive and navigation collapse hold at once) and
  `tests/a11y.browser.ts` (tab to panel wiring, the two group ids, the divider values).
- Layout browser tests under `app/src/features/inbox/tests/`, split by layer: `layout.shell.browser.ts` (three
  columns, navigation, this column's fold and head, swapping, give-way), `layout.split.browser.ts` (two groups,
  direction gates, the divider and dragging, closing the split when the second group empties, both menus of the
  second pane), `layout.exclusive.browser.ts` (row split and exclusive), `layout.motion.browser.ts`
  (animation), `layout.mirror.browser.ts` (mirrored geometry and keys after a swap); shared helpers live in
  `layout.helpers.ts`.

## Known limits

- Closing a tab does not animate the remaining tabs into place: the instant landing is deliberate and the
  reason is in `plan/07-layout.md` section eleven.
- External addresses and internal routes are placeholders for now; real content follows. The opened list also
  only covers pages opened in this session.
- The split goes one level deep; a pane cannot be split again.
