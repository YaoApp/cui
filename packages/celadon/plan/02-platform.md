# 02 · 平台地基（产品级）

- **版本**：v0.1（计划）
- **最后修改**：2026-10-03 17:32:57
- **说明**：把平台层从"规范先行"做成产品级地基 · 依赖顺序 · 逐项验收 · 未定项

> **这份是计划，不是规范。** 规则在 [`../architecture/15-platform.md`](../architecture/15-platform.md)；
> 本文只回答"先做什么、做到什么算完成"。做完一项，把结论回写到 15 章。

## 0. 先行：`cui-desktop` 的 `celadon` 分支（宿主侧 rustapi）

**为什么排第 0 位**：平台层的**桌面侧**（凭据 IO · 本地服务 · tai · 更新 · 隧道）都要由 Rust 暴露给前端。
没有一个能**自由增删接口**的宿主分支，`bridge/` 与 `credential/` 就只能对着纸面写、写完也无处验。
所以先有宿主，再有平台层。

**要写哪些命令**：逐条在**桌面仓的 `plan/01-bridge-commands.md`**（名称/参数/返回/旧命令来源/状态）——
清单属宿主，随桌面仓实现更新，**本仓只写规则**。

**做什么**：在桌面壳仓库里**另开一条分支**，专门承载为开发与调试服务的 **rustapi**。

| 项 | 约定 |
| --- | --- |
| 分支 | `cui-desktop` 的 **`celadon`** 分支；**它自己的主分支不动** |
| 接口 | 一条能力一组命令；命名全称；**签名与 `../architecture/15-platform.md` §6 的 `bridge/` 一一对应** |
| 产物挂载 | celadon 的产物要挂在 **`/<namespace>/`** 下（否则桌面端整页空白；Web 与桌面**同一个命名空间**）|
| 调试接口 | 与正式接口**分区**：调试用的不进发布（发布产物里不带）|
| 谁不需要它 | **Web 下不存在** —— 所以前端一律先问能力开关再调（见 `../architecture/15-platform.md` §6）|

**todo**

- [ ] 从 `cui-desktop` 当前主线切出 `celadon` 分支
- [ ] 把 celadon 产物挂到 `/<namespace>/` 下，桌面壳能打开、深链能走
- [ ] 定 rustapi 的目录与命名约定（一个能力一组命令；与 `bridge/` 对齐）
- [ ] **最小可用**：凭据 IO（读 / 写 / 删）+ 一条健康检查 —— 用来打通"前端 → `bridge/` → Rust"这条链路
- [ ] 调试接口与正式接口分区

**验收**

1. celadon 在桌面壳里跑起来，`/<namespace>/` 下深链正常、不空白；
2. 前端经 **`bridge/`** 调到一条 rustapi 并拿到结果（这条链路有单元或浏览器层用例）；
3. 凭据写入 **OS 凭据库**（不是明文文件）；
4. 发布产物里**不含**调试接口。

**纪律**：跨仓库改动**只落在这条分支**；主分支不动；每条接口在 15 章 §6 有对应条目，没有对应就先补文档再写代码。

## 1. 要建的东西（`app/src/platform/` 下六个目录）

平台层现有 5 个：`theme/` · `router/` · `i18n/` · `icons/` · `utils/`。
**产品级地基还差六个**，它们有依赖顺序，不能并行乱做：

| # | 目录 | 职责 | 依赖 | 当前 |
| --- | --- | --- | --- | --- |
| 1 | `client/` | 客户端类型 · 能力开关 · UA 解析 · `client_id`（webview storage）| 无 | 未建 |
| 2 | `service/` | 服务信息（well-known）· **服务地址一处持有** | `client/` | 未建 |
| 3 | `credential/` | 凭据的存取与消费（按宿主选载体）· 刷新定时器 | `service/` · `bridge/`（桌面侧）| 未建 |
| 4 | `transport/` | **对外通信唯一出口**（`http(s)` + `ws(s)`）| `service/` · `credential/` | 未建 |
| 5 | `data/`（在 `app/src/`，不在 platform）| 接口类型（手写）+ 取数钩子 | `transport/` | 未建 |
| 6 | `bridge/` · `webproxy/` | 桌面宿主能力唯一入口 · agent sandbox 域名构造 | 桌面期 | 未建 |

## 2. 逐项 todo 与验收

