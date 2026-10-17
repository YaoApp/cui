# WindowControls

Self-drawn window keys: minimise, maximise and restore, close. Which client owns the window keys is decided
by the platform; the component itself makes no judgement.

## Contents

| File | Contents |
| --- | --- |
| `window-controls.tsx` | Rendering of the three keys and the wiring of their actions |
| `window-controls.less` | Size, spacing, glyphs and hover (the close key uses the danger step on hover) |
| `window-controls.test.tsx` | The self-drawn platform draws three keys with three actions; the middle key turns into restore when maximised; native and window-less platforms draw nothing |
| `index.ts` | The module's public surface |

## Props

None. It reads `controls`, `maximized`, `minimize`, `toggleMaximize` and `close` from `useWindowChrome()`.

| Value | Behaviour |
| --- | --- |
| `controls: 'own'` | Draws the three keys (Windows: the native frame is off and we draw them) |
| `controls: 'native'` | Draws nothing (macOS has native traffic lights) |
| `controls: 'none'` | Draws nothing (the web has no window to manage) |

## Usage

```tsx
import { WindowControls } from '@/components/window-controls'

<header className="auth__top">
  ...
  <WindowControls />
</header>
```

Place it at the right end of the title row; its `margin-inline-start: auto` pushes it to the far right, and
it is marked `data-no-drag` so the top drag band does not take presses over it.

## Size and spacing

A 32 square hit area per key, 8 between keys (40 between centres) and a 14 thin-line glyph; the space at the
right edge comes from the title bar's own 8 of padding. Maximise and restore use the same thin-line step;
restore stacks a second box.

## States

| State | How it shows |
| --- | --- |
| Default | Transparent background, text colour `--text-secondary`. |
| Hover | Uses the `Button` plain step: background `--background-hover`, text lifted to `--text-primary`; the close key gets no special colour. |
| Pressed | Only the F4 press scale, no colour change. |
| Focus | Draws `--focus-ring`. |

## Accessibility

Every key has an `aria-label` (`shell.window.minimize`, `shell.window.maximize`, `shell.window.restore`,
`shell.window.close`), all four languages present. The glyphs themselves are decorative and are not read out.

## Verification

`pnpm vitest run app/src/components/window-controls/window-controls.test.tsx`; the real check happens in the
Windows client, comparing the three keys' position and glyphs through window-level screenshots.

## Known limits

Only appears inside the client; on the web it renders nothing. The maximised state is read once when the
window size changes, with no live push.
