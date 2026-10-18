# features/account

`features/account` owns the account menu's business side: it reads the profile and usage, maps them to
the menu view model, and keeps the settings shell and the external addresses. Sign-out itself stays in
the assembly layer, next to the other auth wiring.

| File | Contents |
| --- | --- |
| `hooks/use-account-menu.ts` | Profile + usage queries → `status`, name, plan, avatar, team and usage. |
| `settings-shell.tsx` | The settings window shell: the three entry sections and placeholder bodies. |
| `settings-shell.less` | Two-pane layout of that shell. |
| `links.ts` | Home, help and docs addresses; docs follow the interface language. |
| `locales/` | Settings shell copy in four languages. |

## Data

`useAccountMenu` calls `accountProfileQuery()` and `accountUsageQuery()` from `data/user`. When
`VITE_ACCOUNT_MOCK=1` the data layer answers from `data/user/mock.ts`, so the menu can be built before
the engine endpoints exist.

## Boundaries

- The menu component stays presentational; all data and actions come through props from here.
- Opening an external address goes through `openUrl` on the `platform/client` face; this feature does not know about the host bridge.
- The settings shell is deliberately thin: the next layer fills the sections, this layer only proves
  the menu entries land somewhere.

## Verification

- `hooks/use-account-menu.test.tsx` — status mapping and retry.
- `settings-shell.test.tsx` — sections, switching, closing.
- `tests/user-menu.browser.ts` — the full path in a real browser.
