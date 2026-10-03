# SPEC · 交给 Agent 的唯一规范

- **版本**：v1.0
- **最后修改**：2026-10-03 14:28:00
- **说明**：开发规范 —— 动手前的硬约束 · 落位与命名 · 状态与地址 · 外观 · 文案 · 数据 · 平台 · 验证与交付 · 禁止清单

> **本文自足**：只读到这一份，就能动手、能验证、能交付。
> 本文只讲**开发**；审阅（换一双眼睛挑毛病）见 [`REVIEW.md`](REVIEW.md)。
> 与分册冲突时以分册为准（`README.md` 列全 00–16）；本文没写的一律按「不许自创」处理。
> 适用仓库：`cui/packages/celadon`（包名 `@yaoapp/cui` 2.0 · 设计体系 Celadon）。

## 1. 开工前：先定落位

任何改动先回答两个问题：**这东西属于哪一层**、**它叫什么**。答不上来就不许写第一行代码。

| 要放什么 | 住哪 |
| --- | --- |
| 路由表（URL → 元素）· 表面布局 | `app/src/routes/`（**只装配，不写业务**）|
| 纯视觉与行为（不认识业务 · 不发请求）| `app/src/components/<名>/`；原子控件 `components/base/<名>/` |
| 一个业务（页面 · 状态 · 测试 · 语言包自洽）| `app/src/features/<域>/` |
| 说不清归哪个功能的事实 | `app/src/stores/<事实名>.ts` |
| 接口类型（**手写强类型**）· 取数钩子 | `app/src/data/` |
| 宿主差异 · 路由机制 · 主题注入 · 运行时壳 | `app/src/platform/` |
| 跨层共享的纯函数 / 常量 / 类型 | `app/src/platform/utils/`（不依赖任何上层，所有层可用）|

**依赖单向，上层可依赖下层**：`routes/` → `components/` → `features/` → `stores/` → `data/` → `platform/`。
写 `import` 前问一句：**我是不是在往上引？** 是，就错了。

## 2. 硬约束（八条铁律）

1. **单一来源** —— 颜色 / 间距只在 `app/src/platform/theme/`（源头 `design/tokens.less`）·
   接口类型只在 `app/src/data/` · 文案只在语言包。不许第二份。
2. **零反向依赖** —— 不 `import '@yaoapp/cui'`（旧包：不升级 · 不复活 · 不删）。
3. **依赖单向** —— 见 §1。
4. **宿主是边界** —— 客户端类型与宿主能力**只在 `app/src/platform/client/` 读一次**，之后以类型化接口向上暴露。
5. **禁硬编码** —— 颜色 / 间距 / 圆角 / 字号与**用户可见文字**不写字面量（例外：系统色 · 品牌官方色）。
6. **全称命名** —— 不缩写（`btn` → `button`）；文件名 kebab-case。
7. **平台差异走能力开关** —— 不许散落 `if (isDesktop)`。
8. **边界由机器强制** —— 违反依赖方向、裸控件、token、文案的规则必须让 `pnpm check` 失败。

**生成物不得手改**：`app/src/platform/theme/tokens.css` · `app/src/platform/icons/{sprite.svg,icon-ids.ts}` ·
`app/src/platform/i18n/i18n-types.d.ts` —— 均由脚本生成，`pnpm check` 会比对。

## 3. 命名与语言

- **文件角色后缀**：主文件不带后缀（`<名>.tsx`）· 私有状态 `<名>.store.ts` · 单测 `<名>.test.tsx` ·
  浏览器 `*.browser.ts` · 拟人 `*.agent.md` + `*.agent.mjs`。
- **语言包文件名是 BCP-47 规范形式**（`zh-CN.json` · `en-US.json` · `zh-TW.json` · `ja.json`），检查器强制。
- **运行时输出（控制台 / 报错 / 用例名）一律英文**；**注释与文档用中文**。
- **人说的话就写人说的话**：不用自造词；一条规则只在一处写全。

## 4. 状态与地址

- 状态库只有 `zustand`；持久化用 `persist`。
- **改 store 只经动作**：`set(next, false, '域/动作')`（第三参给动作名，出问题能看出是谁改的）。
- store **不写 DOM、不发请求**；组件**不直接写字段**（测试除外）。
- **公共态不认识功能词汇**：值指向对象时用统一**条目** `{ kind, id }`（`kind` 形如 `<域>-<名词>`，
  **必须带域前缀**且不可改名；`id` 必须持久、不许被解析）。
