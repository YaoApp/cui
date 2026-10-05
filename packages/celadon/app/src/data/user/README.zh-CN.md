# data/user

`data/user` 是数据访问层中负责用户与登录相关接口的模块。它提供这些接口的线上数据结构、接口声明、
缓存键，以及供 `useRequest` 使用的取数对象。登录页、注册页与账号相关的页面都通过本模块访问服务端。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `types.ts` | 手写的线上数据结构。字段的可空性依照服务端的实际返回；枚举使用字符串联合；字段名不做改写。 |
| `api.ts` | 只包含接口声明，即方法、路径与进出类型。基址、鉴权与错误归一不在这里，它们位于 `platform/transport/`。 |
| `keys.ts` | 每条声明对应一个缓存键，由 `keyOf` 推导，因此订阅与失效共用同一套算法。 |
| `queries.ts` | 供 `useRequest` 使用的 `{ key, ... }` 取数对象。读取接口提供 `request` 或 `build(ctx)`，提交接口提供 `operation`；此外还有 `logoutQuery`。 |
| `index.ts` | 本模块对外的出口。调用方从 `@/data` 引入，不直接引用上述文件。 |
| `entry-fields.test.ts` | 字段级契约测试。测试数据是从开发后端真实抓取的响应体，标注成类型后断言。 |
| `tests/entry.contract.browser.ts` | 覆盖全部接口声明的活体走查，经由开发服务器的同源代理访问真实服务。 |

## 接口清单

| 接口声明 | 请求 |
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

注册、登录、邀请与重发一次性口令这四个接口需要携带**临时令牌**。令牌由 `RequestOptions.headers`
放入 `Authorization` 请求头，不写入凭据库，调用结束后立即丢弃。

## 语言处理约定

调用方在任何情况下都不传 `locale`，既不放进请求体，也不拼进查询串，更不添加请求头。
语言只有一个来源，即上下文：`send()` 会把平台当前语言放入请求元数据，本层再把它送到各接口实际
读取语言的位置。各接口读取语言的位置并不一致：有的读取查询串，登录相关的接口多数读取请求体，
而登录处理函数只读取请求头。语言送达的位置属于本层的实现细节，不构成模块的对外约定。

服务端目前尚未统一这件事。本层先行规范化，后续由服务端对齐；在此之前，这项适配只保留在本层内部，
上层调用方不需要了解。

## 使用方式

调用方从 `@/data` 引入 `useRequest`，从 `@/data/user` 引入本模块的取数对象。除此之外不需要提供任何内容，
既不必写 URL，也不必写缓存键，更不必指定语言。

### 读取接口

读取接口在组件挂载之后自动执行。

```tsx
import { useRequest } from '@/data'
import { entryConfigQuery } from '@/data/user'

const { state, run } = useRequest(entryConfigQuery())

if (state.status === 'loading') return <Spinner />
if (state.status === 'error') return <p>{state.failure.text}</p>   // 已按错误码翻译
const config = state.value                                        // EntryConfig
```

### 提交接口

提交接口需要设置 `manual: true`，再调用 `run()`。

```tsx
const { state, run } = useRequest(entryVerifyQuery({ username }), { manual: true })
await run()          // 本次调用的 state 提交之后才 resolve
```

需要携带临时令牌的提交接口，把令牌作为第一个参数传入，例如 `entryLoginQuery(token, input)`、
`entryRegisterQuery(token, input)`、`entryOtpQuery(token)`、`entryInviteQuery(token, input)`、
`oauthCallbackQuery(id, input)` 与 `deviceFlowTokenQuery(providerId, input)`。
令牌由本层放入请求头，调用结束后立即丢弃，不写入任何存储。

### 其余接口

```ts
entryCaptchaQuery(captchaId?)        // 省略参数即获取新的验证码
oauthAuthorizeQuery(id, redirectUri?)
deviceFlowStartQuery(providerId)
deviceAuthorizeQuery(input)
oidcKeysQuery()                      // 验签公钥
logoutQuery()                        // 动作，建议以 manual 方式调用
```

### 指定本次调用的语言

```tsx
const { state } = useRequest(entryConfigQuery(), { preferences: { locale: 'ja' } })
```

这是唯一的语言覆盖入口，并且只存在于钩子内部。本模块永远不会增加 `locale` 参数。

### 使缓存失效并重新获取

```ts
import { invalidate } from '@/data'
import { userKeys } from '@/data/user'

invalidate(userKeys.all)             // 前缀命中，本模块的读取接口全部重新执行
```

### 在 React 之外使用

```ts
import { send } from '@/data'
import { entryConfig } from '@/data/user'

const result = await send(entryConfig({ locale: 'ja' }))   // 此处需要自行提供语言
```

## 设计约束

- 请求元数据由上下文携带。`send()` 为每个请求添加语言与 `accept`，调用点不传任何内容；
  至于语言走查询串、请求体还是请求头，由本层按接口决定。
- 失败以值的形式返回，由调用方按错误码读取。运输层把所有失败归一为 `{ code, params, message }`；
  界面从语言包读取 `data.error.<code>` 对应的文案（见 `utils/error-text.ts`），不使用 `message`。
- 本层不实现传输。这里没有 `fetch`，除临时令牌之外不拼接 `Authorization`，也不读写 Cookie。
- 服务端返回不带包装的 JSON。`RespondWithSuccess` 的实现是 `c.JSON(status, data)`，
  本模块的响应没有 `data` 外层，因此 `unwrap` 原样透传。

## 验证方式

```bash
pnpm test                                        # 单元测试，含抓取响应体的契约
pnpm exec vitest run app/src/data/user --coverage # api.ts、keys.ts、queries.ts 覆盖率 100%
# 活体验证，经开发服务器的同源代理：
YAO_SERVER_HOST=http://<dev-backend-host>:5099 \
  pnpm exec playwright test app/src/data/user/tests/entry.contract.browser.ts
```

未设置 `YAO_SERVER_HOST` 时活体走查会跳过，因此不会阻塞持续集成；执行时需要有一个可访问的服务实例。

## 已知限制

以下五条成功分支在当前开发配置下无法触达，因此只由记录了来源的测试夹具覆盖，而不是活体验证：
一次性口令（当前配置不要求验证码）、邀请兑换（没有有效邀请码）、OAuth 回调，
以及设备码流程的两条成功分支（需要真实身份提供方完成往返）。其余接口都已经对运行中的服务验证过。
