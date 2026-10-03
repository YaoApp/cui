# 02 · 平台地基（产品级）

- **版本**：v0.2（计划 + 进度）
- **最后修改**：2026-10-03 21:46:11
- **说明**：把平台层从"规范先行"做成产品级地基 · 依赖顺序 · 逐项验收 · 未定项

> **这份是计划，不是规范。** 规则在 [`../architecture/15-platform.md`](../architecture/15-platform.md)；
> 本文只回答"先做什么、做到什么算完成"。做完一项，把结论回写到 15 章。

## 0. 当前进度（2026-10-03）

| 项 | 状态 | 证据 / 落在哪 |
| --- | --- | --- |
| **2.1 `client/`** | ✅ **完成** | `manifest` · `ua`（含 WebView 兜底）· `client_id`（`desk-<机器码>` / `web-<随机>`）· `capabilities` · `context`/`info` · 归一走 `i18n/resolve-locale`；**框架内部只许出现在 `bridge/`**（有守卫测试）|
| **2.2 `service/`** | 🔶 **基址已落地 · 清单未做** | `service/base.ts` 是基址**唯一来源**（`serviceBase`/`serviceUrl`，`transport` 只拼不定）；「Web 只认托管方清单」**未做** |
| **2.3 `credential/`** | 🔶 **桌面侧完成 · Web 侧未做** | 桌面走 OS 凭据库（`keyring`，经 `bridge/`）· **写→读→删→列**都在，**列表靠宿主记账**（钥匙串不能枚举）；Web 的 HttpOnly Cookie 路线**未做** |
| **2.4 `transport/`** | ✅ **完成** | 两宿主一种接口 · 失败四类归一 · **重试策略在上层**（`utils/retry.ts`）· 浏览器跨域**明确拒绝**；宿主侧 `tauri-plugin-http` + **URL 范围** |
| **2.5 `data/`** | ⏸ 未开始 | 接口类型与取数钩子（依赖 §3 的未定项）|
| **2.6 `bridge/`** | ✅ **完成**（本轮范围）| 16 条命令（宿主 · 凭据 · 系统集成）· **命令清单单一来源** · **跨语言比对测试**（Rust `NAMES` ↔ 应用常量）· 失败带 `{code, params, message}` |
| **2.6 `webproxy/`** | ⏸ 未开始 | agent sandbox 的域名构造规则 |
| 附：**验证页 / 两份构建 / 流水线** | ✅ | 验证页（导航 · 返回 · 分节）· `build` 与 `build:client` · CI 两端测试（真凭据库那条也是门禁）→ 制品（macOS 两架构签名+邮戳 · Windows 安装包）|

**宿主仓换了**：不再是 §0.1 说的 `cui-desktop` 的 `celadon` 分支 —— 现在是 **`YaoApp/celadon-desktop`**（私有），**命令清单在它的 `plan/01-bridge-commands.md`**（本仓只写规则）。

### 0.1 先行：`cui-desktop` 的 `celadon` 分支（宿主侧 rustapi）—— **已作废**

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

- [x] 客户端类型（`web` / `desktop`）与**能力开关**；UA 解析；`client_id` 存本地（**带来源前缀**；桌面用宿主的**真机器码**，命令 `celadon_system_machine_id`）
- 验收：类型与能力**只在这里读一次**（铁律 4）；上层不许出现 `if (isDesktop)`；有单测覆盖两类宿主

### 2.2 `service/` —— 地址只有一处

- [~] 持有**服务地址**（`service/base.ts` 是唯一来源）· 读 well-known **未做**
- [ ] **Web**：只认托管方注入的**同域清单** —— **未做**（浏览器里已做到「跨域明确拒绝」这一层）
- [~] **Desktop**：`serviceBase` 从构建期 `VITE_SERVICE_BASE` 来 —— **宿主配置与「先验证再写入」未做**
- [ ] **换服务 = 清凭据 + 重读 well-known**（清单内切换同样是换服务）
- 验收：`transport/` 只问它要基址；非法地址不被接受；换地址后旧凭据不再被使用

### 2.3 `credential/` —— 载体按宿主选

- [ ] Web：**HttpOnly 安全 Cookie** —— **未做**
- [x] Desktop：**OS 凭据库**（`keyring`，经 `bridge/`）· **无明文回退** · 真钥匙串下 29 条测试全过
- [ ] 刷新（启动一次 + 每 6 小时）—— **未做**
- [ ] 401 刷新与重放 —— **未做**（重试已明确在上层，见 17 §2.1）
- 验收：凭据不落日志、不进前端存储；键位与读取失败路径有单测

### 2.4 `transport/` —— 唯一出口

- [~] `http(s)` 从这里出 ✅ · `ws(s)` **未做** · 基址解析 ✅ · 注入凭据 **未做**
- [~] 错误归一（`{code, params, message}`）✅ · 401 刷新重放 **未做**
- [ ] **不定义**各接口的 wire 格式（那是各 API 自己的事）
- 验收：组件与 feature 里不出现 `fetch` / `EventSource` / `new WebSocket`；**这条要变成检查器**（见 §4）

### 2.5 `data/` —— 接口类型与取数

- [ ] 接口类型**手写**（不由代码生成）；取数钩子（加载 / 错误 / 取消 / 重试的唯一实现）
- [ ] 定掉 `../architecture/05-data-and-api.md` §7 的四条未定：钩子返回形状 · `sandbox` 域去留 · 旧 `openapi/` 71 个文件的处置 · 错误形状的字段
- 验收：上层不拼 URL、不重复实现四态；每条接口面有类型

### 2.6 `bridge/` · `webproxy/`（桌面期）

- [x] `bridge/`：**唯一入口**，**只有它读框架内部**（有守卫测试）· 本轮做了 **凭据 IO** 与 **系统集成**；本地服务 / tai / 更新 / 隧道 **未做**
- [ ] `webproxy/`：agent sandbox 服务访问的域名构造规则
- [x] 配套宿主：**`YaoApp/celadon-desktop`**（不是 `cui-desktop`）· **两份构建**（Web 挂 `/<namespace>/` · 客户端走根）· 产物挂载已定
- 验收：Web 下这两处不存在；调用前先问能力开关

## 3. 未定项（做之前必须先定）

| # | 未定 | 卡住谁 |
| --- | --- | --- |
| 1 | 取数钩子的返回形状（四态字段与判别方式）| `data/` |
| 2 | ~~错误形状的具体字段~~ → **已定**：`{ code, params, message }`（码给程序 · 参数给插值 · 英文给日志；文案由应用按码翻译，见 `08-i18n.md`）| — |
| 3 | Web 侧"清凭据"的落地方式（Cookie 是 HttpOnly，前端清不掉）| `credential/`（可能与登出接口一起定）|
| 4 | `sandbox` 域是否属于前端要消费的接口面 | `data/` |

## 4. 门禁（随实现长，不预先写全）

- [ ] **组件 / feature 不发请求**：`features/` · `components/` · `routes/` 里不许出现 `fetch` / `EventSource` / `new WebSocket`（等 `transport/` 落地后加检查器，配正反样本）
- [x] 依赖方向：已有 `scripts/check-import-boundaries.mjs`
- [ ] 网格尺寸走 token：等 `--size-*` 类 token 出现后再加规则

## 5. 每项的完成口径

一项做完 = **实现 + 测试（单元 / 浏览器按层选）+ `pnpm check` 通过 + 拟人层截图（若动到画面）**；
按 [`../architecture/SPEC.md`](../architecture/SPEC.md) §8 走，交付前按 [`../architecture/REVIEW.md`](../architecture/REVIEW.md) 过一轮隔离审核。
