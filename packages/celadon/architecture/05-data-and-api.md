# 05 · 数据与接口

- **版本**：v1.5
- **最后修改**：2026-10-02 13:47:38
- **说明**：传输 · 鉴权 · 后端 SDK · 取数钩子 · 流式

## 规则

- **传输**：原生 **`fetch`**（不用 axios）；类型化客户端从旧仓库 **`openapi/`** 搬**按需子集**，去掉旧框架耦合。
- **鉴权**：**cookie**（`credentials: 'include'`）+ **CSRF token** → 必须**同源**。
- **组件取数**：一律走 `openapi/` 封装，**组件内不直接 `fetch`**。
- **加载 / 错误 / 取消 / 重试**：由**自建小钩子**统一实现（一处实现，全站复用）；**不引数据缓存库**。
- **流式**：SSE 用 `EventSource`（GET + cookie）或 fetch 流；**WebSocket 单独实现** —— 都不归缓存库管。
- **错误形状**：所有接口错误归一为同一形状（`code` / `message` / `status`），见 `plan/01` §4 子项 2 的验收。

## 禁止

- 不许在组件里写 `fetch` / `EventSource` / `new WebSocket`。
- 不许引 axios / SWR / TanStack Query 等数据层库。

## 待讨论

- `openapi/` 的目录名与出口形态（`openapi/<domain>.ts`？一个 `api/` 门面？）。
- 取数钩子的签名（`useRequest(fetcher, deps, options)`），以及它与 `zustand` 的分工。
