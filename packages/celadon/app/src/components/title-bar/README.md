# components/title-bar

`components/title-bar` is the self-drawn title bar of the Windows client: one row above the whole app that
looks like the system title bar. Its far left holds a single navigation collapse key and its right end holds
the three self-drawn window keys; everything below is identical to the web build.

macOS does not draw this row: its native traffic lights share the row with the content head. The web has no
window, so the `WindowChrome` capability is not `own` and the component renders nothing.

## Contents

| File | Contents |
| --- | --- |
| `title-bar.tsx` | The `TitleBar` component and `TitleBarProps`. |
| `title-bar.less` | Row height, the left inset, the background and the keys at both ends. |
| `index.ts` | The module's public surface. |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `navCollapsed` | `boolean` | none | Whether the navigation column is collapsed; decides the icon and the copy of the collapse key. |
| `onToggleNav` | `() => void` | none | Called when the collapse key is clicked; the assembly layer toggles the navigation state. |

## Usage

```tsx
<TitleBar navCollapsed={navCollapsed} onToggleNav={toggleNav} />
```

It renders only when `useWindowChrome().controls === 'own'`. The component decides that itself, so callers do
not test the platform again.

## Accessibility

- The collapse key carries `aria-label` and `aria-expanded`, and its copy switches between collapsing and
  expanding according to the current state.

## Verification

- Platform branches are covered by per-platform tests such as `nav.client.test.tsx`. The title bar itself is
  checked in the Windows client through window-level screenshots.

## Known limits

- A single navigation collapse key. The title area is empty on purpose, so the app name is not drawn twice;
  the window title still comes from the system.
