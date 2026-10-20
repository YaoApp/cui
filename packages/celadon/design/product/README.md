# 产品设计简版原型

这是产品设计阶段的可运行原型，与 `packages/celadon/app` 的产品代码分开：

- 独立 Server，端口 **5066**
- React + Vite，共用 `design/tokens.css`
- 当前页面：模块列表 `/`，新会话 `/new-session`，会话详情 `/sessions/:id`，Apps 列表 `/apps`，独立 App 界面 `/apps/:id`
- 推荐卡使用样例数据，先服务讨论，不接真实接口

## 运行

```bash
cd packages/celadon/design/product
node server.mjs
```

打开 `http://192.168.3.216:5066/`；新会话在 `http://192.168.3.216:5066/new-session`。健康检查：`http://192.168.3.216:5066/api/health`。

## 目录

```
00-overview.md       概要设计：产品、模块列表、Boards 与 Thread
server.mjs           独立 Node / Vite Server
src/pages/modules/   模块列表页
src/pages/new-session/ 新会话页与 Apps / Bots 推荐
src/pages/session-detail/ 会话详情与运行时
src/pages/apps-index/ Apps 列表
src/pages/app-view/ 独立 App 界面
src/product-map.ts   七项模块
src/components/      共用件
src/app.css          只引用 design/tokens.css
src/icons.ts         注入 app/src/platform/icons/sprite.svg
notes/thread.md      Session 详情里的 Thread 机制
notes/session-detail.md Session 详情、运行时与 Job / Daemon
notes/sharing.md     共享、可见性与资源隔离
notes/computers.md   电脑池、申请与个人节点绑定
notes/workspace.md   Workspace 与 Computer、Private / Team 读写角色
notes/chatbox.md     Chatbox 的输入、资源、模型与高级设置
notes/vault.md       Vault 的密钥保护与授权
```

## 约束

- 颜色、间距、字号、圆角从 `design/tokens.css` 取，不写字面值。
- 概要只写一级模块与 Boards / Thread 的定位；模块功能随模块逐项展开。
- 页面表达功能，不把 Markdown 文档搬进界面。
