# 04 · 制品与挂载（硬约束）

- **版本**：v1.31
- **最后修改**：2026-10-03 11:58:52
- **说明**：制品构成 · 宿主挂载 · 放到哪（引擎 / 独立 / 桌面）· SPA fallback · 由命名空间推导的工程约束

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
| **命名空间** | 应用整个跑在**构建决定的命名空间**之下（`/<namespace>/`，默认 `app`，`CUI_BASE` 覆盖）；React Router 的 `basename` 与 Vite 的 `base` **取同一个值**；**根 `/` 不属于应用**，两端一致；PWA 的 `scope` / `start_url` 同步 |
| **表面** | 命名空间之下：主区无前缀；**侧边**是 `side/` 前缀（见 `07-routing.md` §2）|
| **SPA fallback** | **托管方必须配**：未知路径回 `index.html`，只给导航请求（`Accept: text/html`）；缺的静态资源仍 404。路径路由的代价，预览用 `scripts/serve-dist.mjs` |
| **SSE 三个头**（**托管方 · 开发代理**）| `Cache-Control: no-cache, no-transform` · `Connection: keep-alive` · `X-Accel-Buffering: no`（见 `16-development.md`）|

## `dist/` 的托管方式

**`dist/` 是纯静态产物，但有两项约束必须满足**：其一，**必须挂载在构建时的命名空间之下**——
产物内的资源路径为 `/<namespace>/_assets/*`，挂载位置不符将整页空白；其二，**接口必须与服务同源**——
服务端不返回 CORS 头、不处理预检（见 `15-platform.md` §4.1）。

| 托管形态 | 由谁提供 | 命名空间来源 | 接口路径 |
| --- | --- | --- | --- |
| **引擎托管**（生产默认）| 引擎的静态服务 | 引擎配置 | 同源，由引擎转发 |
| **独立部署** | 静态服务器（NGINX 等）| 部署配置 | 反向代理至引擎，保持同源 |
| **桌面壳** | 壳内本地服务或自定义协议 | 壳挂载至同一命名空间 | Rust 侧直连服务端（无跨域，见 `15` §4.1）|

### 独立部署（NGINX）

三项要求：① `/<namespace>/` 指向产物内容；② SPA fallback **仅对导航请求**生效，缺失的静态资源仍返回 404；
③ 接口路径**反向代理至引擎**，保持同源。

下例以命名空间 `app`、接口前缀 `/v1`、引擎监听 `127.0.0.1:5099` 为例。
产物内容置于 `/srv/cui/app/`（**目录名即命名空间**），故使用 `root` 而非 `alias`——
`alias` 与 `try_files` 组合存在已知的路径解析差异。

```nginx
server {
    listen 80;
    server_name cui.example.com;

    root /srv/cui;

    # 产物静态目录：存在则返回，缺失直接 404，不回退
    location /app/_assets/ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 应用：导航请求回退到 index.html；index.html 不缓存，发版即生效
    location = /app/index.html {
        add_header Cache-Control "no-cache";
    }

    location /app/ {
        try_files $uri $uri/ /app/index.html;
    }

    # 接口：反向代理至引擎，保持同源
    location /v1/ {
        proxy_pass http://127.0.0.1:5099;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # SSE 等长连接：不缓冲，放宽读超时
        proxy_buffering off;
        proxy_read_timeout 3600s;
    }

    # WebSocket 升级
    location /ws/ {
        proxy_pass http://127.0.0.1:5099;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }
}
```

### 独立部署（Cloudflare）

Cloudflare 上以 **Pages**（静态托管）加 **Functions**（接口回源）为例；若引擎本身已在同一域名之后，
则只需按路径分发，不必回源。

**产物布局**：Pages 从输出根提供文件，须在其下放一层**命名空间目录**：

```
输出根/
└── app/                 命名空间目录（与构建时的 CUI_BASE 一致）
    ├── index.html
    └── _assets/
```

**SPA fallback 与缓存**：`_redirects` 与 `_headers` 各一份。静态文件先于规则命中，故存在的资源直出，
缺失的资源由 `_redirects` 显式判为 404。

```
# _redirects —— 缺失的静态资源仍 404；其余回退到 index.html
/app/_assets/*  /404.html        404
/app/*          /app/index.html  200
```

```
# _headers —— 产物长缓存，index.html 不缓存
/app/_assets/*
  Cache-Control: public, max-age=31536000, immutable
/app/index.html
  Cache-Control: no-cache
```

**接口回源**：Pages Functions 将接口路径同源转发至引擎（示意，按实际域名改写）：

```ts
// functions/v1/[[path]].ts
export const onRequest: PagesFunction<{ ENGINE: string }> = ({ request, env }) => {
  const url = new URL(request.url)
  url.protocol = 'https:'
  url.hostname = env.ENGINE        // 例：engine.example.com
  return fetch(new Request(url, request))
}
```

**长连接**：接口路径**不得进入缓存**（Cache Rules 中排除）；SSE 依赖响应头 `Cache-Control: no-cache, no-transform`
（见上表），WebSocket 由 Cloudflare 代理转发，同样要求引擎可达、不可缓存。

## 禁止

- 不许在前端拼绝对域名 —— **同源是这套挂载成立的前提**（见 `15-platform.md` §4 的鉴权）。

## 两条由命名空间推导出来的工程约束

| 约束 | 原因 |
| --- | --- |
| **源码根必须是 `app/src/`**，不能是 Vite root（`app/`）本身 | Vite root 的目录名**就是公开 URL**；源码再下一层，公开路径才不带源码结构 |
| **产物的静态目录必须改名**（Vite 的 `build.assetsDir` 默认是 `assets`）| 产物用 `_assets/`，与源码目录名分得开 |
| **生产只发 `dist/`** —— `app/` 下的源码 · 日志 · 临时文件都不进产物 | `dist/` 只有 `index.html` 与 `_assets/` |
| **dev 下 root 内文件按 URL 可取**（含 `app/logs/`），这点不额外拦 | 开发期可接受；保证靠上面那条"生产只发 `dist/`"，不靠 dev 的拒绝规则 |
| **产物资源路径必须跟命名空间走**：`vite.config.ts` 的 `base` 与路由 basename 取同一个值 | 不设 `base` 时资源是绝对路径 `/_assets/*`，只有在根路径下能跑；挂到命名空间下则整页空白（HTML 拿到 200，JS/CSS 全 404，`#app` 零子节点）|
