# components/base/scroll-area

`components/base/scroll-area` is the scroll container. Scrolling behaviour and overflow state come from Base
UI's ScrollArea upstream: the viewport exposes which side still has content through `data-overflow-y-start`
and `data-overflow-y-end`, and this component draws the edge shadows from them.

All three columns scroll through it: the navigation column's upper area and its current area, the content
column, and the tab browser's page. The tab strip is not a scroll container; tabs that do not fit go into the
`⌄` menu.

## Contents

| File | Contents |
| --- | --- |
| `scroll-area.tsx` | The `ScrollArea` component and `ScrollAreaProps`. |
| `scroll-area.less` | The viewport, the scrollbar and the edge shadows; a shadow appears only when there is content on that side. |
| `scroll-area.test.tsx` | Unit tests. |
| `index.ts` | The module's public surface. |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `children` | `ReactNode` | none | The scrollable content. |
| `className` | `string` | none | Appended to the root, for the caller's own layout. |
| `id` | `string` | none | The root's id. The tab browser gives its page panel an id so tabs can point at it. |
| `role` | `string` | none | The root's role. The tab browser passes `tabpanel`. |
| `aria-labelledby` | `string` | none | Points at the active tab, so the panel is announced by the page it shows. |

## Usage

```tsx
<ScrollArea className="nav__scroll">
  <NavList items={items} label={label} onSelect={onSelect} />
</ScrollArea>
```

The container fills the parent's remaining height by itself, so the parent has to be a flex column with
`min-block-size: 0`; the caller does not set a height.

## States

| State | How it shows |
| --- | --- |
| Default | The scrollbar is invisible and neither side has a shadow. |
| Overflow | The side that still has content gets a fading shadow; top and bottom are decided separately. |
| Hover | The scrollbar fades in and the thumb takes `--scrollbar-thumb` (which is `--border-control`); over the thumb itself it takes `--scrollbar-thumb-hover` (which is `--border-hover`). |
| Scrolling | The scrollbar stays visible. |

## Verification

Unit tests sit next to the component: `scroll-area.test.tsx`.

## Known limits

- Only the vertical scrollbar is drawn; horizontal scrolling is left to the content.
