# 08 · 布局：标签浏览器的标题栏与标签

- 上层：[08-layout-index.md](08-layout-index.md)（三栏骨架 · 导航列 · 外壳 · 内容区与标签浏览器）
- 依据：`design/main-shell.md` §四至§六 · `design/foundations.md` F6 · `design/layout.md`（列表项与键的口径）· `architecture/06-state.md` §2.3 · `architecture/12-motion.md`
- 状态：设计确认中（2026-10-14）。设计稿在内部资料 `内部文档/requirements/主界面布局-场景/标签浏览器-标题栏与标签设计.md`；本册只列 TODO 明细与验收口径，确认后开做。
- 上游：`内部文档/requirements/主界面布局-场景/标签浏览器-细节优化.md` 五条里的第一条（标题栏与标签的详细设计，含图标与背景分档）。

本册管标签浏览器顶栏这一层：行高与键的统一口径、标题栏结构、标签样式、图标、键盘、窄栏与镜像。标签内部的页面内容、地址栏与分屏内容不在本册。

**状态口径**：`完成` 指代码在、用例在、门禁过；`部分` 指做了一半，缺什么写在备注里；`未做` 指还没动。

## 0. 待办明细

按执行顺序排，`[x]` 已做、`[~]` 做了一半、`[ ]` 未做。每完成一处就更新这一节并提交。

- [ ] 1. **三列统一口径**：导航列 · 内容列头 · 标签浏览器顶栏的行高与图标按钮归到同一套。目标：三处行高 `--row-height`（40）、键命中区 32 × 32、悬停底为正方形、图标尺寸 16、三处图标中心线同一条水平线；导航列收起后内容列头那颗展开键的中心线与导航列展开时那颗键同线。
- [ ] 2. **标题栏结构**：前段「标签（内含关闭键）→ 新建 → 下拉」，后段「最大化/恢复 → 关闭」；顶栏空白处仍是窗口拖动顶带；下边线保留。
- [ ] 3. **新建键规则**：紧跟最后一个标签；只有一个首页标签时不画新建键，只画它后面的下拉键。
- [ ] 4. **下拉菜单**：切换方位 · 左右分栏 · 上下分栏（从顶栏收进菜单）；由下拉键与「在标题栏上点右键」两处触发；Esc 与方向键沿用现有菜单口径。
- [ ] 5. **最大化 / 恢复**：本栏独占窗口与恢复，图标随状态切换；补 `i-maximize`（lucide `maximize`）与 `i-minimize-2`（lucide `minimize-2`），并把 `i-restore` 错挂的 `copy` 图形改对。
- [ ] 6. **关闭键与找回键**：顶栏关闭键常显；内容列头右端那颗「收起 / 展开这一栏」键改为本栏打开时隐藏、收起后出现（并回写 `design/README.md` 与 `design/main-shell.md` 里「切换键恒在」的规则）。
- [ ] 7. **标签样式**：圆角块，内含图标、标题（省略号）与关闭键；宽度最小 96、最大 200；默认 / 悬停 / 当前 / 焦点四态齐；关掉最后一个可关闭标签落回首页。
- [ ] 8. **背景分档**：本栏底改 `--background-content`（浅 `#FAFAFB` / 暗 `#191816`），当前标签用 `--background-surface`；清掉 `app/src/components/content/content.less` 里那两行备选注释；`design/color-card.md` 该 token 的用途补上「标签浏览器底」。
- [ ] 9. **键盘路径**：标签条 roving tabindex（只当前标签可 Tab 到）· `←` `→` 切换 · `Enter` / `Space` 激活 · `Delete` 关闭当前标签 · Tab 序为 标签条 → 新建 → 下拉 → 最大化/恢复 → 关闭。
- [ ] 10. **状态齐与四语**：只有首页的空态、溢出滚动、焦点可见；菜单项里的分栏键沿用「栏宽不足则禁用并给原因」；新增文案四语齐并检查长度不溢出。
- [ ] 11. **窄栏与镜像**：窄栏优先级 标签条 → 下拉 → 最大化/恢复 → 关闭；镜像时后段键组贴内容区那一侧；内容列头找回键是否随栏换边按确认结论落。
- [ ] 12. **回写与用例**：`design/layout.md`（标签与键的口径）· `design/README.md`（切换键显隐、图标计数）· 需求梳理表；浏览器用例覆盖第 1 至 11 条。

