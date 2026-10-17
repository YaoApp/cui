# components/base

`components/base` holds the base components: atomic controls and the lowest behaviour pieces. They describe
appearance and behaviour only, know nothing about the product and never call the network; behaviour always
wraps an upstream headless part and visuals always come from tokens. Product components take parts from here
and do not write their own controls.

The bar for adding one (`architecture/03-boundaries.md` section three): promote something here once a third
caller in the product needs it, and check for an upstream part before writing behaviour yourself.

## Contents

| Component | Purpose |
| --- | --- |
| [`alert-dialog/`](alert-dialog/README.md) | A confirmation overlay that cannot be dismissed by accident. |
| [`brand-mark/`](brand-mark/README.md) | Brand graphics, a set separate from interface icons. |
| [`button/`](button/README.md) | Buttons, eight variants and three size steps. |
| [`captcha-field/`](captcha-field/README.md) | The image captcha control. |
| [`checkbox/`](checkbox/README.md) | Checkboxes. |
| [`dialog/`](dialog/README.md) | Overlay pages, two width steps. |
| [`drawer/`](drawer/README.md) | A panel that slides in from one side of the window. |
| [`icon/`](icon/README.md) | Interface icons, four size steps. |
| [`input/`](input/README.md) | Text fields. |
| [`link/`](link/README.md) | The text link shared by internal and external targets. |
| [`motion/`](motion/README.md) | Layout projection for elements that must follow a column resize. |
| [`otp-field/`](otp-field/README.md) | One-time passcode input. |
| [`scroll-area/`](scroll-area/README.md) | Scroll container that draws edge shadows on overflow. |
| [`segmented-control/`](segmented-control/README.md) | Segmented selector. |
| [`select/`](select/README.md) | Selector, used with the ARIA combobox pattern. |
| [`spinner/`](spinner/README.md) | Loading indicator. |
| [`tooltip/`](tooltip/README.md) | Text hints. |
| [`turnstile-field/`](turnstile-field/README.md) | Human verification control. |

## Usage

Product code imports from the single entry point instead of reaching into subdirectories:

```tsx
import { Button, Icon, Tooltip } from '@/components/base'
```

## Conventions

- Directory slots mirror the component: `index.ts` · `<name>.tsx` · `<name>.test.tsx` · `<name>.less` ·
  `parts/` · `hooks/`.
- Every component directory carries both an English `README.md` and a Chinese `README.zh-CN.md`.
- Bare control ban: `features/`, `routes/` and `components/` (except this directory) may not write a raw
  `<button>` or `<select>`; `pnpm check` enforces it.
