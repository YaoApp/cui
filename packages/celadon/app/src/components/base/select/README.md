# components/base/select

`components/base/select` is the product's option picker. It wraps Base UI's Select and renders a combobox
button, `.select-trigger`, which opens a `.select-popup` list. The trigger has its own `.select-trigger*`
classes and does not borrow the input's classes; the two share only the same field tokens, so they look like
one family while their behaviour stays separate. It is used for theme, language and other single or multiple
choices.

## Contents

| File | Contents |
| --- | --- |
| `select.tsx` | The `Select` component and the `SelectProps`, `SelectOption` and `SelectGroup` types. |
| `select.less` | The trigger, the popup, the list, the options and their slots, the group label, the scroll arrows and the search field. |
| `select.test.tsx` | Unit tests for the accessible name, the controlled value, keyboard, disabled, empty, groups, option slots, the inverse and plain forms, search, multiple and the clear item. |
| `index.ts` | The module's public surface, namely `Select`, `SelectProps`, `SelectOption` and `SelectGroup`. |

## Structure and classes

The trigger is a `<button role="combobox">`. The popup and the list are rendered in a portal and positioned by
Base UI; geometry such as the anchor width and the available height is exposed as CSS variables on the popup.

| Part | Classes | Notes |
| --- | --- | --- |
| Trigger | `.select-trigger` · `.select__trigger` | Adds `select-trigger--small` / `--large`, `select-trigger--plain`, `select-trigger--inverse`, `is-error` and `is-<state>`. Rendered by `Select.Trigger` with `role="combobox"`. |
| Trigger value | `.select__value` | `Select.Value`; single line with an ellipsis, and the placeholder while nothing is selected. |
| Trigger icon | `.select__lead` | Optional leading or trailing icon slot, `aria-hidden="true"`. |
| Indicator | `.select-icon` | The `i-down` icon; hidden when `indicator` is false. |
| Positioner | `.select__positioner` | Positions the popup, aligned to the start edge with a 4 px gap. The gap comes from the positioner, not from component margin. |
| Popup | `.select-popup` | Adds `select-popup--search` when `searchable`; the popup is aligned to whole rows. |
| Search | `.select-search` | `.select-search__icon` and `.select-search__input`; the input reuses `.input.input--small`. |
| Empty text | `.select-popup__empty` | Shows `emptyText` when there are no options, `noMatchText` when the search matches nothing. |
| List | `.select-list` | The scrolling container; `--row-height` is its row height. |
| Arrows | `.select-arrow` · `.select-arrow--up` | Visible only while the list can scroll; each is `--spacing-24` high and overlays the space the list gives up. |
| Group label | `.select-group-label` | One per `SelectGroup`. |
| Option | `.select-item` | Contains `.select-item__icon`, `.select-item__body` with `.select-item__label` and `.select-item__description`, `.select-item__trailing` and `.select-item__check`. |
| Check | `.select-item__check` | The `i-check` icon, shown on the selected item. |

## Props

