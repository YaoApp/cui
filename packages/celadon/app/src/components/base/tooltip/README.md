# components/base/tooltip

`components/base/tooltip` renders text hints. Behaviour comes from Base UI's Tooltip upstream: hover delay,
focus following and closing on `Esc` are its responsibility; this component only draws the bubble, with the
visuals taken from tokens.

Use it where a control shows an icon and no visible text, such as the navigation collapse key, the expand key
in the folded state, and a tab's close key. Actions with visible text do not need a hint.

## Contents

| File | Contents |
| --- | --- |
| `tooltip.tsx` | The `Tooltip` component and `TooltipProps`. |
| `tooltip.less` | The bubble's background, text colour, radius, padding and layer (`--z-overlay`). |
| `tooltip.test.tsx` | Unit tests, covering the trigger side. |
| `index.ts` | The module's public surface. |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` | none | The hint text; the caller reads it from the language bundle. |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'` | Which side of the trigger the bubble appears on. |
| `children` | `ReactElement` | none | The element that triggers the hint; it must accept props (a button, an icon button, a link). |

## Usage

```tsx
<Tooltip label={t('shell.navigation.action.collapse')} side="bottom">
  <Button iconOnly aria-label={t('shell.navigation.action.collapse')} onClick={onToggle}>
    <Icon name="i-collapse" size={16} />
  </Button>
</Tooltip>
```

## Accessibility

- The trigger keeps its own accessible name; the hint text and the `aria-label` each do one job.
- Focusing the trigger with the keyboard shows the hint as well.

## Verification

- Unit tests sit next to the component: `tooltip.test.tsx` (jsdom cannot measure the bubble, so it covers the
  trigger side only).
- The bubble itself is verified in a real browser: `app/src/features/inbox/tests/layout.shell.browser.ts`
  locates the collapse key through its hint, and `app/src/components/browser/tests/tab.browser.ts` checks the
  hint on a truncated tab title.

## Known limits

- The hint holds plain text only; rich content and custom placement strategies are not supported.
