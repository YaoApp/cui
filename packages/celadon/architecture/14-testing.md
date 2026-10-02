# 14 · 测试（工程落点）

- **版本**：v1.45
- **最后修改**：2026-10-02 20:43:47
- **说明**：测试分层 · 位置与命名 · 断言与 mock 边界 · 浏览器与拟人 · 配置与日志

## 1. 规则

- **位置**：单元用例与源文件**同目录**；浏览器用例与拟人剧本进 `features/<域>/tests/`。**由 `check-app-layout` 强制**（见 `13-quality-gates.md`）。
- **后缀即分工**：`*.test.ts(x)` 单元 · `*.browser.ts` 浏览器 · `*.agent.md` + `*.agent.mjs` 拟人。
- **一个场景一个文件**，文件名说清是哪个场景（`main-path` · `theme`），不是"某组件"。
- **断言用户看到什么**（可见文字 · 角色 · 可访问状态），**不测内部结构**；不用快照替代行为断言。
  **渲染结果类**（图标 · 图形）要断言它**真的画出来**（缩放用 `viewBox` · 描边 · 可见性），
  不是"元素存在"—— 元素在而没画出来，是最难发现的一类假绿。
- **选择类基础件按 ARIA 角色断言**（`combobox` / `listbox` / `option`），**不用 `.selectOption()` / `toHaveValue()`**（见 `09-theme.md` §4）。
- **mock 边界**：网络 · 时间 · 存储可以 mock；**真实渲染引擎不 mock**，交给浏览器层。
- **覆盖率不设阈值** —— 用来发现盲区，不作验收。
- **交付前必须跑拟人，并把截图附给交付对象** —— 机器层全绿不等于"能交付"：拟人是唯一看**画面**的一层，
  而"我跑过了"不算证据；**截图要跟着结论一起给出去**（落 `app/logs/<日期>/shots/<场景>/`）。
- **共享件**（setup · 夹具 · store 复位）住 `app/src/test-support/`，**不放进单元目录**。
- **搬入的模块必须有测试**；状态与数据层必须有测试。
- **拟人脚本自己 `launch` 浏览器**（不走 Playwright 配置）→ **必须显式钉浏览器环境**：`locale`（语言）与
  `colorScheme`（配色）都跟随系统，不钉的话跑测机器的语言或深浅一变，剧本断言的文案与观感就漂。
- **运行时输出一律英文**（见 §7）。

## 2. 分层与分工

| 层 | 工具 | 判定者 | 测什么 | 命令 → 日志 |
| --- | --- | --- | --- | --- |
| **基础语法** | `stylelint` · `eslint` · `tsc` | 确定性代码 | LESS / JS 的语法与格式 · **TS 的语法与类型** | `pnpm lint` → `lint-<HHMM>.log` |
| **规范门禁** | `scripts/check-*.mjs`（**零依赖**）| 确定性代码 | 设计规范（token · i18n · 样式约定 · 文档结构）· 类型 · 依赖边界 | `pnpm check` → `gates-<HHMM>.log` |
| **检查器自测** | `scripts/tests/run.mjs` | 确定性代码 | 每条检查规则一个正例 + 一个违规例 | `pnpm test:checkers` → `checkers-<HHMM>.log` |
| **单元 / 组件** | `vitest` · Testing Library · `jsdom` | 确定性代码 | 纯逻辑 · 状态与数据层 · 组件行为 | `pnpm test` → `unit-<HHMM>.log` |
| **浏览器** | `@playwright/test` | 确定性代码 | 关键交互主路径 · 中文输入法 · 全键盘 · 视觉回归 | `pnpm test:browser` → `browser-<HHMM>.log` |
| **拟人** | 剧本 + 真浏览器 + 看图 · `ocr_recognize` · `decision_decide` | **执行者判定，按需转人** | 真实使用路径 · 极端数据 · 环境差异 | `pnpm test:persona` → `<场景>-<HHMM>.log` |

