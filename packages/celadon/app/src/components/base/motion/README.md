# components/base/motion

`components/base/motion` carries the animation that follows column layout: position and size changes go
through Motion's layout projection, so the layout itself is not re-flowed while the animation runs. It wraps
Motion's `motion.div` and adds two transitions plus two helpers that read the duration and easing from CSS.

Use it on containers whose width changes while their contents are laid out once at the destination width:
the navigation column, the content column and the tab browser. Closing, opening and swapping the last two
columns all go through it.

## Contents

| File | Contents |
| --- | --- |
| `motion-panel.tsx` | The `MotionPanel` component and `MotionPanelProps`. |
| `panel-motion.ts` | `PANEL_SPRING` (the open and close spring), `PANEL_INSTANT` (no animation while dragging), `panelDurationMs`, `panelEase` and `panelTiming`. |
| `motion-panel.test.tsx` | Unit tests: the chosen tag, the `position` mode, and degrading to instant when motion is reduced. |
| `index.ts` | The module's public surface. |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `as` | `'div' \| 'aside' \| 'main' \| 'section' \| 'nav' \| 'li' \| 'header' \| 'span'` | `'div'` | The tag that takes part in the layout animation: `aside` for a column, `main` for a main area, `li` for a row, `header` for a column head, `span` for a tab. |
| `position` | `boolean` | `false` | Pass it for displacement elements (rows, text, icons): they translate without scaling, so text does not deform or blur. |
| `transition` | Motion transition | the spring | Pass `PANEL_INSTANT` while a drag resizes the column, so the width follows the pointer without animation. |

## Usage

```tsx
<MotionPanel as="aside" className="layout__nav">
  <MotionPanel position className="nav__header">…</MotionPanel>
</MotionPanel>
```

## Conventions

- The shell uses `layout` (that is, no `position`), and every row and text inside it passes `position`.
- The first placement does not animate (`initial={false}`): restoring a stored value lands in one frame.
- Under `prefers-reduced-motion: reduce` it degrades to `PANEL_INSTANT` and lands instantly.
- The spring parameters live in `panel-motion.ts`; duration and easing come from `--duration-base` and
  `--easing-decelerate` in `design/tokens.less`.

## Verification

- Unit tests sit next to the component: `motion-panel.test.tsx`.
- Frame-by-frame readings of column width and text width are recorded under `app/logs/`.

## Known limits

- No custom spring presets; pass `transition` at the call site when another tempo is needed.