- **能由地址表达的就不进 store**（可分享 · 可刷新 · 可后退）。
- **地址语法**：`/<namespace>/<feature>/<object>?<具名面板参数>`；**侧边**是命名空间之下的 `side/` 前缀。

| 用法 | 规则 |
| --- | --- |
| **命名空间** | 构建决定（`CUI_BASE`，默认 `app`）；Vite 的 `base` 与路由 `basename` **取同一个值**；**根 `/` 不属于应用**；Web 与桌面一致 |
| **真链接**（`<a href>`）| 必须**带**命名空间 —— 用 `appHref(path)`（`platform/router/basename.ts`）|
| **路由路径**（`to` / `navigate`）| **不带**命名空间 —— react-router 自己加。两者混用会出现 `/app/app/...` |
| **分享链接** | **必须带**命名空间 —— 只经 `buildShareUrl()` 生成，不许手拼 |
| **写 URL 的时机** | **只在动作中写入**；读只认 `POP`；**禁止在 `useEffect` 里写 URL**（会与"读 URL 写 store"互相追成死循环）|

## 5. 外观（主题 · 图标 · 品牌）

- **改颜色**：改 `design/tokens.less` → 跑 `node scripts/build-css.mjs`。**方向不许反**。
- 偏好三态 `system` / `light` / `dark`；**只有解析后的主题**写 `data-theme`（挂 `<html>`）；**首帧前**定主题（`index.html` 内联脚本）。
- **整页底色与高度归壳**（`app/src/platform/shell.less`）；组件只管自己那块，不判断深浅。
- **行为用 `@base-ui/react`**（无样式），**视觉用 token**；基础件必须包装它。
- **裸控件禁令**：`features/` · `routes/` · `components/`（`components/base/` 豁免）里不许裸写 `<button>` / `<select>`。
  选择类基础件按 **ARIA combobox / listbox / option** 用法使用（受控走 `value` + `onValueChange`），
  测试里**不用** `.selectOption()` / `toHaveValue()`。
- **图标**：源是 `design/icons/manifest.json` → 跑 `node scripts/build-icons.mjs`；
  界面图标用 `<Icon name="i-<域>-<名>" size={16} />`（尺寸档 14 / 16 / 20 / 24），品牌标识用 `<BrandMark>`。
  不许自绘 `<svg>`、不许装 `lucide-react`、不许在组件里写图标路径。
- **动效**：默认 CSS + token；只有手势 / 编排 / 布局动画才引 `motion`；每个动效场景必须标注归属。

## 6. 文案

- **谁的词跟谁走**：feature 私域 `features/<域>/locales/` · 组件私域 `components/<名>/locales/` · 共用 `app/src/locales/`。
- **四语齐备**（基准 `zh-CN` · `en-US` · `zh-TW` · `ja`）；**代码里不得出现硬编码中文文案**。
- 日期 / 数字 / 相对时间显示走 `Intl`；运算与时区走 `date-fns` + `@date-fns/tz`；存储与传输一律 **UTC**。
- 长列表与表格用 `virtua`（长列表 `VList` / `Virtualizer`，表格类 `VGrid`）。

## 7. 数据与接口

- **接口面只有一处**：`${openapi}`（见 `15-platform.md` §4.2 的服务信息）；**不兼容旧接口**。
- **类型手写**（`app/src/data/`），不由代码生成。
- **取数只有一套钩子**（`app/src/data/hooks/use-request.ts`：加载 / 错误 / 取消 / 重试）；**组件不发请求**。
- **错误形状只有一种**；**对外通信只有 `app/src/platform/transport/` 一个出口**（含 WS/SSE 与鉴权重放）。
- **凭据**：Web 用服务端下发的 HttpOnly 安全 Cookie（JS 不碰）；Desktop 用 Bearer，经 OS 凭据库。
- **服务地址一处持有**（`platform/service/`）：Web **同源不可选**；Desktop 由 `bridge/` 的宿主配置**可选**。
  **换地址 = 清凭据 + 重读 well-known**；**先验证再写入**；地址不进产物。