`SelectProps` is a union: a single select takes `value: string` and `onValueChange: (value: string) => void`,
and a multiple select sets `multiple: true` and takes `value: readonly string[]` and
`onValueChange: (value: string[]) => void`. `SelectBaseProps` is shared by both:

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `options` | `readonly SelectOption[]` | `[]` | Flat options. When `groups` is given it takes precedence. |
| `groups` | `readonly SelectGroup[]` | none | Grouped options, each group with a label. |
| `aria-label` | `string` | required | Accessible name, placed on the trigger. |
| `id` | `string` | none | Id of the trigger. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Trigger height 24 / 32 / 40, on the same ladder as the button, the input and the checkbox. |
| `placeholder` | `ReactNode` | none | Shown while nothing is selected and when there are no options at all. |
| `emptyText` | `ReactNode` | none | Shown in the popup when there are no options. The component writes no copy of its own. |
| `icon` | `ReactNode` | none | Trigger icon, in the same position and colour as the input's icon slot. |
| `error` | `boolean` | `false` | Dangerous boundary and focus ring, the same rules as the input. |
| `disabled` | `boolean` | none | Blocks interaction. |
| `state` | `'hover' \| 'focus' \| 'loading'` | none | Static state class on the trigger for side-by-side display. |
| `searchable` | `boolean` | `false` | Adds a filter input at the top of the popup. |
| `searchLabel` | `string` | none | Accessible name and placeholder of the filter input, supplied by the caller in every language. |
| `noMatchText` | `ReactNode` | none | Shown when the search matches nothing. |
| `filterOption` | `(option: SelectOption, query: string) => boolean` | none | Custom filter. The default matches the label text case-insensitively. |
| `variant` | `'field' \| 'plain'` | `'field'` | `field` is the bordered field form, `plain` draws no field background or border. |
| `iconPosition` | `'start' \| 'end'` | `'start'` | Where the trigger icon sits relative to the value. |
| `indicator` | `boolean` | `true` | Whether the trailing `i-down` indicator is drawn. |
| `inverse` | `boolean` | `false` | The dark filled form for a dark or brand background, the same treatment as the inverse button. |
| `required` | `boolean` | `false` | Form validation only. It has nothing to do with whether the choice can be cleared. |
| `className` | `string` | none | Extra class on the trigger. |

`SelectOption` describes one row:

| Field | Type | Notes |
| --- | --- | --- |
| `value` | `string \| null` | A `null` value is the clear item: selecting it clears the choice and the trigger returns to the placeholder. |
| `label` | `ReactNode` | The row text. |
| `icon` | `ReactNode` | Optional leading icon. |
| `description` | `ReactNode` | Optional second line. A row with a description grows past the single-line height. |
| `trailing` | `ReactNode` | Optional trailing content, for example a badge or a shortcut. |
| `disabled` | `boolean` | The row is shown but cannot be picked or reached by the keyboard. |

`SelectGroup` has a `label: ReactNode` and an `options: readonly SelectOption[]`.

## States

| State | How it is expressed |
| --- | --- |
| Default | The field tokens apply to the trigger. |
| Hover | Border `--border-hover`, or background `--background-hover` in the plain and inverse forms, through `:hover` or `.is-hover`. |
| Focus | The trigger is a button, so a mouse click adds no ring and does not change the background; only `:focus-visible` draws the ring, through `--brand` or `--focus-ring-inverse` in the inverse form. |
| Disabled | The native `disabled` attribute; disabled background, text and boundary, with `cursor: not-allowed`. |
| Error | `--danger` boundary and focus ring, with hover and focus keeping the dangerous colour. |
| Loading | `cursor: progress`. The trigger does not draw the loading ring itself. |
| Empty | The placeholder while nothing is selected; `emptyText` in the popup when there are no options, and `noMatchText` when the search matches nothing. |
| Clear | In a single select, picking the selected option again clears it and reports an empty string; a `value: null` option does the same. |

The popup follows the dropdown scene of the motion rules: it enters in 200ms with the decelerate easing and
only opacity plus a small scale, with the origin taken from the positioner, and it leaves in 120ms with the
accelerate easing and opacity only, so the whole menu does not fly away. The popup remembers its width when
the entrance ends and does not follow the trigger during the exit. In a single select the new value is held
back and reported to the caller only after the popup has fully disappeared, so the trigger label and width
change after the menu is out of sight. The check mark uses the 0.2s `fade` scene. The option rows do not
animate in one by one.

## Sizes

| Size | Trigger height | Line height | Font size | Radius |
| --- | --- | --- | --- | --- |
| `small` | 24 | 20 | 12 | `--radius-small` |
| `medium` | 32 | 24 | 14 | `--radius-medium` |
| `large` | 40 | 24 | 16 | `--radius-large` |