### 2.1 `client/` —— 宿主是边界

- [ ] 客户端类型（`web` / `desktop`）与**能力开关**；UA 解析；`client_id` 存在 webview storage
- 验收：类型与能力**只在这里读一次**（铁律 4）；上层不许出现 `if (isDesktop)`；有单测覆盖两类宿主

### 2.2 `service/` —— 地址只有一处

- [ ] 读 well-known（`openapi` 前缀 · 名称 · 版本）；持有**服务地址**
- [ ] **Web**：只认托管方注入的**同域清单**（`name` + `path`），不许用户填地址；没注入 = 只有同源
- [ ] **Desktop**：地址由宿主配置（用户可填）；**先验证再写入**（探 well-known）
- [ ] **换服务 = 清凭据 + 重读 well-known**（清单内切换同样是换服务）
- 验收：`transport/` 只问它要基址；非法地址不被接受；换地址后旧凭据不再被使用

### 2.3 `credential/` —— 载体按宿主选

- [ ] Web：服务端下发的 **HttpOnly 安全 Cookie**（JS 不接触）
- [ ] Desktop：**Bearer**，存 **OS 凭据库**（`keyring` 4.x，经 `bridge/`）；**不做明文回退**
- [ ] 刷新：启动一次 + 每 6 小时（**定时器只在这里**）
- [ ] 401 的刷新与重放放 `transport/`（不是这里）
- 验收：凭据不落日志、不进前端存储；键位与读取失败路径有单测

### 2.4 `transport/` —— 唯一出口

- [ ] `http(s)` 与 `ws(s)` 都从这里出；基址解析；**注入凭据但不覆盖显式 `Authorization`**
- [ ] 错误归一（一种形状）；401 → 刷新并重放
- [ ] **不定义**各接口的 wire 格式（那是各 API 自己的事）
- 验收：组件与 feature 里不出现 `fetch` / `EventSource` / `new WebSocket`；**这条要变成检查器**（见 §4）

### 2.5 `data/` —— 接口类型与取数

- [ ] 接口类型**手写**（不由代码生成）；取数钩子（加载 / 错误 / 取消 / 重试的唯一实现）
- [ ] 定掉 `../architecture/05-data-and-api.md` §7 的四条未定：钩子返回形状 · `sandbox` 域去留 · 旧 `openapi/` 71 个文件的处置 · 错误形状的字段
- 验收：上层不拼 URL、不重复实现四态；每条接口面有类型

### 2.6 `bridge/` · `webproxy/`（桌面期）

- [ ] `bridge/`：桌面能力唯一入口（凭据 IO · 本地服务 · tai · 更新 · 隧道 · 系统集成）；**只有它能调 `invoke`**
- [ ] `webproxy/`：agent sandbox 服务访问的域名构造规则
- [ ] 配套 **`cui-desktop`**：见 **§0**（`celadon` 分支 + 产物挂载）
- 验收：Web 下这两处不存在；调用前先问能力开关

## 3. 未定项（做之前必须先定）

| # | 未定 | 卡住谁 |
| --- | --- | --- |
| 1 | 取数钩子的返回形状（四态字段与判别方式）| `data/` |
| 2 | 错误形状的具体字段 | `data/` · `transport/` |
| 3 | Web 侧"清凭据"的落地方式（Cookie 是 HttpOnly，前端清不掉）| `credential/`（可能与登出接口一起定）|
| 4 | `sandbox` 域是否属于前端要消费的接口面 | `data/` |

## 4. 门禁（随实现长，不预先写全）

- [ ] **组件 / feature 不发请求**：`features/` · `components/` · `routes/` 里不许出现 `fetch` / `EventSource` / `new WebSocket`（等 `transport/` 落地后加检查器，配正反样本）
- [x] 依赖方向：已有 `scripts/check-import-boundaries.mjs`
- [ ] 网格尺寸走 token：等 `--size-*` 类 token 出现后再加规则

## 5. 每项的完成口径

一项做完 = **实现 + 测试（单元 / 浏览器按层选）+ `pnpm check` 通过 + 拟人层截图（若动到画面）**；
按 [`../architecture/SPEC.md`](../architecture/SPEC.md) §8 走，交付前按 [`../architecture/REVIEW.md`](../architecture/REVIEW.md) 过一轮隔离审核。
