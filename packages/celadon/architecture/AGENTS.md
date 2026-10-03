# architecture/AGENTS · 任务索引

- **版本**：v1.2
- **最后修改**：2026-10-03 10:25:59
- **说明**：任务与分册对应 · 动手前的约束 · 编写测试 · 开发与验证 · 交付要求

> 本文回答一个问题：**拿到一项任务，该读哪一册、有哪些约束、做完如何验证。**
> 分册全貌见 [`README.md`](README.md)；规则全文在各分册内，本文只做索引。

## 1. 任务与分册对应

| 任务 | 分册 | 约束 |
| --- | --- | --- |
| 新增页面 / 功能 | [03](03-boundaries.md) → [06](06-state.md) → [07](07-routing.md) → [08](08-i18n.md) → [14](14-testing.md) | 先定落位（`routes/` → `components/` → `features/` → `stores/` → `data/` → `platform/`）；状态先定归属再定是否入地址栏；文案入语言包 |
| 修改颜色 / 间距 / 字号 | [09](09-theme.md) → [14](14-testing.md) | 只改 `design/tokens.less`，再执行 `node scripts/build-css.mjs`；代码内不得出现字面值 |
| 新增图标 / 品牌 | [10](10-icons.md) → [14](14-testing.md) | 图标改 `design/icons/manifest.json`，再执行 `node scripts/build-icons.mjs`；界面图标用 `<Icon>`，品牌标识用 `<BrandMark>` |
| 新增 / 修改组件 | [03](03-boundaries.md) → [14](14-testing.md) | 控件一律包装 `@base-ui/react`（置于 `components/base/`）；不得裸写 `<button>` / `<select>`；目录内的 `.less` 必须被同目录 `.tsx` 引入 |
| 接入后端 / 取数 / 流式 | [05](05-data-and-api.md) · [04](04-host-integration.md) → [14](14-testing.md) | 传输 · 鉴权 · 取数钩子 · 流式的形状见 05；宿主挂载与代理见 04 |
| 修改地址栏 / 深链 | [07](07-routing.md) · [06](06-state.md) → [14](14-testing.md) | 对象在路径、表面在首段、面板在具名查询参数；URL 只在动作中写入，不在 `useEffect` 中写入 |
| 新增语言 / 修改文案 | [08](08-i18n.md) → [14](14-testing.md) | 语言包随代码落位；四语齐备（基准 `zh-CN` · `en-US` · `zh-TW` · `ja`）；代码内不得出现硬编码中文文案 |
| 编写测试 | [14](14-testing.md) | 单元用例与源文件同目录；浏览器与拟人用例置于 `features/<域>/tests/`；一个场景一个文件 |
| 新增 / 修改门禁 | [13](13-quality-gates.md) | 每条规则配一个正例与一个违规例；新增规则必须同时补违规样本 |
| 修改工程配置 / 脚本 | [02](02-toolchain.md) | 构建工具 · 框架 · 脚本入口均在此册 |
| 日期 / 数字 / 长列表 / 表格 | [11](11-formatting-and-lists.md) → [14](14-testing.md) | 显示走 `Intl`；运算与时区走 `date-fns`（本章随实践推进更新）|
| 动效 | [12](12-motion.md) → [14](14-testing.md) | 默认 CSS 与 token；仅手势 / 编排 / 布局动画引入 `motion`（本章随实践推进更新）|
| 平台层（主题 · 路由 · 图标 · 语言 · 服务信息 · 凭据 · 客户端 · 客户端底座） | [15](15-platform.md) | 宿主差异只在这一层消化；服务信息只读；凭据按宿主选载体 |
| 全局铁律与结构总纲 | [00](00-principles.md) | 八条铁律 + 结构总纲；开工前读此一册即可 |

**每一行改动都带测试** —— 上表凡是**改动行为**的任务，分册列都以 [`14`](14-testing.md) 收尾：先按 §3 选层，
再补对应用例。**纯配置改动**（`02` 工程配置 · `13` 门禁本身的样本）按其自身规则走。

## 2. 动手前的约束