The trigger heights 24 / 32 / 40 are measured in the browser case, and the line heights 20 / 24 / 24 come
from the control line-height tokens. The popup
has a `--spacing-4` padding and `--radius-medium`, and its maximum height is aligned to whole rows, so an
equal-height list does not end on a half row. An option has a min height of `--row-height` (40), a
`--spacing-8` block padding and a `--spacing-12` inline padding. A two-line option with a description grows
with its content, measured at 52. A scroll arrow is `--spacing-24` high. The search field uses the small input
step.

## Accessibility

- `aria-label` is required. Base UI's Trigger renders a button with `role="combobox"`, and the name lands on it.
- Keyboard: Enter, Space and the arrow keys open the popup, the arrow keys move the highlight, Enter picks, and
  Escape closes. A disabled option is skipped by keyboard movement and cannot be picked.
- The popup is a listbox and each row is an option. A disabled option exposes its disabled state to assistive
  technology.
- The leading and trailing icon slots are `aria-hidden="true"`, and the check indicator is decoration. The
  selected state is carried by the option's accessible state.
- The filter input has its own accessible name from `searchLabel`. It stops key propagation for typed text
  only; the arrow keys, Enter and Escape pass through, so the keyboard can move from the input into the list
  and close the popup.
- `state` is for static display only and changes no behaviour.

## Classes and tokens

The trigger, popup, list, options, arrows and search field are all defined in `select/select.less`. The trigger
takes the field appearance from the same tokens as the input, namely `--background-field`, `--border-control`,
`--border-hover`, `--brand`, `--danger`, `--background-disabled`, `--text-disabled` and `--border-disabled`,
but it keeps its own classes. The plain form uses `--background-hover`; the inverse form uses
`--background-inverse`, `--background-inverse-hover`, `--text-inverse` and `--focus-ring-inverse`. The popup
uses `--background-surface`, `--border-default`, `--shadow-floating` and `--radius-medium`. A row uses
`--background-hover` while highlighted and `--brand-soft` with `--brand-ink` while selected; both paints sit
on the row's `::before`, inset by half a spacing step at the block ends, so the two colours do not touch when
two rows are adjacent. The check mark and the arrows come from the project's icon set.

## Usage

```tsx
import { Select } from '@/components/base'

<Select
  aria-label="Theme"
  value={theme}
  onValueChange={setTheme}
  options={[
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: null, label: 'Clear' },
  ]}
  placeholder="Pick a theme"
/>
```

The sample page groups selects by props, variants, states, sizes, options, groups, long list, multiple, search
and empty in `app/src/features/scaffold/base/base.tsx`, and the page is served at `/app/scaffold/base`.

## Verification

```bash
pnpm lint        # stylelint, eslint and tsc
pnpm check       # token, i18n and convention checkers
pnpm test        # unit tests, including select.test.tsx
pnpm build       # production build
pnpm exec playwright test app/src/features/scaffold/base/tests/   # browser cases for the sample page
```

The browser case measures the trigger heights 24 / 32 / 40 and the medium height against the input, the
`i-down` indicator, the option row height against `--row-height`, the whole-row height of a long list and a
searchable long list, the arrow space and non-overlap, the group labels, the option slots, the multiple and
search behaviour, the clear and reselect behaviour, the inverse paint and the no-ring-on-mouse-focus rule.

## Known limitations

- `aria-label` is required. The component renders no external label and accepts no `aria-labelledby`.
- `state` has no `error` member; the error is the boolean `error` prop. It also has no open member, because the
  popup is driven by Base UI.
- `state="loading"` only changes the pointer to `progress`. The trigger draws no visible progress indicator.
- `options` and `groups` are alternatives. When `groups` is given, `options` is ignored.
- Values are strings. A `null` option value is the clear item and is reported as an empty string in a single
  select.
- There is no select-all control for the multiple form.
- The focus ring is drawn only for keyboard focus by design; a mouse click after picking an option leaves no
  ring on the trigger.