- **宿主能力只在 `bridge/`**（凭据 IO · 本地服务 · tai · 更新 · 隧道 · 系统集成）；Web 下不存在，调用前先问能力开关。

## 8. 构建、验证与交付

- **制品**：`dist/` 只有 `index.html` 与 `_assets/`；**必须挂在命名空间下**（资源路径是 `/<namespace>/_assets/*`）。
- **托管**：引擎托管、独立部署（NGINX / Cloudflare，**反向代理使接口与静态同域**，Cookie 才可用）、桌面壳。
  SPA fallback **只给导航请求**，缺失的静态资源仍 404。
- **命令**（每层落一份日志于 `app/logs/<日期>/`）：

```bash
pnpm dev            # 开发服务（地址带命名空间：/app/...）
pnpm build          # 构建产物 dist/
pnpm lint           # 基础语法：stylelint · eslint · tsc
pnpm check          # 规范门禁：检查器
pnpm test           # 单元 / 组件
pnpm test:browser   # 浏览器（真实渲染）
pnpm test:persona   # 拟人（剧本 + 采集脚本 + 看图）
pnpm test:all       # 六层全链：lint → gates → checkers → unit → browser → build → persona
```

- **交付条件**：`pnpm lint` 与 `pnpm check` 通过；**`pnpm test:all` 全绿**；**必须执行拟人层并把截图附给交付对象**
  （拟人是唯一看画面的一层，"我跑过了"不算证据）。日志路径写进报告；断链以 `all-<HHMM>.log` 为准。
- **拟人剧本固定三段**（剧本 · 修改记录 · 测试记录）；**判定数据执行前冻结**，不随每轮结果改；改了要在「修改记录」记一笔。

## 9. 自认为做完之后

代码写完、验证链全绿、你自认为"没问题了" —— **在决定提交推送之前**，换一双眼睛：按 [`REVIEW.md`](REVIEW.md) 走。

- **本文管"怎么写"，`REVIEW.md` 管"别人怎么挑"** —— 两件事，不混在一起。
- **审阅不是开发的一部分**：不要一边写一边按 `REVIEW.md` 自查充数（那样只会验到自己想到过的东西）。
- **开发阶段不跑审阅** —— 它是重活，代码还在动时结论会作废。

### 9.1 审阅之后的处理（缺一步都不算走完）

1. 复核者**不改代码**，只出报告 → `app/logs/<日期>/review-<HHMM>.md`（与日志同目录）。
2. **作者逐条处置**：报告里每条都要给「**已改** / **不改 + 理由**」，**不许留空**。
3. 改完**重跑 §8 的验证链**（`pnpm test:all`，含拟人层与截图）。
4. **交回同一复核者验收**：只验处置（说"已改"的确实改了、"不改"的理由成立、没引入新问题），
   不重开全量审阅。
5. **报告头部标记状态**：`已验收（日期 时间 · 复核者）` / `有条件通过（遗留 N 项）` / `未验收`；
   该批次的工作记录**指向这份报告**。
6. **状态不是"已验收"（或有条件通过）的批次，不进提交推送。**

细则见 [`REVIEW.md`](REVIEW.md)：§1 时机与闭环 · §7 验收与标记 · §8 留档。

## 10. 速查：禁止清单

- 不许自创词 · 不许缩写 · 不许第二份真相（颜色 / 类型 / 文案各只一处）
- 不许往上引 · 不许同层互相 import 业务件 · 不许 `features/` 之间互相 import
- 不许组件发请求 · 不许 store 写 DOM / 发请求 · 不许组件直接写 store 字段
- 不许在 `useEffect` 里写 URL · 不许手拼分享链接 · 不许混用真链接与路由路径
- 不许硬编码颜色 / 间距 / 字号 / 用户可见文字 · 不许手改生成物
- 不许裸写 `<button>` / `<select>` · 不许引 antd · 不许装 `lucide-react` · 不许引外部雪碧图
- 不许引旧包 `@yaoapp/cui` · 不许 `mobx` / `storex` / `@tanstack/react-virtual`
- 不许生成本该手写的接口类型 · 不许绕过 `transport/` 直连后端
- 不许把地址编进产物 · 不许在 Web 端选服务地址（同源不可选）
- 不许"机器层全绿就当交付" · 不许无证据的自动判定 · 不许把"看不清"并进"通过"
