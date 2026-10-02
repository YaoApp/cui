# 14 · 测试（工程落点）

- **版本**：v1.30
- **最后修改**：2026-10-02 14:45:28
- **说明**：测试分层（规则见 plan/20）

## 分层与分工

| 层 | 工具 | 判定者 | 测什么 | 命令 → 日志 |
| --- | --- | --- | --- | --- |
| **规范门禁** | `scripts/check-*.mjs`（**零依赖**）+ lints | 确定性代码 | 设计规范（token · i18n · 样式约定 · 文档结构）· 类型 · 依赖边界 | `pnpm check` → `gates-<HHMM>.log` |
| **检查器自测** | `scripts/tests/run.mjs` | 确定性代码 | 每条检查规则一个正例 + 一个违规例 | `pnpm test:checkers` → `checkers-<HHMM>.log` |
| **单元 / 组件** | `vitest` · Testing Library · `jsdom` | 确定性代码 | 纯逻辑 · 状态与数据层 · 组件行为 | `pnpm test` → `unit-<HHMM>.log` |
| **浏览器** | `@playwright/test` | 确定性代码 | 关键交互主路径 · 中文输入法 · 全键盘 · 视觉回归 | `pnpm test:browser` → `browser-<HHMM>.log` |
| **拟人** | 剧本 + 真浏览器 + 看图 · `ocr_recognize` · `decision_decide` | **执行者判定，按需转人** | 真实使用路径 · 极端数据 · 环境差异 | `pnpm test:persona` → `<场景>-<HHMM>.log` |

**`pnpm test:all`** 一把跑：门禁 + 检查器自测 + 单元 + 浏览器 + **构建** + 拟人 ——
**构建放在拟人之前**，因为拟人层测的是**构建产物**（`dist/`），不是 dev 源码；
整条链另留一份 `all-<HHMM>.log`（断在哪一步只有它说得清）。

## 配置与命令

- `vitest.config.ts`：`jsdom` · `include: ['app/src/**/*.test.{ts,tsx}']` · setup 用 `test-support/setup.ts` · 覆盖率排除用例与样式。
- `playwright.config.ts`：`testMatch: '**/tests/**/*.browser.ts'` · `channel: 'chrome'`（不下载浏览器）· `reuseExistingServer` 复用已在跑的 dev。
- **`vitest` 与 `playwright` 的默认匹配范围会重叠**，配置必须显式收窄，否则互相误抓（拟人是我们自己的脚本，不在其中）。
- `test-support/stores.ts`：**按文件名自动发现** store、登记初始状态并**逐用例复位** ——
  两种命名都认：私有的 `*.store.ts`（组件 / feature / 平台层）与公共的 `stores/*.ts`（无后缀）。
  `setup.ts` 不写清单（`stores.test.ts` 断言它跨层）。**改发现规则只改这里。**
- 命令：`pnpm test` · `pnpm test:browser` · `pnpm test:checkers` · `pnpm test:persona` · `pnpm test:all`。
- **CI**：门禁 + 单元 + 构建进 `celadon-test-build.yml`；浏览器测试单独 `celadon-browser-test.yml`
  （用 runner 自带的 Google Chrome，不必 `playwright install`；失败上传轨迹与截图）。runner 与 action 版本见 `13-quality-gates.md`。

## 运行时输出一律英文

脚本的 `console` 输出、报错、用例名一律英文（CI 与测试面向所有贡献者）；注释与 `plan/` `design/` `architecture/` 文档仍用中文。

## 日志

落在 **`app/logs/<系统日期>/<名>-<HHMM>.log`**（git 忽略），屏幕与文件双写，退出码原样透传；实现是 `scripts/run-logged.mjs`。

| 日志名 | 命令 |
| --- | --- |
| `gates-1355.log` | `pnpm check`（带日志的外壳，真正的检查链在 `pnpm check:run`）|
| `checkers-1355.log` | `pnpm test:checkers` |
| `unit-1355.log` | `pnpm test` |
| `browser-1355.log` | `pnpm test:browser` |
| `all-1355.log` | `pnpm test:all`（整条链）|
| `<场景>-1355.log` | `pnpm test:persona`（一个场景一份，如 `structure-trial-1355.log`）|