## 1. 现状与量测

1600 视口 · 暗色 · `node` 探针读被绘制的元素（2026-10-14）：

| 位置 | 键盒 | 图标中心 y | 行高 |
| --- | --- | --- | --- |
| 导航列头（折起键 / 收起键） | 24 × 24 | 28 | 24 |
| 内容列头（切换键） | 24 × 32 | 20 | 40 |
| 标签浏览器顶栏（新建 / 分栏 / 更多） | 24 × 24 | 28 | 57 |
| 标签按钮 | 70 × 24 | 28 | 顶栏内 |

结构现状（`app/src/components/browser/browser.tsx`）：`div.browser__bar` = `ScrollArea.browser__tabs`（标签行）+ 新建（`browser__new`）+ 分栏两键（`browser__split`，各自 `Tooltip`）+ 更多（`browser__more`，`BaseMenu`，三项：独占 `i-expand` · 换边 `i-swap` · 收掉 `i-panel-right`）。标签 = `MotionPanel as=span.browser__tab` 包 `Button.browser__tab-button`（`ghost`/`small`/`role=tab`）+ 可关闭标签的 `Button.browser__tab-close`（`i-act-close` 14）。首页标签不可关。

样式现状（`app/src/components/browser/browser.less`）：顶栏高 `--row-height`、内距 `--spacing-8`、间距 `--spacing-4`、下边线 `--border-subtle`；标签右侧内距 `--spacing-4`、圆角 `--radius-small`、入场 `browser-tab-in`、当前态 `--background-selected`；标签按钮上限 `--side-width-reading`（400，偏大）；**缺**悬停态、焦点态、溢出提示、只有首页时的规则。

## 2. 算做完的样子（关键几处）

- 第 1 条：三处行高与键盒的实测值一致（40 与 32 × 32），三处图标中心线同值；导航列收起与展开两种状态下，内容列头那颗键的中心线不变。用例按「量被绘制的元素」写，读数进 §3。
- 第 3 条：只有一个首页标签时，顶栏里不存在新建键（不是隐藏，是不渲染），下拉键仍在；新建第二个标签后，新建键出现在最后一个标签之后。
- 第 4 条：下拉键与在顶栏上点右键都能打开同一个菜单；菜单项内容一致（顺序：切换方位 · 左右分栏 · 上下分栏）。
- 第 5 条：最大化进入独占后，该键切到「恢复」图形；`Esc` 退出独占后图形切回。图标进 manifest 与生成物，`design/README.md` 的计数同步。
- 第 8 条：本栏底与内容区底的实测通道差：浅色 5 阶、暗色 6 阶（与导航列和内容区之间那 6 阶同量级）。

## 3. 验证方式

- 用例：`app/src/components/browser/tests/browser.browser.ts` 覆盖 §0 第 1 至 11 条；行高与中心线用 `boundingBox` 读数断言；显隐用「存在性」断言；右键菜单用 `click({ button: 'right' })`。
- 量测：栏宽 300 / 400 / 600 三档各一张截图；三列键盒与图标中心线读数表；四语文案同段截图或长度断言。
- 引擎：Chromium 与 WebKit 各量一遍。一帧内跳完这类问题只有 WebKit 量得出（见 `08-layout-nav.md` 附近的同类修正）。
- 门禁：`pnpm lint` · `pnpm check` · `pnpm test` · 全量 `test:browser`；推送前按关三再加 CI 等价与隔离复核。

## 4. 未决

按内部设计稿 §八的 D2 至 D12 逐条确认后补进本节；D1（跨三列统一口径）与 D11（第一轮遗留三条并入本步）已在本册第 1 条与第 9 条体现。

## 5. 图标账

- 已在：`i-plus` · `i-act-close`（`x`）· `i-down`（`chevron-down`）· `i-split`（`columns-2`）· `i-rows`（`rows-2`）· `i-swap`（`arrow-left-right`）· `i-home`（`house`）· `i-globe`（`globe`）。
- 待补：`i-maximize`（`maximize`）· `i-minimize-2`（`minimize-2`）。
- 待修：`i-restore` 现挂 `copy` 图形，应改为恢复语义（或直接改用 `i-minimize-2` 并删除 `i-restore` 的多余映射）。
