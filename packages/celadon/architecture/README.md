# architecture/ — CUI 2.0 架构规范

- **版本**：v1.0
- **最后修改**：2026-10-03 10:43:28
- **说明**：架构规范总览：分册索引与目录分工

> 本目录回答：**代码如何组织、依赖朝哪个方向、边界在哪、什么不许写。**

## 目录分工

| 目录 | 职责 |
| --- | --- |
| [`design/`](../design/) | **长什么样** —— token · 排版 · 图标 · 组件外观（视觉唯一来源）|
| **`architecture/`（本目录）** | **代码如何摆放** —— 分层 · 依赖方向 · 数据流 · 宿主边界 · 工程门禁 |

**两者不重叠**：视觉规则不在本目录复述。

> **拿到任务时先看 [`AGENTS.md`](AGENTS.md)** —— 任务与分册的对应 · 动手前的约束 · 验证与交付要求。
> 本文件只回答"有哪些分册、各管什么"。

## 分册

开工前读 [`00-principles.md`](00-principles.md) 一份即可；碰到具体问题时按此表查对应分册。

| # | 分册 | 一句话 |
| --- | --- | --- |
| 00 | [principles](00-principles.md) | 八条铁律 + 结构总纲（分层 · 落位 · 依赖 · 命名 · 测试 · 公共态）+ 一个组件一个目录 |
| 01 | [package-and-repo](01-package-and-repo.md) | 包 · 仓库形态 · 版本与发布 · 旧包处置 |
| 02 | [toolchain](02-toolchain.md) | 构建工具 · 框架 · 语言 · 包管理器 · 脚本入口 · 判定工具 |
| 03 | [boundaries](03-boundaries.md) | 目录结构 · 分层职责 · 同层方向 · 谁能 import 谁 · 边界怎么强制 |
| 04 | [host-integration](04-host-integration.md) | 宿主挂载 · 保留前缀 · 代理 · SSE 头 |
| 05 | [data-and-api](05-data-and-api.md) | 接口类型（手写强类型）· 取数钩子 · 禁止事项 |
| 06 | [state](06-state.md) | 私有跟 feature 走 · 公共放 `stores/` · 先问归属再问地址栏 · 什么不进 store · 改 store 留动作名 |
| 07 | [routing](07-routing.md) | 地址语法 · 谁说了算 · `routes/` 的结构 · 文档标题 |
| 08 | [i18n](08-i18n.md) | 语言包跟代码走 · locale 规范形式 · 命名空间由位置决定 · 加载 · 后端边界 · 翻译流程 |
| 09 | [theme](09-theme.md) | 设计→代码的转换 · 偏好与解析（三态）· Base UI 基础件 · 页面底色 · 对比度 |
| 10 | [icons](10-icons.md) | 图标与品牌：产物 · 基础件用法 · 第三方品牌 |
| 11 | [formatting-and-lists](11-formatting-and-lists.md) | 日期 / 数字 / 时区 · 长列表与表格（随实践推进更新）|
| 12 | [motion](12-motion.md) | 动效归属（随实践推进更新）|
| 13 | [quality-gates](13-quality-gates.md) | 基础语法 · 检查器 · CI · 产物与日志 |
| 14 | [testing](14-testing.md) | 测试分层 · 位置与命名 · 断言与 mock 边界 · 浏览器与拟人 · 配置与日志 |
| 15 | [platform](15-platform.md) | 平台层：构成与落位 · 服务信息 · 凭据与鉴权 · 客户端 · 客户端底座（Bridge）· 测试 |

## 一条铁律

**视觉规则只在 `design/` 定，工程规则只在本目录定。** 两边都不许在代码里出现"第三份真相"。