- 时间取系统日期与时分，**不做时区换算**；同一分钟内重跑同名文件会覆盖。
- **保留 14 天**：顺带清理超期的 `YYYY-MM-DD` 日期目录（别的不碰），`CUI_LOG_KEEP_DAYS` 可调。
- 找最新：`ls -1t app/logs/*/*.log | head -1`。
- **CI 摘要**：workflow 末尾 `if: always()` 的步骤把 `app/logs/*/*.log` 折进 `$GITHUB_STEP_SUMMARY`，红绿都能直接读，不必下 artifact。
  **摘要必须纯文本** —— job 级 `FORCE_COLOR=0` 关色（**只设这一个**：与 `NO_COLOR` 同设 node 会告警），
  写摘要时再用 `sed` 剥离转义码并去掉 `\r` 兜底（这一道不依赖工具行为）。
- 日志在 dev 下可按 URL 读到，**可接受**；生产只发 `dist/`（已用哨兵实测：`app/` 下的 `.md`/`.log`/`.txt` 一个都不进 `dist/`）。
  `pnpm test:watch` 是交互式的，不进日志。

## 卡住时的排查

**同步死循环会占死事件循环，用例自身的超时拦不住它**（同步代码不让出事件循环）。按这个顺序查：

1. **确认是死循环** —— `CUI_STEP_TIMEOUT`（默认 300s）会把超时的一步 `SIGKILL` 掉、退出码 **124**，
   日志里出现 `ABORTED after` 就是它；逐步加载包装器之前，它会先替你止损。
2. **绕过 pnpm 直跑** —— `./node_modules/.bin/vitest run <文件>`。仍卡 → 与 pnpm / 锁无关。
3. **按用例名二分** —— `vitest run <文件> -t "<用例名>"`，一步一个。**别写新探针去猜**：
   本次事故里探针"过了"只是因为漏了那条带 query 的路径。
4. **要看卡在哪一行** —— 用 `fs.appendFileSync('/tmp/x.log', …)` 写标记：vitest 会拦截 `console`，
   通过用例的输出不显示，同步死循环时更刷不出来。
5. 拿到具体用例后，先问一句 **"哪两个状态在互相追"** —— 本项目踩过的就是 URL 与 store 的互相追写
   （见 `07-routing.md` 的「谁说了算」，那条规则的机器强制是 `check-effect-url-write.mjs`）。

`scripts/run-logged.mjs` 就是这层看门狗；`CUI_STEP_TIMEOUT=0` 可关掉。

## 待做

- 搬入模块补测试 · 拟人剧本覆盖到后续模块（见 [`../plan/01`](../plan/01-infrastructure.md) §3）。

## 2. 单元 / 组件测试

- **位置（强约束，两条方向相反）**：
  - **单元用例与源文件同目录** —— `button.tsx` 旁边就是 `button.test.tsx`；`hello.tsx` 旁边就是
    `hello.test.tsx`；`hello.store.ts` 旁边就是 `hello.store.test.ts`；**不许进 `tests/`**
  - **浏览器用例与拟人剧本脚本进该 feature 的 `tests/`** —— 它们描述的是整体场景，不属于某一个组件或文件
- **这条由 `check-app-layout` 强制**（两条方向相反的规则，各带正反样本；见 `architecture/13-quality-gates.md`）。
- **store 的复位是全自动的** —— 测试支持用 `import.meta.glob('../**/*.store.ts')` 自动发现所有 store，
  跑测试前登记初始状态，每个用例后整体复位（`theme.store.test.ts` 里有一条依赖顺序的守卫证明它还在起作用）。
  **新增 store 不需要改任何测试配置。**
