# `components/locale-switch`

A dropdown that switches the interface language. It is a platform control built on the base `Select`: the
select owns the keyboard behaviour, the roles and the popup, while this component supplies the four languages,
the endonyms and the store call. The form follows the tool bar of the sign-in prototype: a plain trigger with
the current language on the left and a globe at the end.

## Contents

| Path | Role |
| --- | --- |
| `locale-switch.tsx` | The component, its props and the endonym map. |
| `locale-switch.test.tsx` | Unit cases: options, default choice, the toolbar form, the field form, switching copy. |
| `locales/{zh-CN,zh-TW,en-US,ja}.json` | The component's own strings: label, system option, endonyms. |
| `index.ts` | Re-exports the component and its props type. |

## Structure and class names

```
.select-trigger.select-trigger--plain.locale-switch   (role=combobox)
├── span.select__value          the current language, or "follow system (…)"
└── span.select__lead           the globe, painted after the value
    └── span.select__lead-icon
        └── svg.icon            i-globe
```

The dropdown indicator is switched off (`indicator={false}`) because the globe already says what the control
is for. The popup is the base select's own listbox; option rows carry the endonyms.

## Props

| Prop | Type | Default | Meaning |
| --- | --- | --- | --- |
| `variant` | `'field' \| 'plain'` | `'plain'` | Toolbar form (no surface, no border) or field form. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Trigger step, 24 / 32 / 40. |

## Options

| Value | Label shown | Source |
| --- | --- | --- |
| `system` | `localeSwitch.system` with the resolved language filled in, e.g. 「跟随系统（简体中文）」 | Own pack, `{{locale}}` interpolation. |
| `zh-CN` | 中文 | Own pack, `localeSwitch.zhCN`. |
| `zh-TW` | 繁體中文 | Own pack, `localeSwitch.zhTW`. |
| `en-US` | English | Own pack, `localeSwitch.enUS`. |
| `ja` | 日本語 | Own pack, `localeSwitch.ja`. |

Language names are written in their own language (endonyms) and therefore are not translated; the same value
appearing in all four packs is correct and is registered with the checker. A language without an endonym falls
back to the English name.

## Behaviour

Choosing an option calls the locale store, which applies the language and persists the choice; the component
never writes the field itself. Copy updates in place, the page does not reload and typed input is kept.

The `system` option is a first-class choice, not a reset button: its label carries the language the system
resolution currently produces, so the user can see what following the system means. Once an explicit language
is chosen the app stops following the system.

## Sizes and measured values

| Step | Trigger box | Globe |
| --- | --- | --- |
| `small` | 24 | 16 |
| `medium` | 32 | 16 |
| `large` | 40 | 16 |

Measured in the gallery with the toolbar form: the trigger box is 32 high and the globe sits at 835–851 inside
a trigger spanning 670–860, so the icon is inside the control and on the trailing half; the indicator is absent.

## States

All states come from the base select: default, hover, focus (ring for keyboard focus), disabled, and the
loading process, which swaps the pointer for a spinner. This component adds no state of its own.

## Accessibility

The trigger is the base select's combobox with an `aria-label` from `localeSwitch.label` (「语言」). Keyboard
support, the option roles and the highlighted option are the base component's; the endonyms are the accessible
names of the options, so each language is announced in its own words.

## Classes and tokens

| Where | What |
| --- | --- |
| `.locale-switch` | The component's own hook on the trigger. |
| `.select-trigger--plain` | Toolbar form: transparent surface, no border, hover surface, focus ring. |
| `.select-trigger--field` | Field form: surface, border and radius from the field tokens. |
| `.select-trigger--{small,large}` | Step overrides. |

## Usage

```tsx
<LocaleSwitch />                        {/* tool bar: plain trigger, globe at the end */}
<LocaleSwitch variant="field" />        {/* places that need a bordered control */}
<LocaleSwitch size="small" />           {/* dense tool bars */}
```

## Verification

- `app/src/components/locale-switch/locale-switch.test.tsx`: the five options, the default choice with its
  resolved language, the toolbar form (plain class, globe last, no indicator), the field form, and that the
  visible copy changes with the chosen language.
- `app/src/features/scaffold/base/tests/base.browser.ts`: the trigger form, the globe inside the control on the
  trailing side, and switching to Japanese and back without a reload.

## Known limits

- The four languages are fixed by `SUPPORTED_LOCALES`; a new language needs a pack and an endonym entry here.
- The globe is a decorative leading/trailing icon and is hidden from assistive tech; the accessible name comes
  from the trigger label and the option text.