**`pnpm test:all`** 一把跑：门禁 + 检查器自测 + 单元 + 浏览器 + **构建** + 拟人 ——
**构建放在拟人之前**，因为拟人层测的是**构建产物**（`dist/`），不是 dev 源码；
整条链另留一份 `all-<HHMM>.log`（断在哪一步只有它说得清）。

## 3. 浏览器测试

**主路径**：来源是**该模块的验收条款**；**只留少量最关键**（分层 70/20/10，UI / E2E 只占一层）；
用例在写组件 / 页面时产生，**不预先列举**；该模块的清单写进**它自己的计划**。

| 项 | 规范 |
| --- | --- |
| 位置 · 后缀 | 该 feature 的 `tests/` 内（与单元分开）· `*.browser.ts` · 一个场景一个文件 |
| 格式 | 路径（用户语言）+ 要点（关键断言）|
| 选择器 | **语义优先** —— 用户看到的文字 · 角色 · 可访问名；无稳定文字才加测试 id |
| 稳定性 | 数据 mock + 固定种子 · **时间冻结**（动画用假时钟，**不用 sleep**）· **等条件**（断言可见性前先 `waitForIdle()`）|
| flake | 不稳定用例**隔离**（目标 < 1%）· **禁止盲重试**，要写根因分诊 |
| 视觉回归 | 截图 golden（固定状态 + 冻结时间 + 像素比对）· 基线变更**人工确认**后更新并进提交记录 |
| 引擎 | 桌面 Chromium / WebKit · **桌面壳 WebView** · 移动端 PWA |

**UI 底座验收**（一次性，之后并入回归）：**中文输入法**（组合中 · 候选词 · 未上屏时回车 / 点击不误提交）·
**全键盘**（Tab 顺序 · Esc · Enter · **焦点环可见**）· **token 换肤**（深浅跟随 token，不硬编码）。

## 4. 拟人测试（AI 测试）

**只有 feature 需要这一层** —— 组件与基础件由单元与浏览器两层覆盖。

| 项 | 规范 |
| --- | --- |
| 剧本 | `features/<域>/tests/<场景>.agent.md`，**进仓库**，一个场景一份；用**人的语气**写清走哪几步 |
| 采集脚本 | 同名同场景 `<场景>.agent.mjs`（`pnpm test:persona`）|
| 结果明细 | **只看日志**（`app/logs/<日期>/<场景>-<HHMM>.log`）；剧本里**不复制** |
| 被测 | **构建产物**（`pnpm build` 后的 `dist/`）；脚本带**新鲜度守卫**，产物旧或缺失即失败 |
| 截图 | **一律走 `scripts/shots.mjs`**（不自己调 `page.screenshot()`）；落 `app/logs/<日期>/shots/<场景>/` |
| 脚本 | 只用 `run-persona.mjs` · `run-logged.mjs` · `shots.mjs` 三个，**不自己造轮子** |
| **判定** | **执行者判定**：看图 · OCR（`ocr_recognize`）· 决策模型（`decision_decide`），**按需转人** —— 见 §4.3 |

**剧本固定三段**：① **剧本**（场景 · 怎么做 · **判定数据执行前冻结** · 不做的部分）—— **不随每轮结果改**，
要改就在「修改记录」记一笔（时间 · 改了什么 · 为什么）② **修改记录** ③ **测试记录**（每轮一行：轮次 · 时间 ·
状态 · **指向当轮日志**）。

**铁律**：**禁止无证据、无人复核的自动判定**；长链条拆短、逐步验证。

### 4.1 角色分离

1. **只看验收标准，不看实现** —— 判"符不符合承诺"，不是"跟代码符不符"
2. **先写剧本，再执行** —— 剧本用用户语言，不写函数名 / 选择器
3. **预期在执行前写死**，不许看完再补
4. **证据是外部产物**（截图 · 执行轨迹 · OCR）—— "我验证过了"不算证据

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
| **OCR**（`ocr_recognize`）| 文字与数字**逐字精确** · 表格 · 手写 | 看不出"哪里不对劲" |
| **决策模型**（`decision_decide`）| 给出**分级结论 + 置信度** | 需要先把输入整理干净 |

