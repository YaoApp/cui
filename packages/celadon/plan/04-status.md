# 现状（2026-10-05）

- **规则**：[`15-platform.md`](../architecture/15-platform.md) · **更早的进度**：[`01-infrastructure.md`](01-infrastructure.md) · [`02-platform.md`](02-platform.md) · [`03-data.md`](03-data.md)
- **一句话**：基础设施可以转起来了；**产品页面还没开始做** —— 现有的四个页面是开发期的脚手架，钉在 `/scaffold/*`。

## 1. 现在有什么

| 层 | 有什么 | 证明 |
| --- | --- | --- |
| `platform/client` | 一个 `client` 对象（清单 · 能力 · 宿主 · id）· `loadClient()` 一处装填 · 失败进错误面 · React 面是两个偏好 hook（`useLocalePreference` · `useThemePreference`）| 单元用例 + macOS/Windows 截图 |
| `platform/service` | 基址唯一来源（桌面由宿主持有）· `well-known` 惰性读一次（并发去重 · 失败不缓存）· **换地址 = 换服务**（作废旧基址/文档/会话镜像，再读新地址的会话）| 单元用例 + 页面实点 |
| `platform/credential` | 载体按宿主选（OS 凭据库 / Cookie）· 会话惰性镜像 · 登录动作收令牌（只在应用托管时采纳）· 退出清 `session` + `refresh` 两条 | 单元用例 |
| `platform/transport` | 两宿主一种接口 · 失败是值（不抛）· 401 只重放一次（**重放机制在，刷新器没有注入方**）· 跨域明确拒绝 | 单元用例 |
| `platform/bridge` | **18 条命令**（`ping` 1 · `system` 11 · `service` 2 · `credential` 4）· 名字 `celadon_<域>_<动词>` · Web 下不存在 · 秘密不回前端 | 跨语言比对用例 |
| `platform/{i18n,theme,router,icons,utils}` | 语言包按域就近（`features/*/locales/*.json` + 全局 `src/locales/*.json`）· 主题写 `data-theme` · 页标题 · 失败码 → 人话 | 门禁 + 单元用例 |
| `data/request` + `data/hooks` | 出口 `send`（声明是 `{method, path, headers?, input?}`，**没有会话开关**）· 四态的唯一实现 `useRequest`（声明源 `{key,request}` / 动作源 `{key,operation}`）· 失效按 key 前缀 | 单元用例 |
| `data/helloworld` | 测试模式的四个端点：`/helloworld/public` · `/helloworld/protected`（各 GET/POST）| 单元用例 |
| `data/test` | 用户与登录：`/test/login/web` · `/test/login/token` · `/test/users` · `/test/teams` · `/test/otp` · `/test/captcha` · `createServerKey` | 单元用例 |
| `features/scaffold` | 四个开发期页面 `/scaffold` · `/scaffold/routing` · `/scaffold/bridge` · `/scaffold/requests`；导航常量 `nav.ts`、页壳 `ScaffoldPage`（页头 + 导航渲染一次）、页头/导航组件 | 单元 + 浏览器用例 |
| `features/home` | 应用首页 `/`：版本信息 · 语言与主题 · 通往脚手架的四条链接 | 单元 + 浏览器用例 |
| `components` | `base`（按钮/图标等）· `locale-switch` · `theme-toggle` · `page`（`Page`/`PageSection`/`PageRow`/`PageCell`）| 单元用例 |
| `routes` | 外壳 `surface-layout`（只渲染 `<main>` + `<Outlet/>`）· `routes.tsx`（`/` · `/scaffold/*` · 未知路径回 `/`）| 单元 + 浏览器用例 |
| `stores/` | 空目录（只有 `README.md` 说明何时该有 store）| —— |
| 门禁 | `lint` · `check`（12 个检查器）· 检查器自测 **85/85** · 单元 **61 文件 / 308 条** · 浏览器 **35 条** · 拟人 **2 个场景** · `build` | 每次交付前全跑 |

## 2. 现在还不能跑的

| 缺口 | 挡什么 |
| --- | --- |
| **真登录 / 注册**（引擎 `/user/entry/*` 那条 OTP · 邀请 · 两步）| 真业务第一步 |
| **401 续期未接线**：刷新端点没声明，`setSessionRefresher` 只有定义与导出、**没有调用方** | 长会话 |
| **真 layout 与产品导航**：今天只有脚手架的 `surface` 与四个脚手架页 | 真界面 |
| `stores/` 是空的（公共状态等第一个真产品页）| 跨页状态 |
| SSE / WS 钩子 | 实时域 |
| `webproxy/`（agent sandbox 域名规则）| 沙箱域 |
| 打包 / 更新 / 1.0 迁移 | 交付 |

## 3. 下一步的顺序

1. **第一个真域：登录 / 注册**（`/user/entry/*`）—— 它一次压到：声明 + 动作 + 会话 + 载体 + 表单原子 + layout 雏形。
2. **真 layout 与产品导航** —— 脚手架留在 `/scaffold/*`，产品页用新的壳。
3. 之后每个 1.0 功能迁一个：迁它的域（`types` / `api` / `keys` / `queries` / `map`）→ 对接真端点 → 一页 UI → 一轮隔离 Review。

## 4. 已定 / 待定

**已定**：

1. 脚手架叫 `scaffold`：物理归拢在 `features/scaffold/`，路由 `/scaffold/*`；应用首页是 `/`。
2. 导航只渲染一处（`ScaffoldPage`）；页面不自造导航，也没有返回按钮。
3. 页面公共件与样式在 `components/page/`；页面根只声明铺满，内边距归 `Page`。
4. 语言包按域就近；脚手架的文案（含导航与页头）在 `features/scaffold/locales/*`。

**待定**：登录 / 注册那轮的域边界（`user/entry` 与 `stores/` 的分工）—— 开工时在 [`03-data.md`](03-data.md) 里定。