- **后缀即分工（三条）**：单元 / 组件 `*.test.ts(x)` · 浏览器 `*.browser.ts` · 拟人 `*.agent.md` + `*.agent.mjs`
  （**同一 `tests/` 目录内并存**）
- **按场景命名**：一个场景一个文件，文件名说清是哪个场景（`main-path.browser.ts` · `theme.browser.ts` ·
  `main-path.agent.md`）。文件名不该是"某组件"，那是文件内部的事—— **两个工具的默认匹配范围都同时包含 `test` 与 `spec`**（`vitest` 默认 `**/*.{test,spec}.?(c|m)[jt]s?(x)`；`playwright` 默认也吃 `test` 与 `spec`，而我们的后缀已改成 `browser`，仍要显式收窄），因此**两边配置都要显式收窄**，否则互相误抓
- **共享件**：setup · 跨组件复用的夹具 · 全局 store 重置放 `app/src/test-support/`，**不放进单元目录**
- **硬要求**：从旧仓库搬入的模块必须有测试；状态与数据层必须有测试
- **断言用户看到什么**（可见文字 · 角色 · 可访问状态），**不测内部结构**
- **mock 边界**：网络 mock · 时间冻结 · 存储内存实现；**真实渲染引擎不 mock** —— 交给浏览器层
- **覆盖率不设阈值** —— 用于发现盲区，不作验收
- 不用快照测试替代行为断言

## 3. 浏览器测试

**主路径用例在写组件 / 页面时产生** —— **不在本模块预先列举**（各模块的路径由其功能决定，见 `architecture/02-toolchain.md`–`architecture/11-formatting-and-lists.md`）。规则：

- **来源**：该模块的验收条款
- **数量**：每个模块**只留少量最关键的主路径**（分层 70/20/10 —— UI / E2E 只占一层，其余压到下层）
- **写在哪**：该 feature 的 `tests/` 目录内（**与单元用例分开放**），后缀 `*.browser.ts`、**一个场景一个文件**；**该模块的计划里列出它自己的主路径清单**
- **格式**：路径（用户语言）+ 要点（关键断言）

**UI 底座验收**（一次性，之后并入回归）：**中文输入法**（组合中 · 候选词 · **未上屏时回车 / 点击不误提交**）· **全键盘**（Tab 顺序 · Esc · Enter · **焦点环可见**）· **token 换肤生效**（深浅色跟随 token，非硬编码样式）

**选择器语义优先** —— 用用户看到的文字 / 角色 / 可访问名；**无稳定文字时才加测试 id**。

**稳定性三招**：

| 源头 | 做法 |
| --- | --- |
| 数据 | mock 后端 · 固定种子数据 |
| 时间 | 冻结时钟；动画用假时钟推进，**不用 sleep** |
| 同步 | **等条件**；断言可见性前**先 `waitForIdle()`** |

**flake 治理**：不稳定测试**隔离**（目标 < 1%）· **禁止盲重试** —— 必须写根因分诊。

**视觉回归**：**截图 golden**（固定状态 + 冻结时间 + 像素比对）· 基线变更**人工确认后更新**，变更进提交记录。

**引擎矩阵**：桌面浏览器（Chromium / WebKit）· **桌面壳 WebView** · **移动端 PWA** —— 引擎差异必须在这里发现。

## 4. 拟人测试（AI 测试）

**位置（规范）**：

- **只有 feature 需要拟人测试** —— 组件与基础件不进这一层（它们由单元与浏览器两层覆盖）。
- **剧本住 `app/src/features/<域>/tests/<场景>.agent.md`，进仓库**；**一个场景一份**。
- **文件结构固定三段**：
  1. **剧本（恒定）** —— 场景是什么 · 怎么做（用人的语气写清走哪几步）· 判定数据（执行前冻结）· 不做的部分与原因。
     **不随每轮结果改动**；真要改，在「修改记录」里记一笔（时间 · 改了什么 · 为什么）。
  2. **修改记录** —— 只记剧本本身的改动，按时间倒序或正序排。
  3. **测试记录** —— 每轮一行：轮次 · 时间 · 状态（通过 / 不通过 / 看不清；不通过要写性质，转人要写理由）·
     **指向当轮的日志明细**。