```bash
tai tool ocr_recognize --source <截图> --output_format json --language zh
tai tool decision_decide --state '<被判定的事实>' \
  --questions '{"verdict":{"type":"choice","criteria":{"pass":"符合预期","fail":"与预期不符","unclear":"证据不足"}}}'
tai tool ocr_providers        # 列可用 OCR provider / 模型
tai tool decision_providers   # 列可用决策 provider / 模型
```

**流程**：**看图发现问题 → OCR 确认文字与数值 → 决策模型分级 → 按需转人**；判定必须能回到同一张截图与同一步操作。
**置信度是门控，不是保证**：高置信可用 · 低置信不得自行结案。

**转人由执行者判定**（不是固定一环，也不许一律丢给人）—— **必须显式给出「是否转人 + 理由」**：

| 转人 | 自行判定 |
| --- | --- |
| 需要**口味与价值裁定**：观感 · 文案语气 · 视觉风格 · 成本取舍 | 有明确判据，且能用证据自证 |
| **看不清** —— 证据不足且补不到 | 低风险、可回退 |
| **高风险 / 不可逆**：数据 · 权限 · 支付 · 发布 | 与验收条款逐条对照即可判 |

**转人时随结论发截图** —— **嵌在消息里**（审阅者可能用手机看）：用
`![说明](workspace://<workspace-id>/<路径>)`，**不写本地路径、不说"见某文件"**；一张配一句"看的是哪一步 · 预期是什么"。

### 4.4 触发与留档

| 项 | 规范 |
| --- | --- |
| 触发 | 模块完成 → 该模块剧本 · 提交前 → 相关剧本 · 发布前 → 主路径全量 |
| 留档 | 剧本与结论**进仓库** · 证据跟日志走（git 忽略）· flake 根因与新失败回流留工作区 |
| 状态 | **"看不清"不许并进"通过"** |

## 5. 配置与命令

- **两个工具的默认匹配范围都包含 `test` 与 `spec`** —— 配置里必须显式收窄，否则互相误抓（见 `check-app-layout` 的两条反向规则）。

- `vitest.config.ts`：`jsdom` · `include: ['app/src/**/*.test.{ts,tsx}']` · setup 用 `test-support/setup.ts` · 覆盖率排除用例与样式。
- `playwright.config.ts`：`testMatch: '**/tests/**/*.browser.ts'` · `channel: 'chrome'`（不下载浏览器）· `reuseExistingServer` 复用已在跑的 dev。
- **`vitest` 与 `playwright` 的默认匹配范围会重叠**，配置必须显式收窄，否则互相误抓（拟人是我们自己的脚本，不在其中）。
- `test-support/stores.ts`：**按文件名自动发现** store、登记初始状态并**逐用例复位** ——
  两种命名都认：私有的 `*.store.ts`（组件 / feature / 平台层）与公共的 `stores/*.ts`（无后缀）。
  `setup.ts` 不写清单（`stores.test.ts` 断言它跨层）。**改发现规则只改这里。**
- 命令：`pnpm test` · `pnpm test:browser` · `pnpm test:checkers` · `pnpm test:persona` · `pnpm test:all`。
- **CI**：门禁 + 单元 + 构建进 `celadon-test-build.yml`；浏览器测试单独 `celadon-browser-test.yml`
  （用 runner 自带的 Google Chrome，不必 `playwright install`；失败上传轨迹与截图）。runner 与 action 版本见 `13-quality-gates.md`。

## 6. 运行时输出一律英文

脚本的 `console` 输出、报错、用例名一律英文（CI 与测试面向所有贡献者）；注释与 `plan/` `design/` `architecture/` 文档仍用中文。

## 7. 日志

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

## 8. 卡住时的排查

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
