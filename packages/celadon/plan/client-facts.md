# 客户端事实（`platform/client/`）· 新面

- **版本**：v0.7（**已实施** 2026-10-04）
- **最后修改**：2026-10-04 17:10:30
- **规则**：[`15-platform.md`](../architecture/15-platform.md) §5 · 进度：[`02-platform.md`](02-platform.md)
- **先例**：`bridge/index.ts:28`（公共面聚合成一个对象）· `main.tsx:5`（i18n 在渲染前初始化完）

## 1. 一处装填，其余直接用

**异步只发生在装填那一下**：启动时 `await loadClient()` 把事实装满（清单 · 能力 · UA · 宿主就绪与版本 · `client_id`），
之后任何层读 `client.x` 都是**同步的直接读**。装填**幂等**；**失败即不可继续**（见下，不兜底）。

```ts
// main.tsx：渲染前装填（与 i18n 同一型）；失败渲染错误面
await loadClient()
```

```ts
// 任何地方：直接读，不再有异步、不再有探测
import { client } from '@/platform/client'

if (client.capabilities.serviceAddress) { … }   // 能不能
if (client.host.ready) { … }                    // 宿主就绪（Web 恒为 false）
const id = client.id                            // 装填后不再变，所以是普通字段
```

```ts
export type Client = {
  /** 客户端类型（构建清单里的 `client`）：'web' | 'desktop' */
  kind: ClientKind
  /** 构建目标系统 */
  os: TargetOs
  /** 构建清单原文 */
  manifest: Manifest
  /** 能力开关：剪贴板 · 文件 · 通知 · 外开 · **自己持服务地址** */
  capabilities: Capabilities
  /** 客户端与宿主版本（`client_id` 取装填后的值）*/
  info: ClientInfo
  /** 请求签名（UA 派生）*/
  signature: string
  /** `web-<随机>` / `desk-<机器码>`；装填时定下，之后不变 */
  id: string
  /** 宿主：**就绪与版本**（装填时问一次桥）。Web 恒为 `{ ready: false, version: '' }` */
  host: { ready: boolean; version: string }
  /** **动态读数**（不是事实）：当前偏好，随用户改 —— getter */
  readonly preferences: Preferences
  /** **动态读数**：一次请求的元数据，由当前偏好算出 —— getter */
  readonly metadata: RequestMetadata
}

/** 装填一次（幂等）：清单 · 能力 · UA · 宿主（ping 一次）· `client_id`。启动时 await。 */
export function loadClient(): Promise<Client>

export const client: Client
```

- **装填做四件事**：解析清单（同步）→ `capabilities`（Web 探测**一次**）→ 问一次桥 `ping`（拿宿主就绪与版本；桌面）→
  `client_id`（本地值 → 宿主机器码）。Web 没有桥：`host = { ready: false, version: '' }`，其余照常。
- **装填没有"降级成功"这一档**：**桌面**下宿主答不上来 —— 桥不可用 · 命令失败 · 超时 · 宿主版本没有这条命令 ——
  就是**不可继续的错误**：**转向错误页**，不拿本地随机值兜底（随机值只在 Web 是正确身份）。
  重试**允许**（重试是再装填一次），兜底**不允许**：带着随机身份继续跑会静默污染身份与后续判断。
- **错误面放在入口**（`main.tsx`）：`await loadClient()` 失败时路由还没起来，所以错误视图要能独立渲染 ——
  最小 DOM + 失败码 + "重试"，文案入语言包四语。
- **刷新页面会重装填**（模块作用域重来）——事实便宜且确定，重装得同一组值。
- **跨刷新稳定的东西不在这里**：`id` 落 `localStorage`（`client-id.ts:16,53-61`）· 会话令牌在 OS 凭据库 / Cookie · 服务地址在宿主的 `service.json`。
- `preferences` / `metadata` **不是事实**（用户会改、每请求不同），所以留 getter；对象上其余字段装填后只读。
- **模块顶层不许读 `client`**（import 求值早于入口那句 await）；只在函数 / 组件里读。

## 2. 导出函数名

| 导出 | 签名 | 变化 |
| --- | --- | --- |
| `client` | `Client`（对象）| **新增**：取代原来的一堆函数 |
| `loadClient` | `() => Promise<Client>` | **新增**：唯一装填入口（吸收 `primeClientId`）|
| 类型 `Client` · `ClientKind` · `TargetOs` · `Manifest` · `Capabilities` · `ClientInfo` · `UaInfo` · `Preferences` · `RequestMetadata` | — | 导出（`Client` 新增，其余照旧）|

**移除与内部化**：