- **颜色 · 间距 · 字号**只在 `app/src/platform/theme/`（唯一代码入口；品牌官方色是唯一例外）；
  源头是 `design/tokens.less` 与 `scripts/build-css.mjs`。
- **文案**只在语言包（`app/src/locales/` · `features/<域>/locales/` · `components/<名>/locales/`），四语齐备。
- **界面控件**取自 `components/base/`（包装 `@base-ui/react`），不直接使用原生控件。
- **状态**：私有随 feature 落位；公共才进 `stores/`；变更只经动作（`set(next, false, '域/动作')`）。
- **URL**：只在动作中写入；读取只认 `POP`。
- **生成物不得手改**：`app/src/platform/theme/tokens.css` · `app/src/platform/icons/{sprite.svg,icon-ids.ts}` ·
  `i18n-types.d.ts` —— 均由脚本生成，`check-generated` 会比对。

## 3. 编写测试（先定层，再定文件）

| 要验证什么 | 层 | 文件落在哪 |
| --- | --- | --- |
| 纯逻辑 · 状态 · 组件行为 | 单元 / 组件 | **与源文件同目录**：`<名>.test.tsx`（不得进 `tests/`）|
| 关键交互主路径 · 输入法 · 全键盘 · 视觉回归 | 浏览器 | `app/src/features/<域>/tests/<场景>.browser.ts` |
| 真实使用路径 · 观感 | 拟人 | 同一目录：`<场景>.agent.md`（剧本）+ `<场景>.agent.mjs`（采集脚本）|
| 一条检查规则 | 检查器自测 | `scripts/tests/`（每条规则一个正例 + 一个违规例）|

- **一个场景一个文件**；浏览器与拟人用例必须在 `tests/` 内（`check-app-layout` 会拦）。
- **断言用户能看到什么**（可见文字 · 角色 · 可访问状态），不测内部结构；**渲染结果类（图标 · 图形）
  要断言它真的画出来**（缩放 · 描边 · 可见性），不是"元素存在"。
- **mock 边界**：网络 · 时间 · 存储可 mock；**真实渲染引擎不 mock**，交浏览器层。
- **拟人剧本固定三段**：剧本 · 修改记录 · 测试记录；**判定数据在剧本里预先冻结**，不随每轮结果改。
- **交付前必须执行拟人层并附截图**（见 [14](14-testing.md) §4）。

## 4. 开发与验证

```bash
pnpm dev            # 开发服务（vite）
pnpm build          # 构建产物 dist/（拟人层测的是它）
pnpm lint           # 基础语法：stylelint · eslint · tsc
pnpm check          # 规范门禁：11 个检查器
pnpm test           # 单元 / 组件
pnpm test:browser   # 浏览器（真实渲染）
pnpm test:persona   # 拟人（剧本 + 采集脚本 + 看图）
pnpm test:all       # 六层全链：lint → gates → checkers → unit → browser → build → persona
```

每层落一份日志于 `app/logs/<日期>/`（`lint-` · `gates-` · `checkers-` · `unit-` · `browser-` · 拟人按场景名），
链另落 `all-<HHMM>.log`；断在哪一步以链的日志为准。

## 5. 交付要求

1. `pnpm lint` 与 `pnpm check` 均须通过（基础语法在前，规范门禁在后）。
2. `pnpm test:all` 全绿；机器层全绿不构成交付条件。
3. **必须执行拟人层，并将截图附给交付对象** —— 拟人是唯一检视画面的层，"已执行"不构成证据（见 [14](14-testing.md)）。

## 附：本章节的编辑约定

本章节读者是 Agent，编辑时遵循：写规则不写现状（app 代码会被重置）· 不写「待讨论」· 一条规则只在一处写全 ·
举例用通用名 · 能表格则表格 · 路径从包根写全（`app/src/…`，仓库根写 `../../…`）· 引代码入口不引设计。
格式照 [`00-principles.md`](00-principles.md) 的样板（`## 1. <硬规则>` + `## 2. <主题>`，测试另起一章）。改完执行 `pnpm check`。
