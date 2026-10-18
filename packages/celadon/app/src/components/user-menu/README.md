# components/user-menu

`components/user-menu` is the account menu used in the navigation footer and, when the navigation
column is collapsed, in the content column head. It owns the trigger, the popup, the sections, the
keyboard behaviour and the sign-out confirmation.

It is presentational: profile, plan, usage, links and actions all arrive as props; the component does
not call any API.

## Contents

| File | Contents |
| --- | --- |
| `user-menu.tsx` | `UserMenu`, `UserMenuProps`, `UserMenuSection`, `UserMenuStatus`, `UserMenuLinks`. |
| `parts/identity/` | The avatar / name / plan row that opens the profile section. |
| `parts/usage/` | The usage row and the inverted upgrade button. |
| `parts/item/` | A normal row: icon, label, optional trailing text or external icon. |
| `parts/separator/` | The line between sections. |
| `locales/` | Copy in zh-CN, zh-TW, en-US and ja; keys start with `userMenu.`. |
| `user-menu.less` | Trigger variants, popup surface, row states and skeletons. |
| `user-menu.test.tsx` | Unit tests: sections, links, upgrade, sign-out confirmation, states. |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `status` | `'loading' \| 'ready' \| 'unavailable' \| 'signedOut'` | required | `signedOut` renders a plain sign-in trigger without a menu. |
| `name` | `string` | `''` | Display name. |
| `plan` | `string` | `''` | Plan line under the name. |
| `avatar` | `string` | none | Photo URL. |
| `teamName` | `string` | none | Draws the team badge and fills the right side of the Team row. |
| `usage` | `{ remaining: number \| null; upgradeUrl?: string }` | none | Remaining credits are formatted with `Intl.NumberFormat` plus the localised unit. |
| `shortcut` | `string` | none | Shown on the Settings row, e.g. `⌘,` or `Ctrl+,`. |
| `variant` | `'footer' \| 'icon'` | `'footer'` | Footer shows the name; the head trigger shows the avatar only. |
| `silentFocus` | `boolean` | `false` | After Escape closes settings the trigger takes focus without a visible ring until the next key or pointer action. |
| `links` | `{ home, help, docs }` | required | External addresses. |
| `onOpenSettings` | `(section) => void` | required | `profile` · `team` · `usage`. |
| `onOpenExternal` | `(url) => void` | required | Upgrade and the three links. |
| `onSignOut` | `() => void` | required | Called after the confirmation. |
| `onSignIn` | `() => void` | required | Used when signed out. |
| `onRetry` | `() => void` | none | Runs when the identity row of the unavailable state is chosen. |

## Behaviour

- Opens upward with an 8 pixel gap; a viewport shorter than 560 pixels flips it downward.
- The popup has a fixed `--menu-width` (320) and does not follow the navigation column; it only clamps to the viewport on very narrow screens.
- Entrance follows the `dropdown` scene: 200ms decelerate, opacity plus a 0.98 scale from the `--transform-origin` the positioner provides; the exit only fades, 120ms accelerate.
- The trigger does not scale on press; it opens the menu in the same frame, so a press effect would read as a second action.
- `Esc` closes and returns focus to the trigger; clicking outside or choosing an item also closes.
- Menu items are `menuitem`s; the upgrade row is a single inverted small `Button`, not a nested button.
- The trigger, the identity row, the items and the upgrade button all use the pointer cursor.
- Sign-out opens an `AlertDialog`; cancelling closes it without calling `onSignOut`.
- The popup scrolls inside when it exceeds `min(480px, 100vh - 96px)`.

## Accessibility

- The trigger is a real button with `aria-haspopup="menu"` and `aria-expanded` (from the upstream menu).
- Opening moves focus into the menu; arrows move, `Home` and `End` jump to the ends, `Tab` closes.
- The sign-out dialog traps focus and restores it to the trigger on close.

## Verification

Unit tests sit next to the component: `user-menu.test.tsx`. The whole flow (open → settings → close)
is covered by `app/src/features/account/tests/user-menu.browser.ts`.
