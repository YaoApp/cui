# 08 · 布局：未完成（跟踪）

- 已实现的部分见 [08-layout-implemented.md](08-layout-implemented.md)（组件与目录 · 三栏与窗口 · 导航列 · 标签浏览器顶栏与标签 · 两处收放的动效 · 量测 · 图标账 · 验证方式 · 不做）
- 依据：`design/main-shell.md` §四与§五（内容形态与第三栏）· §七（独占与运行）· `design/foundations.md` F4 与 F6（动效 · 三栏分割与让位）· `design/layout.md`（列表项与键的口径）· `architecture/06-state.md` §2.3
- 状态：进行中（2026-10-16）。本册是 08 系列**唯一**的跟踪册；已完成的事实写进已实现那一册，不再另立分册。

**状态口径**：`[x]` 指代码在、用例在、门禁过；`[~]` 指做了一半，缺什么写在条目里；`[ ]` 指还没动。勾选前先跑相关用例，并在浏览器里按设计文档量过。

## 0. 待办清单

### 0.1 标签浏览器内部

- [x] **键盘与鼠标**：标签条走 roving tabindex（整条只有一个标签可 Tab 到，落点跟着当前页）· 左右箭头只挪焦点、不换页 · `Enter` 与 `Space` 激活 · `Delete` 关闭当前标签（中键关闭已成）· `Alt` 加左右箭头把当前标签在整表里挪一位、焦点跟着标签走。Tab 序为 标签条 → 新建 → 下拉 → 最大化或恢复 → 关闭。指针位移不超过 4 像素算点击，超过算拖动，两者互不误触。用例在 `app/src/components/browser/tests/keyboard.browser.ts`（四条）。
- [x] **标签右键菜单**：刷新 · 关闭这个标签 · 分隔线 · 关闭其他标签 · 关闭全部标签；后两项按可用性置灰（没有别的可关页时「关闭其他」置灰，没有可关页时「关闭全部」置灰，首页那一页的「关闭这个标签」置灰）。菜单按指针位置开，`Esc` 与点外面收掉。「刷新」已接上回调（外部页目前是占位，回调暂无可见变化）。关闭当前标签后的激活规则为「右邻优先、没有右邻取左邻、都没有则落回首页」，store 的 `close` 已是这一条。用例在 `app/src/components/browser/tests/tab-menu.browser.ts`（三条）与 `app/src/stores/browser/tabs.test.ts`（只留一页 · 关闭全部各一条）。
- [x] **首页的「打开过的东西」**：store 里新增 `recent`（打开或在页里换内容时记一条，首页与空页不记；最近的在前，同一目标只留一条并提到最前，上限 8 条；关掉页不抹记录；随 `cui.browser` 持久化，版本升到 3，旧数据迁移补空表）。首页下半部分按它列出，点一条走 `open` 复用已有那一页并把它提到最前；空态文案四语已有。装配层不再用「当前开着的标签」临时拼清单。用例在 `app/src/stores/browser/tabs.test.ts`（一条）与 `app/src/components/browser/tests/recent-address.browser.ts`（一条）。
- [x] **地址的错误态**：判据落在 `stores/browser/targets.ts` 的 `isAddressLike`，去空格后为空算空输入，已知名字、`/` 开头的内部路由、带点的域名与 `localhost` 算地址，带空格、没有点、只有协议头的不算。空输入与不像地址各给一条错误文案，走基础 `Input` 的 `error`（带 `invalid`）；一改动输入就清掉错误。四语键 `shell.browser.address.empty` 与 `shell.browser.address.invalid`（键名三段以内）。用例在 `app/src/components/browser/tests/recent-address.browser.ts`（一条，覆盖两种错误态与合法输入后收起）。
- [ ] **标签关闭后其余标签的跟随位移**：现为瞬时。原按布局投影实现，投影会在 WebKit 上引起重栅格化，已从标签上移除；改用哪种做法待定。约束是：外层 `.browser__tab` 的 `transform` 要留给拖动（它若带过渡，松手清位移会从「新槽位减旧位移」插值、看起来先绕最左），所以这条不能简单给外层加 `transform` 过渡。
- [ ] **状态齐与截图**：默认 · 悬停 · 焦点 · 禁用 · 空逐条落实，浅色与暗色各一张截图。焦点态随键盘那条已落地（标签可键盘到达、焦点环可量）；禁用态随右键菜单那条已落地（置灰项的 `aria-disabled` 与文字色都有用例）；空态是首页的「还没有打开过东西」。仍缺的是逐条核对与浅暗两套截图。

### 0.2 收口与复核

