# 05 · 数据与接口

- **版本**：v1.29
- **最后修改**：2026-10-03 09:31:48
- **说明**：传输 · 鉴权 · 后端 SDK · 取数钩子 · 流式

## 规则

- **传输**：原生 **`fetch`**（不用 axios）；统一走 `platform/transport/`（见 `15-platform.md` §4.4）。
- **鉴权**：**cookie**（`credentials: 'include'`）+ **CSRF token** → 必须**同源**。
- **组件取数**：一律走 `openapi/` 封装，**组件内不直接 `fetch`**。
- **加载 / 错误 / 取消 / 重试**：由**自建小钩子**统一实现（一处实现，全站复用）；**不引数据缓存库**。
- **流式**：SSE 用 `EventSource`（GET + cookie）或 fetch 流；**WebSocket 单独实现** —— 都不归缓存库管。
- **错误形状**：所有接口错误归一为同一形状（`code` / `message` / `status`），（形状固定，别让各接口各写一套。）

## 接口类型（`app/src/data/`）

- **手写强类型，不从 `openapi` 生成** —— 服务端没有机器可读的文档；well-known 的 `openapi` 字段只是**接口前缀**
  （实测 `/v1/openapi.json` · `/openapi.json` · `/v1/doc` · `/.well-known/openapi.json` 等路径均 404）。
- **形状约定**：可空性照服务端实际（`string | null`）· 可选字段用 `?` · 枚举用**字符串联合**（不用 `enum`）。
- **只放类型与取数钩子**，**没有请求逻辑** —— 对外通信统一走 `platform/transport/`。
- **feature 不许**自己拼 URL、自己读 token、自己建 WebSocket。
- **漂移靠测试发现**：类型手写，接口契约由浏览器层与拟人层对着真实后端验证（见 `14-testing.md`）。

## 禁止

- 不许在组件里写 `fetch` / `EventSource` / `new WebSocket`。
- 不许引 axios / SWR / TanStack Query 等数据层库。