- **结果明细一律看日志** —— 机器测量与执行者判定都写进 `app/logs/<日期>/<场景>-<HHMM>.log`，
  剧本里**不复制**（避免同一件事两处维护）。
- **采集脚本与剧本同名同场景**：`<场景>.agent.mjs`。后缀即分工：`*.test.ts(x)` 给 vitest ·
  `*.browser.ts` 给 Playwright · `*.agent.mjs` 给 `pnpm test:persona`。

**固化脚本（拟人层只用这三个，采集脚本不自己造轮子）**：

| 脚本 | 职责 | 契约 |
| --- | --- | --- |
| `scripts/run-persona.mjs` | 发现并逐个跑拟人场景 | 扫 `app/src/features/*/tests/*.agent.mjs`；**一个场景一份日志**；一个场景都没有即失败 |
| `scripts/run-logged.mjs` | 跑一条命令并把输出双写 | `node scripts/run-logged.mjs <日志名> <命令> [参数…]` → `app/logs/<日期>/<日志名>-<HHMM>.log`，**退出码原样透传** |
| `scripts/shots.mjs` | 截图（**唯一出口**）| `capturePage(page, path)` 页面视口（跨平台）· `captureScreen(path, { region, format })` 系统级整屏（**只实现 macOS**）· `shotDir(场景)` 算目录。CLI：`shots.mjs dir <场景>` · `shots.mjs screen <out> [--region x,y,w,h] [--format png 或 jpg]` |

- **截图一律走 `shots.mjs`** —— 采集脚本不自己调 `page.screenshot()`；判定用的像素来自 `capturePage()`。
- **测的是构建产物**：`pnpm build` 之后的 `dist/`。采集脚本带**产物新鲜度守卫** —— `dist` 比影响构建的源码旧，
  或 `dist` 不存在，就明确失败（别拿过期产物判"通过"；测试/剧本/采集脚本自己不算影响构建）。
- **落位**：`app/logs/<日期>/shots/<场景>/` —— 按日期分目录 · 专门一层 `shots` · 再按拟人文件分目录
  （同名场景当天多次运行会覆盖，历史在日志里）。
- **平台适配**：系统级截图集中在 `shots.mjs` 的 `PLATFORMS` 表，**没实现的平台抛清晰错误、不假装成功**
  （页面截图跨平台，不受影响；要用新平台就在表里加一条）。整屏用 jpg（png 有 10M 量级）；
  `CUI_HEADED=1` 开真窗口，那一屏才包含浏览器，默认 headless 时如实标注。
- 采集脚本只做机器能做的部分（开真浏览器 · 按剧本走 · 截图 · 报客观测量），**判定仍由执行者给出**。

**动机**：开发与测试是同一个执行者 → 风险是**自我确认**（测试按实现写、断言按现有行为写，于是"全绿"但用户一用就坏）。

**铁律**：**禁止无证据、无人复核的自动判定**；判定必须有证据、可复核。**长链条拆短**，逐步验证。
依据：自动运行的模型定位器会**静默愈合到错误元素**；视觉 agent 中文界面识别约 60%，长链条成功率指数衰减。

### 4.1 角色分离

1. **只看验收标准，不看实现** —— 判"符不符合承诺"，不是"跟代码符不符"
2. **先写剧本，再执行** —— 剧本用用户语言（"我想改会话标题"），不写函数名 / 选择器
3. **预期在执行前写死**，不许看完再补
4. **证据是外部产物** —— 截图 · 执行轨迹 · OCR 文本；**"我验证过了"不算证据**

### 4.2 人味清单

