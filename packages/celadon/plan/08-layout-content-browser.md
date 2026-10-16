# 08 · 布局：未完成（跟踪）

- 已实现的部分见 [08-layout-implemented.md](08-layout-implemented.md)。
- 依据：`design/main-shell.md` §四 · §五 · §七 · `design/foundations.md` F4 与 F6 · `design/layout.md` · `architecture/06-state.md` §2.3。
- 状态：进行中（2026-10-16）。本册是 08 系列唯一的跟踪册。
- 口径：`[x]` 代码在 · 用例在 · 门禁过；`[~]` 做了一半；`[ ]` 未动。勾选前先跑相关用例，并在浏览器里按设计量过。

## 0. 待办

### 0.1 标签浏览器内部

- [x] **键盘与鼠标**
  1. 标签条走 roving tabindex：整条只有一个落点，落点跟当前页。
  2. 左右箭头只挪焦点，不换页；`Enter` 与 `Space` 激活；`Delete` 关当前页；`Alt` 加左右箭头在整表挪一位，焦点跟标签走。
  3. Tab 序：标签条 → 新建 → 下拉 → 最大化或恢复 → 关闭。
  4. 指针位移不超过 4 像素算点击，超过算拖动。
  5. 用例 `app/src/components/browser/tests/keyboard.browser.ts`（4 条）。

- [x] **标签右键菜单**
  1. 四项：刷新 · 关闭这个标签 · 关闭其他标签 · 关闭全部标签（第三项前有分隔线）。
  2. 置灰规则：没有别的可关页时「关闭其他」，没有可关页时「关闭全部」，首页那一页的「关闭这个标签」。
  3. 菜单按指针位置开，`Esc` 与点外面收掉。
  4. 关掉当前标签后的激活规则：右邻优先，没有右邻取左邻，都没有则落回首页。
  5. 用例 `tests/tab-menu.browser.ts`（3 条）· `app/src/stores/browser/tabs.test.ts`（2 条）。

- [x] **首页的「打开过的东西」**
  1. store 记 `recent`：打开或在页里换内容时记一条，首页与空页不记。
  2. 最近的在前；同一目标只留一条并提到最前；上限 8 条；关掉页不抹记录。
  3. 随 `cui.browser` 持久化，版本 3，旧数据迁移补空表。
  4. 首页下半部分列出，点一条走 `open` 复用已有页并提到最前。
  5. 用例 `app/src/stores/browser/tabs.test.ts`（1 条）· `tests/recent-address.browser.ts`（1 条）。

- [x] **地址的错误态**
  1. 判据在 `stores/browser/targets.ts` 的 `isAddressLike`：去空格后为空算空输入；已知名字 · `/` 开头的内部路由 · 带点的域名 · `localhost` 算地址；带空格 · 没有点 · 只有协议头的不算。
  2. 空输入与不像地址各一条错误文案，走基础 `Input` 的 `error`，改动输入即清错误。
  3. 四语键 `shell.browser.address.empty` 与 `shell.browser.address.invalid`。
  4. 用例 `tests/recent-address.browser.ts`（1 条）。

- [x] **状态齐与截图**
  1. 悬停：标签块与菜单项。
  2. 焦点：标签焦点环。
  3. 禁用：菜单项置灰（`aria-disabled` 与文字色都有用例）；标签块本身没有禁用态。
  4. 空：首页「还没有打开过东西」。
  5. 浅暗两套读数与截图目录记在已实现册的关键读数里。

- [x] **后两栏换边（镜像）的键位与收放**
  1. 角色：中间那一栏是主栏，离导航最远的那一栏是次栏。
  2. 键位：主栏头部两颗找回键（左端导航 · 右端次栏），次栏头部一颗收放键；两种列序共用同一批槽位。
  3. 镜像态主栏是标签浏览器：导航找回键落在它顶栏前段、标签条之前，标签条整体右移那一格。
  4. 收掉次栏：宽度由主栏驱动（`calc(100% - --nav-min)`，导航区已收起时取 `100%`），内容区的下限同走一条过渡；不能用 `flex` 切换表达收放。
  5. 镜像状态随 `cui.layout` 记本机；交通灯留白随窗口最左那一栏走。
  6. 用例 `app/src/features/inbox/tests/layout.mirror.browser.ts`（7 条）。

### 0.2 收口与复核

- [x] **回写与用例（收口项）**
  1. 设计侧已写：侧栏切换键的显隐 · 第三栏一节 · 两个底档用途 · F4 的两条 WebKit 规则 · 标签条与两处菜单的口径（`design/layout.md` §5.1 · `design/main-shell.md` §五）· 入场的做法（`architecture/12-motion.md` 改为 CSS 过渡）· 首页的打开记录与地址判据 · 主栏与次栏的角色口径与键盘顺序。
  2. 事实与读数写进已实现册第 6、8 节。

- [~] **镜像的两轮隔离复核**
  1. 第一轮九项已全部处置：`data-browser` 与 `data-browser-side` 拆开 · 两个方向的动画 · 独占时主栏铺满 · 导航最小宽时的 8 像素残边 · 收掉的内容区带 `inert` · 置灰键的气泡与无障碍名 · 交通灯留白归窗口最左那一栏 · 用例鉴别力 · 内部需求口径。
  2. 第二轮查出并已修三处：镜像 + 分屏 + 收次栏时主栏外壳停在定宽档 · 展开首帧被最大宽上限夹住 · 交通灯置零被内联样式压过。
  3. 缺两处用例：镜像 + 分屏 + 收次栏这一组；顶栏两颗新键置灰时的 `title` 与气泡。
  4. 报告：`app/logs/2026-10-16/review-1805.md` · `review-1855.md`。

