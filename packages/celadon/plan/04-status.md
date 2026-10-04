# 现状（2026-10-05）

- **规则**：[`15-platform.md`](../architecture/15-platform.md) · **更早的进度**：[`01-infrastructure.md`](01-infrastructure.md) · [`02-platform.md`](02-platform.md) · [`03-data.md`](03-data.md)
- **概述**：基础设施已可运转；产品页面尚未开始 —— 现有四个页面属于开发期脚手架，位于 `/scaffold/*`。

## 1. 现有能力

| 层 | 内容 | 依据 |
| --- | --- | --- |
| `platform/client` | 一个 `client` 对象（清单 · 能力 · 宿主 · id）· `loadClient()` 统一装填 · 失败进入错误面 · React 面为两个偏好 hook（`useLocalePreference` · `useThemePreference`）| 单元用例 · macOS/Windows 截图 |
| `platform/service` | 基址唯一来源（桌面宿主提供）· `well-known` 惰性读取一次（并发去重 · 失败不缓存）· **更换地址即更换服务**（作废旧基址、文档与会话镜像，再读取新地址的会话）| 单元用例 · 页面实操 |
| `platform/credential` | 载体按宿主选择（OS 凭据库 / Cookie）· 会话惰性镜像 · 登录动作收取令牌（仅在应用托管时采纳）· 退出清除 `session` 与 `refresh` 两项 | 单元用例 |
| `platform/transport` | 两宿主一套接口 · 失败以值形式返回（不抛异常）· 401 仅重放一次（**重放机制已具，刷新器尚无注入方**）· 跨域明确拒绝 | 单元用例 |
| `platform/bridge` | **18 条命令**（`ping` 1 · `system` 11 · `service` 2 · `credential` 4）· 命名 `celadon_<域>_<动词>` · Web 宿主下不存在 · 秘密不返回前端 | 跨语言比对用例 |
| `platform/{i18n,theme,router,icons,utils}` | 语言包按域就近（`features/*/locales/*.json` 与全局 `src/locales/*.json`）· 主题写入 `data-theme` · 页标题 · 失败码转换为界面文案 | 门禁 · 单元用例 |
| `data/request` 与 `data/hooks` | 出口 `send`（声明为 `{method, path, headers?, input?}`，**不含会话开关**）· 四态的唯一实现 `useRequest`（声明源 `{key,request}` / 动作源 `{key,operation}`）· 失效按 key 前缀 | 单元用例 |
| `data/helloworld` | 测试模式四个端点：`/helloworld/public` · `/helloworld/protected`（各含 GET 与 POST）| 单元用例 |
| `data/test` | 用户与登录：`/test/login/web` · `/test/login/token` · `/test/users` · `/test/teams` · `/test/otp` · `/test/captcha` · `createServerKey` | 单元用例 |
| `features/scaffold` | 四个开发期页面 `/scaffold` · `/scaffold/routing` · `/scaffold/bridge` · `/scaffold/requests`；导航常量 `nav.ts`、页壳 `ScaffoldPage`（页头与导航统一渲染）、页头与导航组件 | 单元用例 · 浏览器用例 |
| `features/home` | 应用首页 `/`：版本信息 · 语言与主题 · 通往脚手架的四条链接 | 单元用例 · 浏览器用例 |
| `components` | `base`（按钮、图标等）· `locale-switch` · `theme-toggle` · `page`（`Page`/`PageSection`/`PageRow`/`PageCell`）| 单元用例 |
| `routes` | 外壳 `surface-layout`（仅渲染 `<main>` 与 `<Outlet/>`）· `routes.tsx`（`/` · `/scaffold/*` · 未知路径返回 `/`）| 单元用例 · 浏览器用例 |
| `stores/` | 空目录，仅有 `README.md` 说明 store 的建立时机 | —— |
| 门禁 | `lint` · `check`（12 个检查器）· 检查器自测 **85/85** · 单元 **61 文件 / 308 条** · 浏览器 **35 条** · 拟人 **2 个场景** · `build` | 每次交付前全部执行 |

## 2. 尚未具备的能力

| 缺口 | 影响 |
| --- | --- |
| **真实登录与注册**（引擎 `/user/entry/*` 一线：OTP · 邀请 · 两步）| 真实业务的起点 |
| **401 续期未接线**：刷新端点尚未声明，`setSessionRefresher` 仅有定义与导出、**无调用方** | 长会话 |
| **真实 layout 与产品导航**：目前仅有脚手架的 `surface` 与四个脚手架页面 | 产品界面 |
| `stores/` 为空（公共状态待第一个产品页面出现后建立）| 跨页面状态 |
| SSE 与 WS 钩子尚未实现 | 实时域 |
| `webproxy/`（agent sandbox 域名规则）尚未实现 | 沙箱域 |
| 打包、更新与 1.0 迁移 | 交付 |

## 3. 后续顺序

1. **第一个真实域：登录与注册**（`/user/entry/*`）—— 该域将同时覆盖：声明、动作、会话、载体、表单原子与 layout 雏形。
2. **真实 layout 与产品导航** —— 脚手架保留在 `/scaffold/*`，产品页面使用新的外壳。
3. 其后每个 1.0 功能逐一迁移：迁移对应域（`types` / `api` / `keys` / `queries` / `map`），对接真实端点，完成一个页面 UI，并走一轮隔离 Review。

## 4. 已定与待定

**已定**：

1. 脚手架命名为 `scaffold`：物理归拢于 `features/scaffold/`，路由为 `/scaffold/*`；应用首页为 `/`。
2. 导航统一渲染一处（`ScaffoldPage`）；页面不自造导航，亦无返回按钮。
3. 页面公共件与样式置于 `components/page/`；页面根只声明铺满，内边距归 `Page`。
4. 语言包按域就近；脚手架的文案（含导航与页头）位于 `features/scaffold/locales/*`。

**待定**：登录与注册一轮的域边界（`user/entry` 与 `stores/` 的分工）—— 开工时在 [`03-data.md`](03-data.md) 中确定。