- [x] **回写与用例（收口项）**：设计侧已写侧栏切换键的显隐、第三栏一节、两个底档用途、F4 的两条 WebKit 规则、标签条与两处菜单的口径（`design/layout.md` §5.1 与 `design/main-shell.md` §五）、入场的做法（`architecture/12-motion.md` 改为 CSS 过渡）、首页的打开记录与地址判据（`design/main-shell.md` §五的首页与外部地址两行）。
- [ ] **隔离复核处置**：上一轮复核跑通四条门禁、未发现功能性缺陷，列出九项文档与注释层面的处置。已办三项：① 组件 README 与各处用例路径；③ `browser.tsx` 引用计划条目号与描述不存在结构的注释；⑧ `browser.less` 的 `.browser__move` 死选择器。未办六项：② `components/browser/types.ts` 的 `closable` 注释与 `parts/new-tab/new-tab.tsx` 的注释仍是旧口径；④ `stores/browser/tabs.ts` 的 `open` 在生产代码里已无调用者、图标回退的注释指向的模块里没有这条推断；⑤ `browser.less` 里 `:has(:focus-visible)` 那条与「不写 `:has()`」的记录不一致（标签现已可键盘到达，这条会走到，需连同记录一起定）；⑥ 内容列头关于浏览器槽位「键恒在、占位保留」的注释与实现的 `display: none` 不符；⑦ 分屏时两个面板可能同时渲染新标签页，`new-tab.tsx` 固定的 `id="browser-address"` 会出现同 id；⑨ `navigate` 不去重，重复一次会得到两个同目标标签，与「不做并列的第二页」相抵，随真实内容接线一并定。
- [ ] **第三栏收放的收尾**：裁切层加定尺内容壳已落地，`min-inline-size` 与宽度一起过渡后，真 Safari 里 300 宽的跳变已消；仍留三项：点击到动画起步之间约 110 毫秒的静止期（7 帧）、起步那一帧 31 毫秒、以及收起状态下刷新时列头找回键约 320 毫秒不可见（那条带延迟的关键帧在首帧也会跑一遍）。前两项同源，都是布局翻面那一下的重排与首绘。

### 0.3 待定的设计与窄栏

- [ ] **窄栏与镜像**：窄栏优先级 标签条 → 下拉 → 最大化或恢复 → 关闭；镜像细节（键组贴哪一侧、找回键是否随栏换边）等结论后落。
- [ ] **窄视口手动展开为浮层**：规则是 F6 的「导航栏不参与宽度让步，视口窄时手动展开覆盖中栏，不挤压它」。实现形状：不新增状态机，窄视口下这一档由「窄视口且已展开」派生，沿用同一个收起开关；呈现仍是同一套展开态内容，只多一层浮层外壳（脱离弹性流、宽度取存值、背后一层遮罩、浮层内不画拖拽把手）；关闭三条路为 `Esc`、点遮罩、选中条目。安排在桌面客户端适配之后单独一批，客户端收起为零宽，浮层语义与 Web 不同，两档分开验收。窄视口下二级导航暂时不可达。
- [ ] **待清的技术债**：内容区与标签浏览器两处的内部资料指针注释、hook 归位（认证域的六个 `use-*.ts` 与脚手架的 `use-routing-url-sync.ts` 收进各自 `hooks/`）、token 检查器不校验 `var(--x)` 是否存在。

## 1. 现状摘要

| 能力 | 落点 | 现状 |
| --- | --- | --- |
| 列序与让位 | `routes/layout.tsx` · `layout.less` | 完成 |
| 分屏与分隔条 | `components/browser/` · `hooks/use-split-resize.ts` | 完成（一层分屏） |
| 面板独占 | `components/browser/browser.tsx` | 完成 |
| 标签模型与内容派发 | `stores/browser/tabs.ts` · `targets.ts` · `parts/page/` | 完成；内容页仍是占位 |
| 顶栏键与菜单 | `components/browser/browser.tsx` | 完成（含上段溢出标签列表） |
| 标签样式与关闭键 | `parts/item/` · `browser.less` | 完成 |
| 标签键盘路径与右键菜单 | `parts/tabs/` · `parts/item/` | 完成（键盘：roving tabindex · 箭头只挪焦点 · `Enter` 与 `Space` · `Delete` · `Alt` 加箭头换序；右键菜单：刷新 · 关闭三类 · 按可用性置灰，关闭类同用叉） |
| 溢出进菜单与拖动换序 | `parts/tabs/` · `hooks/use-tab-overflow.ts` · `hooks/use-tab-drag.ts` · `stores/browser/tabs.ts` | 完成（可见段与菜单上段 · `move` 与落点换算 · 让位与插入指示线 · 松手落位不闪 · 标签条不可选中；用例在 `parts/../tests/overflow.browser.ts` 与 `drag.browser.ts`） |
| 首页记录与地址错误态 | `stores/browser/tabs.ts` · `stores/browser/targets.ts` · `parts/new-tab/` | 完成（`recent` 按使用顺序记录并持久化 · 点一条复用同一页 · 空输入与不像地址的输入各有错误态，判据在 `isAddressLike`） |

## 2. 验证方式

- 浏览器用例按层拆开：`app/src/features/inbox/tests/layout.shell.browser.ts` · `layout.split.browser.ts` · `layout.exclusive.browser.ts` · `layout.motion.browser.ts`，共用件在 `layout.helpers.ts`；组件自验在 `app/src/components/browser/tests/`。
- 门禁：`pnpm lint` · `pnpm check` · `pnpm test:checkers` · `pnpm test`，以及全量 `npx playwright test`。
- 绘制层与引擎差异类问题要在真引擎里量：本机真 Safari 配合成指针与逐帧截图，或本机 WebKit 配页内逐帧采样。标签条上曾出现过两处只在 Safari 复现的问题（关闭键的显隐引起整行重栅格化 · 省略号元素自弹原生提示），都已按这条口径定位并修掉。

## 3. 风险与依赖

- 让位顺序改过 F6 的两条既有规则（顺序与导航列豁免），规范与代码当前一致。
- 分屏可能需要新 token（最小栏高 · 分隔条尺寸）；新增 token 走 `design/tokens.less` 与生成物，并与改同一份文件的其它实例错开。
- 实时服务的浏览器用例在满并发下会抖（集中在登录与注册的实时服务路径），重跑前先单跑确认；浏览器基线按「单跑为准、满并发看趋势」记。
