# 04 · 制品与挂载（硬约束）

- **版本**：v1.31
- **最后修改**：2026-10-03 11:31:47
- **说明**：制品构成 · 宿主挂载 · SPA fallback · 由挂载推导的工程约束

## 制品构成

**前端制品是 `dist/`，只有两项**：

```
dist/
├── index.html
└── _assets/                 产物静态目录（Vite 的 `build.assetsDir` 改名而来）
```

- **只含产物**：源码 · 日志 · 临时文件都不进（约束见下）。
- **构建清单被构建内联进产物**：`manifest.json` 的源头在 `app/src/platform/`（见 `15-platform.md` §5.3），
  制品里没有这个文件。
- **桌面与其它制品形态**按 `artifact` 打包（见 `15-platform.md` §5.3 · §6.2）。

## 宿主挂载

| 约束 | 内容 |
| --- | --- |
| **`basename`** | 应用挂在 **`/<BASE>/`** 下；React Router 的 `basename` 与 Vite 的 `base` **取同一变量**（引擎注入的 `BASE`）；PWA 的 `scope` / `start_url` 同步 |
| **表面段** | 路由第一段（`main` / `side`）是**应用自己**的命名空间，在 basename 之下，不占保留前缀 |
| **SPA fallback** | **托管方必须配**：未知路径回 `index.html`，只给导航请求（`Accept: text/html`）；缺的静态资源仍 404。路径路由的代价，预览用 `scripts/serve-dist.mjs` |
| **SSE 三个头**（**托管方 · 开发代理**）| `Cache-Control: no-cache, no-transform` · `Connection: keep-alive` · `X-Accel-Buffering: no`（见 `16-development.md`）|

## 禁止

- 不许在前端拼绝对域名 —— **同源是这套挂载成立的前提**（见 `15-platform.md` §4 的鉴权）。

## 两条由前缀推导出来的工程约束

| 约束 | 原因 |
| --- | --- |
| **源码根必须是 `app/src/`**，不能是 Vite root（`app/`）本身 | Vite root 的目录名**就是公开 URL**；`components` `assets` `data`… 与引擎保留前缀（见 `07-routing.md` §1）同名时，模块请求会被代理截走 |
| **产物的静态目录必须改名**（Vite 的 `build.assetsDir` 默认是 `assets`，与保留前缀同名）| 同上 —— 产物路径也要避开那些前缀 |
| **生产只发 `dist/`** —— `app/` 下的源码 · 日志 · 临时文件都不进产物 | 已用哨兵实测：往 `app/` 放 `.md` / `.log` / `.txt`，构建后 `dist/` 只有 `index.html` 与 `_assets` 四个文件 |
| **dev 下 root 内文件按 URL 可取**（含 `app/logs/`），这点不额外拦 | 开发期可接受；保证靠上面那条"生产只发 `dist/`"，不靠 dev 的拒绝规则 |
| **产物资源路径必须跟宿主前缀走**：`vite.config.ts` 的 `base` 与路由 basename 取同一个值 | 不设 `base` 时资源是绝对路径 `/_assets/*`，**只有在根路径下能跑**；挂到 `/cui/` 这类前缀下整页空白（实测：HTML 拿到 200，JS/CSS 全 404，`#app` 零子节点）|
