# data/user

`data/user` is the module in the data access layer that covers user and sign-in interfaces. It provides the
wire types, the interface declarations, the cache keys and the sources consumed by `useRequest`. Sign-in,
registration and account screens reach the service through this module.

## Contents

| File | Contents |
| --- | --- |
| `types.ts` | Hand-written wire types. Nullability follows what the service returns; enums are string unions; field names are not renamed. |
| `api.ts` | Interface declarations only, namely method, path and in/out types. Base URL, authentication and error normalisation live in `platform/transport/`. |
| `keys.ts` | One cache key per declaration, derived with `keyOf`, so subscription and invalidation share one algorithm. |
| `queries.ts` | The `{ key, ... }` sources consumed by `useRequest`. Reads provide `request` or `build(ctx)`; writes provide `operation`. `logoutQuery` is also here. |
| `index.ts` | The module's public surface. Callers import from `@/data` and do not reference the files above directly. |
| `entry-fields.test.ts` | Field-level contract tests. The fixtures are response bodies captured from the development backend, typed and then asserted. |
| `tests/entry.contract.browser.ts` | A live walk over every declaration, reaching the running service through the development server's same-origin proxy. |

## Declarations

| Declaration | Request |
| --- | --- |
| `entryConfig` | `GET /user/entry` |
| `entryVerify` | `POST /user/entry/verify` |
| `entryRegister` | `POST /user/entry/register` |
| `entryLogin` | `POST /user/entry/login` |
| `entryOtp` | `POST /user/entry/otp` |
| `entryCaptcha` | `GET /user/entry/captcha` |
| `entryInvite` | `POST /user/entry/invite/verify` |
| `logout` | `POST /user/logout` |
| `oauthAuthorize` | `GET /user/oauth/:id/authorize` |
| `oauthCallback` | `POST /user/oauth/:id/callback` |
| `deviceAuthorize` | `POST /oauth/device/authorize` |
| `deviceFlowStart` | `POST /user/oauth/:providerId/device/authorize` |
| `deviceFlowToken` | `POST /user/oauth/:providerId/device/token` |
| `oidcKeys` | `GET /oauth/jwks` |

Registration, sign-in, invitation and one-time-code delivery carry a **temporary token**. The token is placed in
the `Authorization` header through `RequestOptions.headers`; it is not written to the credential store and is
discarded once the call returns.

## Language handling

A caller never passes `locale`: it is not placed in a request body, not appended to a query string and not added
as a header. There is exactly one source of language, namely the context. `send()` puts the platform's current
language into the request metadata, and this layer delivers it to the place each endpoint actually reads. Those
places differ: some endpoints read the query string, most sign-in endpoints read the request body, and the
sign-in handlers read only request headers. Which place an endpoint reads is an implementation detail of this
layer and is not part of the module's public contract.

The service is not yet uniform about this. This layer normalises the difference first, and the service is expected
to follow. Until then the adaptation stays inside this layer, and callers above it need not know about it.

## Usage

Callers import `useRequest` from `@/data` and this module's sources from `@/data/user`. Nothing else has to be
supplied: no URL, no cache key and no language.

### Reading

A read runs once the component mounts.

```tsx
import { useRequest } from '@/data'
import { entryConfigQuery } from '@/data/user'

const { state, run } = useRequest(entryConfigQuery())

if (state.status === 'loading') return <Spinner />
if (state.status === 'error') return <p>{state.failure.text}</p>   // translated from the error code
const config = state.value                                        // EntryConfig
```

### Writing

A write sets `manual: true` and is started by calling `run()`.

```tsx
const { state, run } = useRequest(entryVerifyQuery({ username }), { manual: true })
await run()          // resolves after this call's state has been committed
```

Writes that carry a temporary token take the token as their first argument, for example
`entryLoginQuery(token, input)`, `entryRegisterQuery(token, input)`, `entryOtpQuery(token)`,
`entryInviteQuery(token, input)`, `oauthCallbackQuery(id, input)` and
`deviceFlowTokenQuery(providerId, input)`. The token is placed in a request header by this layer, discarded once
the call returns and never stored.

### Other sources

```ts
entryCaptchaQuery(captchaId?)        // omit the argument to obtain a new captcha
oauthAuthorizeQuery(id, redirectUri?)
deviceFlowStartQuery(providerId)
deviceAuthorizeQuery(input)
oidcKeysQuery()                      // signing keys
logoutQuery()                        // an action; call it with manual
```

### Selecting a language for a single call

```tsx
const { state } = useRequest(entryConfigQuery(), { preferences: { locale: 'ja' } })
```

This is the only override, and it exists only inside the hook. The module never gains a `locale` parameter.

### Invalidating and re-reading

```ts
import { invalidate } from '@/data'
import { userKeys } from '@/data/user'

invalidate(userKeys.all)             // prefix hit: every read in this module runs again
```

### Using the module outside React

```ts
import { send } from '@/data'
import { entryConfig } from '@/data/user'

const result = await send(entryConfig({ locale: 'ja' }))   // the language has to be supplied here
```

## Design constraints

- Request metadata is carried by the context. `send()` adds the language and `accept` to every request, and call
  sites pass nothing. Whether the language travels in the query string, the request body or a header is decided
  by this layer, endpoint by endpoint.
- Failures are returned as values and read by error code. The transport layer normalises every failure into
  `{ code, params, message }`; the interface reads the text for `data.error.<code>` from the language packs
  (see `utils/error-text.ts`) and never uses `message`.
- This layer does not implement transport. There is no `fetch` here, no `Authorization` is assembled beyond the
  temporary token, and no cookie is read or written.
- The service returns JSON without a wrapper. `RespondWithSuccess` is implemented as `c.JSON(status, data)`, so
  responses in this module have no `data` envelope and `unwrap` passes values through unchanged.

## Verification

```bash
pnpm test                                        # unit tests, including the captured-body contract
pnpm exec vitest run app/src/data/user --coverage # 100% on api.ts, keys.ts, queries.ts
# live, through the development server's same-origin proxy:
YAO_SERVER_HOST=http://<dev-backend-host>:5099 \
  pnpm exec playwright test app/src/data/user/tests/entry.contract.browser.ts
```

The live walk skips when `YAO_SERVER_HOST` is unset, so it never blocks continuous integration; running it
requires a reachable service instance.

## Known limitations

Five success branches cannot be reached against the current development configuration and are therefore covered
by fixtures with their provenance recorded, rather than by a live pass: one-time-code delivery (the current
configuration does not require a code), invitation redemption (no valid invitation code is available), the OAuth
callback, and the two device-flow successes (they need a real identity-provider round trip). Every other
interface has been verified against the running service.