| 类别 | 动作 |
| --- | --- |
| 中文输入 | 输入法组合中 · 候选词 · 中英混输 · 全角标点 · **未上屏时回车 / 点击** |
| 全键盘 | Tab 顺序 · Esc 关闭 · Enter 提交 · **焦点环可见** · 不用鼠标走完主路径 |
| 乱来 | 重复点 · 提交中再点 · 中途刷新 · 后退 · 断网 · 关掉再开 |
| 极端数据 | 空态 · 只有 1 条 · 上千条 · 超长单行 · emoji · 纯英文 / 纯数字 / RTL 文本 |
| 环境 | 深浅色 · 缩放 125% / 150% · 窄窗 · 慢网 · 非本地时区 |
| 跨会话 | 切换后状态是否串 · 刷新后滚动位置与输入草稿 |

### 4.3 判定

**三件互补** —— 各自弱的地方正是别人强的地方：

| 手段 | 强在哪 | 弱在哪 |
| --- | --- | --- |
| **看截图**（执行者原生视觉）| 布局 · 状态（空 / 满 / 错）· 是否塌 · 观感是否别扭 | 精确文字与数字不可靠 |
| **OCR**（**`ocr_recognize`**）| 文字与数字**逐字精确** · 表格 · 手写 | 看不出"哪里不对劲" |
| **决策模型**（**`decision_decide`**，分类 / 评分 / 度量）| 给出**分级结论 + 置信度** | 需要先把输入整理干净 |

> **`decision_decide` 与 `ocr_recognize` 不在默认工具提醒里** —— 命令写在这里，不必每次查技能文件：

```bash
# OCR：截图 → 文字（json 带坐标与置信度）
tai tool ocr_recognize --source <截图路径> --output_format json --language zh
#   --type table|handwriting|invoice|...   按内容类型提升准确率

# 决策：事实 → 分级结论（choice 分类 / score 评分 / noul 概率）
tai tool decision_decide \
  --state '<被判定的事实：截图所见 + 预期 + 差异>' \
  --questions '{"verdict":{"type":"choice","instructions":"判定该步是否通过","criteria":{"pass":"符合预期","fail":"与预期不符","unclear":"证据不足"}}}'

# 列可用 provider / 模型
tai tool decision_providers
tai tool ocr_providers
```

> 完整参数见平台技能文件 `yao-ocr` / `yao-decision`。

**流程**：**看图发现问题 → OCR 确认文字与数值 → 决策模型分级 → 按需转人**；判定必须能回到同一张截图与同一步操作。
**置信度是门控，不是保证**：高置信可用 · 低置信不得自行结案。

**转人由执行者判定** —— 不是固定一环，也不许一律丢给人。**必须显式给出「是否转人 + 理由」**：

| 转人 | 自行判定 |
| --- | --- |
| 需要**口味与价值裁定**：观感别扭与否 · 文案语气 · 视觉风格取舍 · 成本取舍 | 有明确判据，且能用证据自证 |
| **看不清** —— 证据不足且补不到 | 低风险、可回退 |
| **高风险 / 不可逆**：数据 · 权限 · 支付 · 发布 | 与验收条款逐条对照即可判 |

**转人时随结论发出截图** —— **图片直接嵌在消息里**，审阅者**可能用手机看**：

- 用 `![说明](workspace://<workspace-id>/<路径>)` 发图，**不写本地路径、不说"见某文件"**
- 一张截图配一句**看的是哪一步、预期是什么**；多步就多发几张
- 需要长期引用或打包时，再用附件接口存成可分享的文件（`attachment.Save` / `attachment.Zip`）

### 4.4 触发与留档

- **触发**：模块完成 → 该模块剧本；提交前 → 相关剧本；发布前 → 主路径全量
- **留档**：**剧本与结论进仓库**（`features/<域>/tests/<场景>.agent.md`）· **证据跟日志走**
  （`app/logs/<日期>/persona-<HHMM>/`，git 忽略）· flake 根因与新失败回流仍留工作区
- **结果日志**：`pnpm test:persona` 每个场景写一份 `app/logs/<日期>/<场景>-<HHMM>.log`（与其它四层同一命名规矩）
- **结论含"看不清"，不许并进"通过"**
