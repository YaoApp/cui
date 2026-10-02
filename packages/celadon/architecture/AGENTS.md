# architecture/ — 干活的索引

> **人和 coding agent 靠这份文件干活**：手上是什么任务 → 读哪一册 → 有哪些不能踩的约束 → 做完怎么验证。
> **给人读的导览在 [`README.md`](README.md)**（有哪些册、各管什么）。规则全文在各分册里，这里只做索引。

## 1. 按任务查册

| 我要做的事 | 读 | 关键约束 |
| --- | --- | --- |
| 加一个页面 / 功能 | [03](03-boundaries.md) → [06](06-state.md) → [07](07-routing.md) → [08](08-i18n.md) | 落位先定（`routes/` → `components/` → `features/` → `stores/` → `data/` → `platform/`）；状态先问归属再问地址栏；文案进语言包 |
| 改颜色 / 间距 / 字号 | [09](09-theme.md) | 只改 `design/tokens.less` → 跑 `node scripts/build-css.mjs`；**代码里不许写死值** |
| 加图标 / 品牌 | [10](10-icons.md) | 图标改 `design/icons/manifest.json` → 跑 `node scripts/build-icons.mjs`；界面图标用 `<Icon>`、品牌用 `<BrandMark>` |
| 加 / 改组件 | [03](03-boundaries.md) | 控件一律包 `@base-ui/react`（`components/base/`）；不许裸写 `<button>` / `<select>`；目录里的 `.less` 必须被同目录 `.tsx` import |
| 接后端 / 取数 / 流式 | [05](05-data-and-api.md) · [04](04-host-integration.md) | 传输 · 鉴权 · 取数钩子 · 流式的形状；宿主挂载与代理看 `04` |
| 改地址栏 / 深链 | [07](07-routing.md) · [06](06-state.md) | 对象在路径、表面在首段、面板在具名 query；**URL 只在动作里写，不在 effect 里写** |
| 加语言 / 改文案 | [08](08-i18n.md) | 语言包**跟着代码走**；四语齐（`zh-CN` 基准 · `en-US` · `zh-TW` · `ja`）；代码里**不许有硬编码汉字文案** |
| 写测试 | [14](14-testing.md) | 单测与源文件同目录 · 浏览器与拟人放 `features/<域>/tests/`；**一个场景一个文件** |
| 加 / 改门禁 | [13](13-quality-gates.md) | 每条规则一个正例 + 一个违规例；**加规则必须同时加违规样本** |
| 改工程配置 / 脚本 | [02](02-toolchain.md) | 构建工具 · 框架 · 脚本入口都在这册 |
| 日期 / 数字 / 长列表 / 表格 | [11](11-formatting-and-lists.md) | 显示走 `Intl`；运算与时区走 `date-fns`（本章随实践推进更新）|
| 动效 | [12](12-motion.md) | 默认 CSS + token；只有手势 / 编排 / 布局动画才引 `motion`（本章随实践推进更新）|
| 搞不清该读哪册 / 全局铁律 | [00](00-principles.md) | **八条铁律 + 结构总纲**；开工前读这一份就够 |

## 2. 动手前的硬约束（最容易踩的）

- **颜色 · 间距 · 字号**只在 `app/src/platform/theme/`（**唯一代码入口**；品牌官方色是唯一例外），改源头是 `design/tokens.less` + `scripts/build-css.mjs`。
- **文案**只在语言包（`app/src/locales/` · `features/<域>/locales/` · `components/<名>/locales/`），四语齐。
- **界面控件**用 `components/base/`（包装 `@base-ui/react`），不裸写原生控件。
- **状态**：私有跟 feature 走；公共才进 `stores/`；**改动只经动作**（`set(next, false, '域/动作')`）。
- **URL**：只在动作里写；读只认 `POP`。
- **产物不许手改**：`app/src/platform/theme/tokens.css` · `app/src/platform/icons/{sprite.svg,icon-ids.ts}` · `i18n-types.d.ts` —— 都由脚本生成，`check-generated` 会比对。

## 3. 开发与验证

```bash
pnpm dev            # 开发服务（vite）
pnpm build          # 构建产物 dist/（拟人层测的就是它）
pnpm lint           # 基础语法：stylelint · eslint · tsc
pnpm check          # 规范门禁：11 个检查器
pnpm test           # 单元 / 组件
pnpm test:browser   # 浏览器（真实渲染）
pnpm test:persona   # 拟人（剧本 + 采集脚本 + 看图）
pnpm test:all       # 六层全链：lint → gates → checkers → unit → browser → build → persona
```

每层落一份日志在 `app/logs/<日期>/`（`lint-` · `gates-` · `checkers-` · `unit-` · `browser-` · 拟人按场景名），
链另落 `all-<HHMM>.log` —— **断在哪一步只有链的日志说得清**。

## 4. 交付前

1. **`pnpm lint` 与 `pnpm check` 都得过**（基础语法在前，规范门禁在后）。
2. **`pnpm test:all` 全绿** —— 机器层全绿不等于能交付。
3. **必须跑拟人，并把截图附给交付对象** —— 拟人是唯一看**画面**的一层，"我跑过了"不算证据（见 [14](14-testing.md)）。

## 附：写这些文档时的约定

改动本目录时（**读者是 Agent**）：**写规则不写现状**（app 代码会被重置）· 不写「待讨论」·
一条规则只在一处写全 · 举例用通用名 · 能表格就表格 · **路径从包根写全**（`app/src/…`，仓库根写 `../../…`）·
**引代码入口不引设计** · 不引用 `plan/` 的内容。**格式照 [`00-principles.md`](00-principles.md) 的样板**
（`## 1. <硬规则>` + `## 2. <主题>` + 测试另起一章）。改完跑 `pnpm check`。
