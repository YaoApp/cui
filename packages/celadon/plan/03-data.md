# 03 · 数据层（`data/`）

- **版本**：v0.1（计划）
- **最后修改**：2026-10-04 07:02:22
- **说明**：把接口类型与取数钩子从"规范先行"做成可用层 · 依赖顺序 · 逐项验收 · 未定项
- **事实基础**：[data-legacy-openapi.md](data-legacy-openapi.md)（旧 `openapi/` 71 文件的现状报告 · 临时）

> **规则**在 [`../architecture/05-data-and-api.md`](../architecture/05-data-and-api.md) 与 [`17-transport.md`](../architecture/17-transport.md)；本文只回答"先做什么、做到什么算完成"，**不复制规则**。

## 0. 当前进度

| 项 | 状态 | 证据 |
| --- | --- | --- |
| 3.0 定未定项（错误 · 分页/包裹 · 流式 · 钩子形状 · 上传下载入口）| ⏸ **先决** | 见 §3 |
| 3.1 类型底座（错误 · 列表 · 出站上下文）| ⏸ | 依赖 3.0 |
| 3.2 逐域接口面 | ⏸ | 依赖 3.1 |
| 3.3 取数钩子（`app/src/data/hooks/use-request.ts`）| ⏸ | 依赖 3.1 |
| 3.4 上传 / 下载 / 流式 | ⏸ | 依赖 `transport/` 的两档（`17 §2.2`）|

## 1. 目标（做完是什么样）

- 上层只 `import` 到域：拿到**类型 + 方法声明**，**看不到** URL 拼接 · `fetch` · cookie · 错误分支
- `features/` · `components/` · `routes/` 里不出现 `fetch` / `EventSource` / `new WebSocket`
- **四态只有一处实现**（旧代码 133 个文件手写四态、`useRobots.ts` 615 行是典型）

## 2. 依赖

- **已就绪**：`platform/transport/`（http · 失败归一 · 限制由调用方给）· `platform/service/`（基址 · well-known）· `platform/credential/`（载体按宿主选）
- **未就绪、卡住 3.4**：`transport/` 的 `idleMs`/`maxBytes` 与 `download`/`stream` 两档（`17 §2.2` · `plan/02 §2.4`）
- **数据来源**：旧 `packages/cui/openapi/**` —— **只读参考**（类型可搬，带 `fetch`/cookie/URL 的一律重写，见报告 §6）

## 3. 逐项 todo 与验收

### 3.0 先定未定项（**定完回写 `05 §7`**）

- [ ] **列表/分页包裹**：定一个形状（旧代码有四套：`pagecount`/`pagecnt`/`totalPages`/`next+prev`）
- [ ] **服务端业务错误体**：字段清单 · 与 `transport/` 的 `{code, params, message}` 怎么接 · 字段级校验错误怎么表达
- [ ] **成功包裹**：有没有信封（旧代码 `result.data || result` 兜）
- [ ] **流式事件形状与事件名**（含命令型 WS 的请求类型；旧代码三套并存）
- [ ] **上传/下载的前端调用面**：下载返回 `URL` 还是宿主命令 · 进度怎么传 · 分片协议归谁
- [ ] `sandbox` 域去留 · Web 端**"查会话"端点** · **CSRF 是否仍需要**（若需要，注入点只能在 `transport/`）
- 验收：`05 §7` 的未定项**逐条变成已定**，每条有落点；定不了的**写清卡在谁**

### 3.1 类型底座

- [ ] 公共类型：错误 · 分页/列表 · **出站上下文**（locale · timezone · theme · client）
- [ ] 迁移旧**手写类型**（可直接搬的那 ~4,900 行）：`chat/types.ts` + 守卫 · 10 个域 `types.ts` · `JWK/JWKs` · `File*`
- 验收：新增**无 `any`**；分页/包裹**只有一种命名**；`data/` **不 import 页面层**（旧代码反向依赖 6 处）

### 3.2 逐域接口面（`05 §2` 的域表，一域一处）

- [ ] 先做**一个真实域做样板**（建议 `user`，因为与 `credential/` 联动最紧），再铺 `setting` · `agent` · `file` · `workspace` · `chat` · `llm/mcp/sandbox`
- [ ] 方法只声明"路径 + 输入/输出类型"；**不出现** `fetch` · `Authorization` · cookie · 自拼 URL · 旧助手（`GetData`/`IsError`）
- 验收：每条接口**有类型**；`grep` 该域**零** `fetch`/`new URL`

### 3.3 取数钩子（`app/src/data/hooks/use-request.ts`）

- [ ] 加载 / 错误 / 取消 / 重试的**唯一实现** + 统一返回形状（`05 §7` 未定项 1）
- [ ] 先在一个域上落地（样板），再替换其余
- 验收：`features/`/`components/` **不重复实现四态**；有一套用例覆盖四态与取消

### 3.4 上传 / 下载 / 流式

- [ ] **上传**：单文件 + 分片（旧 `file.ts:353–514` 的 `Content-Range/Sync/Uid` 协议）经 `transport/`，带进度
- [ ] **下载**：**不整份进内存**（`17 §2.2`）；Web/Desktop 同一个接口（桌面走宿主）
- [ ] **SSE / WS**：接线 · 鉴权 · 重连归 `transport/`；`data/` 只描述消息形状
- 验收：旧的 **4 处下载** · **2 处上传** · **3 套流式** 不再各写一份

## 4. 未定项（做之前必须先定）

| # | 未定 | 卡住谁 |
| --- | --- | --- |
| 1 | 取数钩子的四态字段与判别方式 | 3.3 |
| 2 | 服务端错误体的最终字段清单 | 3.0 · 3.1 |
| 3 | `sandbox` 域是否属于前端要消费的接口面 | 3.2 |
| 4 | Web 端"查会话"的端点（与 `credential/` 联动）| 3.2 |

（另：错误形状与传输失败的对应、`data/` 的内存缓存与换服务失效 —— 见报告 §7 第 2/6 条。）

## 5. 门禁（随实现长，不预先写全）

- [ ] **组件 / feature 不发请求**：`features/` · `components/` · `routes/` 里不许出现 `fetch` / `EventSource` / `new WebSocket`（配**正反样本**）
- [x] 依赖方向：已有 `scripts/check-import-boundaries.mjs`（**`data/` 不许 import `features/`** 已覆盖）
- [ ] `data/` 的类型**不许出现 `any`**（新增为 0；旧类型搬运时逐条收）

## 6. 每项的完成口径

一项做完 = **实现 + 用例（单测/浏览器，按 `SPEC.md` §8）+ `pnpm check` 通过 + 回写 `05`**；交付前按 [`14-review.md`](../architecture/REVIEW.md) 走一轮隔离审核。