| 名字 | 处理 | 外部引用（实测）|
| --- | --- | --- |
| `hasHost` | 从 `client/index.ts` 移除；实现留 `bridge/invoke.ts`，平台内部自用 | 12 处，上层 2 处（`verify` · `data-check`）|
| `capabilities` · `clientKind` · `targetOs` · `clientInfo` · `clientSignature` | 变成 `client` 的字段 | 5 · 2 · 0 · 4 · 0 |
| `clientId` · `currentPreferences` · `metadata` | 装填内部用 / 变成 getter | 6 · 2 · 2 |
| `primeClientId` | 并入 `loadClient` | 2 |
| `buildManifest` · `newClientId` · `randomId` · `parseUserAgent` · `uaInfo` | 内部化 | 4 · 0 · 0 · 0 · 0 |
| `useHostStatus`（`bridge/use-host-status.ts`）| **删除**：宿主就绪改为 `client.host`（装填时问一次，不再挂载时问）| 1（`hello`）|

**调用点逐个改**：

| 现在 | 改成 |
| --- | --- |
| `platform/credential/carrier.ts:6,11`（`clientKind()`）| `client.kind` |
| `features/verify/verify.tsx:23,39,40,41,52`（`clientInfo()` · `capabilities()` · `buildManifest()` · `hasHost()`）| `client.info` · `client.capabilities` · `client.manifest` · **`client.host.ready`** |
| `features/hello/hello.tsx:9,10,50,51,52`（`buildManifest()` · `clientInfo()` · `useHostStatus()`）| `client.manifest.version` · `client.info` · **`client.host`**（`ready` / `version`），删掉那个 hook |
| `main.tsx:17,23`（`primeClientId()`）| `await loadClient()` 放在 `createRoot(...).render(...)` 之前；失败走错误面 |
| `platform/transport/fetch.ts` · `platform/service/base.ts`（`hasHost`）| 不变（平台内部，直接从 `bridge/invoke` 取）|
| `data/hooks/use-request.ts:11`（`failureText`）| 不变（那是桥的译文，不是客户端事实）|

## 3. TODO（按顺序做）

- [x] 1. 新增 `client/facts.ts`：`Client` 类型 + `client` 对象 + `loadClient()`（幂等；**带超时**；失败即不可继续，**不兜底**）
- [x] 2. 装填内容：清单 · `capabilities`（Web 探测一次）· `ping` 一次（宿主就绪与版本）· UA 解析 · `client_id`（本地 → 宿主机器码）
- [x] 3. `client/index.ts` 公共面：移除 `hasHost` 与那 8 个函数导出；内部化 `buildManifest` · `newClientId` · `randomId` · `parseUserAgent` · `uaInfo`；`primeClientId` 并入 `loadClient`；删 `bridge/use-host-status.ts`
- [x] 4. 改调用点：`carrier.ts` · `verify.tsx` · `hello.tsx` · `main.tsx`（见 §2 表）
- [x] 5. 错误面：写在 `main.tsx`（最小 DOM · 失败码 · 重试），文案入语言包四语
- [x] 6. `platform/service/` 补 `readServiceAddress` / `writeServiceAddress`（包住两条宿主命令，命令名不外泄）+ 用例
- [x] 7. `capabilities` 增 `serviceAddress`（桌面真 / 浏览器假）+ 用例
- [x] 8. `data-check`：import 只留 `client` 与 `service`；页面用例假件跟着改
- [x] 9. 门禁：`features/` · `components/` · `routes/` 不许 import `@/platform/bridge`（白名单 `features/verify/**`）+ 正反样本
- [x] 10. 回写 `15-platform.md` §5（对象面 · 一处装填）与 `02-platform.md` 进度
- [x] 11. `pnpm lint` / `pnpm check` / `pnpm test` 全绿，并在 macOS 真客户端上过一遍 `/data-check`（读、写地址各一次，附截图）
- [x] 12. 用例：桌面 ping / 机器码失败 → 装填失败 → 错误面（**不是**随机 id）；Web → `host.ready === false` 且随机 id 是正常值

## 4. 已定的四点（原"待定"）

1. `verify` 判"有没有宿主"用 **`client.host.ready`** —— 它是装填时问出来的事实，比 `kind` 更准（kind 只说构建类型）。
2. `features/verify` 的 bridge 例外**认**：白名单写成 `features/verify/**`（它是桥检查页，用途就是逐条点名调命令）。
3. 会话的装填（`void loadSession()` 那个同源问题）**不在本批**：它是另一条 init 逻辑，后续单独封装。
4. 错误视图**写在 `main.tsx`**：它必须能在路由起来之前渲染，放平台模块反而多一层。
