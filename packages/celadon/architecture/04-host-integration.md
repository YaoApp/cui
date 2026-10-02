# 04 · 宿主集成（硬约束）

- **版本**：v1.18
- **最后修改**：2026-10-02 20:33:29
- **说明**：宿主挂载 · 保留前缀 · 代理 · SSE / WebSocket

| 约束 | 内容 |
| --- | --- |
| **`basename`** | 应用挂在 **`/<BASE>/`** 下；React Router 的 `basename` 与 Vite 的 `base` **取同一变量**（引擎注入的 `BASE`）；PWA 的 `scope` / `start_url` 同步 |
| **保留前缀** | **12 个前缀归引擎，路由不得占用**：`/api` `/v1` `/assets` `/components` `/tools` `/agents` `/admin` `/brands` `/docs` `/ai` `/.well-known` `/iframe` |
| **无外壳模式** | `/iframe` 路径下**不渲染外壳**（chrome-less）|
| **表面段** | 路由第一段（`main` / `side`）是**应用自己**的命名空间，在 basename 之下，不占保留前缀 |
| **SPA fallback** | **托管方必须配**：未知路径回 `index.html`，只给导航请求（`Accept: text/html`）；缺的静态资源仍 404。路径路由的代价，预览用 `scripts/serve-dist.mjs` |
| **代理** | 按上述前缀转发给引擎；**WebSocket upgrade 用 `server.proxy` 的 `ws: true`** |
| **SSE 三个头** | `Cache-Control: no-cache, no-transform` · `Connection: keep-alive` · `X-Accel-Buffering: no` |

## 禁止

- 路由路径**不得**落在 12 个保留前缀内。
- 不许在前端拼绝对域名 —— **同源是这套挂载成立的前提**（见 `05-data-and-api.md` 的鉴权）。

## 两条由前缀推导出来的工程约束

| 约束 | 原因 |
| --- | --- |
| **源码根必须是 `app/src/`**，不能是 Vite root（`app/`）本身 | Vite root 的目录名**就是公开 URL**；`components` `assets` `data`… 与保留前缀同名时，模块请求会被代理截走 |
| **产物的静态目录必须改名**（Vite 的 `build.assetsDir` 默认是 `assets`，与保留前缀同名）| 同上 —— 产物路径也要避开那 12 个前缀 |
| **生产只发 `dist/`** —— `app/` 下的源码 · 日志 · 临时文件都不进产物 | 已用哨兵实测：往 `app/` 放 `.md` / `.log` / `.txt`，构建后 `dist/` 只有 `index.html` 与 `_assets` 四个文件 |
| **dev 下 root 内文件按 URL 可取**（含 `app/logs/`），这点不额外拦 | 开发期可接受；保证靠上面那条"生产只发 `dist/`"，不靠 dev 的拒绝规则 |
| **产物资源路径必须跟宿主前缀走**：`vite.config.ts` 的 `base` 与路由 basename 取同一个值 | 不设 `base` 时资源是绝对路径 `/_assets/*`，**只有在根路径下能跑**；挂到 `/cui/` 这类前缀下整页空白（实测：HTML 拿到 200，JS/CSS 全 404，`#app` 零子节点）|