- [ ] **上一批隔离复核的九项**
  1. 已办三项：组件 README 与各处用例路径 · `browser.tsx` 里引用计划条目号与不存在结构的注释 · `browser.less` 的 `.browser__move` 死选择器。
  2. `components/browser/types.ts` 的 `closable` 注释与 `parts/new-tab/new-tab.tsx` 的注释仍是旧口径。
  3. `stores/browser/tabs.ts` 的 `open` 在生产代码里已无调用者；图标回退的注释指向的模块里没有这条推断。
  4. `browser.less` 里 `:has(:focus-visible)` 与「不写 `:has()`」的记录不一致（标签现已可键盘到达，这条会走到）。
  5. 内容列头关于浏览器槽位「键恒在、占位保留」的注释与实现的 `display: none` 不符。
  6. 分屏时两个面板可能同时渲染新标签页，`new-tab.tsx` 固定的 `id="browser-address"` 会出现同 id。
  7. `navigate` 不去重，重复一次会得到两个同目标标签，与「不做并列的第二页」相抵。

- [ ] **第三栏收放的收尾**
  1. 点击到动画起步之间约 110 毫秒的静止期（7 帧）。
  2. 起步那一帧 31 毫秒。前两项同源，都是布局翻面那一下的重排与首绘。
  3. 收起状态下刷新时，列头找回键约 320 毫秒不可见（带延迟的关键帧在首帧也会跑一遍）。

### 0.3 待定的设计与窄栏

- [ ] **窄栏与镜像**：窄栏优先级 标签条 → 下拉 → 最大化或恢复 → 关闭；镜像那一半已定并落地（见 0.1）。
- [ ] **窄视口手动展开为浮层**（F6 的「导航栏不参与宽度让步，窄视口手动展开覆盖中栏」）
  1. 不新增状态机：这一档由「窄视口且已展开」派生，沿用同一个收起开关。
  2. 呈现在展开态之外多一层浮层外壳：脱离弹性流 · 宽度取存值 · 背后一层遮罩 · 浮层内不画拖拽把手。
  3. 关闭三条路：`Esc` · 点遮罩 · 选中条目。
  4. 安排在桌面客户端适配之后单独一批：客户端收起为零宽，浮层语义与 Web 不同，两档分开验收；窄视口下二级导航暂时不可达。
- [ ] **待清的技术债**
  1. 内容区与标签浏览器两处的内部资料指针注释。
  2. hook 归位：认证域的六个 `use-*.ts` 与脚手架的 `use-routing-url-sync.ts` 收进各自 `hooks/`。
  3. token 检查器不校验 `var(--x)` 是否存在。

## 1. 现状摘要

| 能力 | 落点 | 现状 |
| --- | --- | --- |
| 列序与让位 | `routes/layout.tsx` · `layout.less` | 完成 |
| 分屏与分隔条 | `components/browser/` · `hooks/use-split-resize.ts` | 完成（一层分屏） |
| 面板独占 | `components/browser/browser.tsx` | 完成 |
| 标签模型与内容派发 | `stores/browser/tabs.ts` · `targets.ts` · `parts/page/` | 完成；内容页仍是占位 |
| 顶栏键与菜单 | `components/browser/browser.tsx` | 完成（含上段溢出标签列表） |
| 标签样式与关闭键 | `parts/item/` · `browser.less` | 完成 |
| 标签键盘路径与右键菜单 | `parts/tabs/` · `parts/item/` | 完成 |
| 溢出进菜单与拖动换序 | `parts/tabs/` · `hooks/use-tab-overflow.ts` · `hooks/use-tab-drag.ts` · `stores/browser/tabs.ts` | 完成 |
| 首页记录与地址错误态 | `stores/browser/tabs.ts` · `targets.ts` · `parts/new-tab/` | 完成 |
| 后两栏换边的键位与收放 | `routes/layout.tsx` · `layout.less` · `parts/head/` · `components/browser/` | 完成（镜像态；见 0.1 末条） |

## 2. 验证方式

1. 浏览器用例按层拆开：`features/inbox/tests/` 的 `layout.shell` · `layout.split` · `layout.exclusive` · `layout.motion` · `layout.mirror`，共用件 `layout.helpers.ts`；组件自验在 `components/browser/tests/`。
2. 门禁：`pnpm lint` · `pnpm check` · `pnpm test:checkers` · `pnpm test`，以及全量 `npx playwright test`。
3. 绘制层与引擎差异类问题要在真引擎里量：真 Safari 配合成指针与逐帧截图，或本机 WebKit 配页内逐帧采样。

## 3. 风险与依赖

1. 让位顺序改过 F6 的两条既有规则（顺序与导航列豁免），规范与代码当前一致。
2. 分屏可能需要新 token（最小栏高 · 分隔条尺寸）；新增 token 走 `design/tokens.less` 与生成物，并与改同一份文件的其它实例错开。
