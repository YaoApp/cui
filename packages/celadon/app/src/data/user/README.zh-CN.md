# `data/user` —— 登录一线

登录与账号页面所需的接口声明：入口配置 · 两步的 verify → 注册/登录 · 图形验证码 · 一次性口令 · 邀请兑换 ·
退出 · 第三方登录 · 设备码流 · 以及验 ID Token 用的公钥。

## 文件

| 文件 | 内容 |
| --- | --- |
| `types.ts` | 手写线上形状。可空性照服务端；枚举用字符串联合；字段名不改写。 |
| `api.ts` | 只有声明 —— 方法 · 路径 · 进出类型。基址 · 鉴权 · 错误归一都在 `platform/transport/`，这里看不到。 |
| `keys.ts` | 一条声明一个 key，用 `keyOf` 推导 —— 订阅与失效共用同一算法。 |
| `queries.ts` | 取数对（读 `{ key, request }`，写 `{ key, operation }`）与 `logoutQuery`。 |
| `index.ts` | 域的对外面；调用方从 `@/data` 取，不伸手进这些文件。 |
| `entry-fields.test.ts` | 字段级契约：从 dev 后端真实抓取的响应体，标注成类型并断言。 |
| `tests/entry.contract.browser.ts` | 走遍每条声明的**活体**走查，经 dev server 的同域代理。 |

## 声明一览

| 声明 | 调用 | 语言从哪来 |
| --- | --- | --- |
| `entryConfig` | `GET /user/entry` | query（`locale`） |
| `entryVerify` | `POST /user/entry/verify` | body `locale`，回落 query |
| `entryRegister` | `POST /user/entry/register` | body `locale` |
| `entryLogin` | `POST /user/entry/login` | body `locale` |
| `entryOtp` | `POST /user/entry/otp` | 由 ctx 带在 query |
| `entryCaptcha` | `GET /user/entry/captcha` | —（可选 `captcha_id`） |
| `entryInvite` | `POST /user/entry/invite/verify` | 由 ctx 带在 query |
| `logout` | `POST /user/logout` | — |
| `oauthAuthorize` | `GET /user/oauth/:id/authorize` | 由 ctx 带在 query |
| `oauthCallback` | `POST /user/oauth/:id/callback` | body `locale` |
| `deviceAuthorize` | `POST /oauth/device/authorize` | — |
| `deviceFlowStart` | `POST /user/oauth/:providerId/device/authorize` | — |
| `deviceFlowToken` | `POST /user/oauth/:providerId/device/token` | body `locale` |
| `oidcKeys` | `GET /oauth/jwks` | — |

注册 · 登录 · 邀请 · 重发口令这四条带**临时令牌**，经 `RequestOptions.headers` 放 `Authorization`。
它不进凭据库，调用完即弃。

## 本域遵守的规矩

- **元数据由 ctx 带**：`send()` 自动加 query `locale`/`accept` 与头 `X-Locale`/`Accept-Language`/`X-Yao-Accept`，
  调用点什么都不传。登录相关接口**只认头**，而 `GET /user/entry` **只认 query** —— 这就是上表那一列的意义。
- **失败是值、按码翻译**：出口统一成 `{ code, params, message }`；界面取语言包的 `data.error.<code>`
  （`utils/error-text.ts`），**不看 `message`**。
- **本层不做传输**：没有 `fetch`，除临时令牌外不拼 `Authorization`，不读写 Cookie。
- **服务端回裸 JSON**：`RespondWithSuccess` 就是 `c.JSON(status, data)`，本域**没有 `data` 壳**，
  `unwrap` 原样透传。

## 怎么验

```bash
pnpm test                                         # 单元（含真实响应体契约）
pnpm exec vitest run app/src/data/user --coverage  # api.ts / keys.ts / queries.ts 四项 100%
# 活体：经 dev server 的同域代理
YAO_SERVER_HOST=http://<dev-backend-host>:5099 \
  pnpm exec playwright test app/src/data/user/tests/entry.contract.browser.ts
```

活体走查在未给 `YAO_SERVER_HOST` 时**显式跳过**，因此不会拖红 CI；它需要一个可达的实例。

## 已知边界

五条成功分支在当前 dev 配置下不可达，因此由**标注了来源的 fixture** 覆盖，而不是活体验证：重发口令
（本配置不需要验证码）· 邀请兑换（没有有效邀请码）· OAuth 回调与设备码流的两个成功（都需要真实的
身份提供方往返）。其余全部对着运行中的服务实跑过。
