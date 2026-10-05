# `data/user` — the sign-in line

The declarations the sign-in and account screens need: entry configuration, the two-step verify →
register/login, captcha, one-time codes, invitations, sign-out, third-party sign-in, the device flow, and the
keys for verifying an ID token.

## Files

| File | What is in it |
| --- | --- |
| `types.ts` | Hand-written wire shapes. Nullability follows the service; enums are string unions; field names are not renamed. |
| `api.ts` | Declarations only — method, path, in/out types. No base URL, no auth, no error handling: all of that lives in `platform/transport/`. |
| `keys.ts` | One key per declaration, derived with `keyOf`, so subscription and invalidation share one algorithm. |
| `queries.ts` | Pairs (`{ key, request }` for reads, `{ key, operation }` for writes) plus `logoutQuery`. |
| `index.ts` | The domain's public surface; callers import from `@/data`, never from these files directly. |
| `entry-fields.test.ts` | Field-level contract: real response bodies captured from the dev backend, typed and asserted. |
| `tests/entry.contract.browser.ts` | A live walk over every declaration through the dev server's same-origin proxy. |

## The declarations

| Declaration | Call | Language comes from |
| --- | --- | --- |
| `entryConfig` | `GET /user/entry` | query (`locale`) |
| `entryVerify` | `POST /user/entry/verify` | body `locale`, falling back to the query |
| `entryRegister` | `POST /user/entry/register` | body `locale` |
| `entryLogin` | `POST /user/entry/login` | body `locale` |
| `entryOtp` | `POST /user/entry/otp` | query via the context |
| `entryCaptcha` | `GET /user/entry/captcha` | — (optional `captcha_id`) |
| `entryInvite` | `POST /user/entry/invite/verify` | query via the context |
| `logout` | `POST /user/logout` | — |
| `oauthAuthorize` | `GET /user/oauth/:id/authorize` | query via the context |
| `oauthCallback` | `POST /user/oauth/:id/callback` | body `locale` |
| `deviceAuthorize` | `POST /oauth/device/authorize` | — |
| `deviceFlowStart` | `POST /user/oauth/:providerId/device/authorize` | — |
| `deviceFlowToken` | `POST /user/oauth/:providerId/device/token` | body `locale` |
| `oidcKeys` | `GET /oauth/jwks` | — |

Register, login, invite and OTP carry a **temporary token** in `Authorization` via `RequestOptions.headers`.
It never enters the credential store and is dropped after the call.

## Rules this domain follows

- **The context carries the metadata.** `send()` adds `locale` and `accept` as query parameters and
  `X-Locale` / `Accept-Language` / `X-Yao-Accept` as headers; call sites pass nothing. The sign-in endpoints
  read only the headers, `GET /user/entry` only the query — hence the table above.
- **Failures are values, read by code.** The transport normalises everything to `{ code, params, message }`;
  the screen renders `data.error.<code>` from the language packs (`utils/error-text.ts`), never `message`.
- **No transport here.** No `fetch`, no `Authorization` string building beyond the temporary token, no cookies.
- **The service sends bare JSON.** `RespondWithSuccess` is `c.JSON(status, data)` — there is no `data`
  envelope in this domain, so `unwrap` passes values through untouched.

## Verifying

```bash
pnpm test                                        # unit, with the captured-body contract
pnpm exec vitest run app/src/data/user --coverage # 100% on api.ts, keys.ts, queries.ts
# live, through the dev server's same-origin proxy:
YAO_SERVER_HOST=http://<dev-backend-host>:5099 \
  pnpm exec playwright test app/src/data/user/tests/entry.contract.browser.ts
```

The live walk skips when `YAO_SERVER_HOST` is unset, so it never blocks CI; it needs a reachable instance.

## Known limits

Five success branches cannot be reached against the current dev configuration and are therefore covered by
fixtures with their provenance written down, not by a live pass: OTP (the configuration does not require a
code), invitation redemption (no valid code), the OAuth callback and both device-flow successes (they need a
real identity-provider round trip). Everything else was exercised against the running service.
