# 08 · 布局：未完成（跟踪）

- 本册**只列还要做的事**；已完成的事实与读数见 [08-layout-implemented.md](08-layout-implemented.md)。
- 依据：`design/main-shell.md` §四 · §五 · §七 · `design/foundations.md` F4 与 F6 · `design/layout.md` · `architecture/06-state.md` §2.3。
- 状态：进行中（2026-10-16）。`[~]` 做了一半 · `[ ]` 还没动。

## 0. 待办

### 0.1 收口与复核

- [~] **镜像的两轮隔离复核**
  1. 缺用例：镜像 + 分屏 + 收次栏（行为已修，没人钉住）。
  2. 缺用例：顶栏两颗新键置灰时的 `title` 与气泡。
  3. 报告：`app/logs/2026-10-16/review-1805.md` · `review-1855.md`。

- [ ] **上一批隔离复核的六项**（另外三项已办）
  1. `components/browser/types.ts` 的 `closable` 注释与 `parts/new-tab/new-tab.tsx` 的注释仍是旧口径。
  2. `stores/browser/tabs.ts` 的 `open` 在生产代码里已无调用者；图标回退注释指向的推断不存在。
  3. `browser.less` 的 `:has(:focus-visible)` 与「不写 `:has()`」的记录不一致（标签现已可键盘到达）。
  4. 内容列头「键恒在、占位保留」的注释与实现的 `display: none` 不符。
  5. 分屏时两个面板可能同时渲染新标签页，`new-tab.tsx` 固定的 `id="browser-address"` 会重复。
  6. `navigate` 不去重，重复一次会得到两个同目标标签。

- [ ] **第三栏收放的收尾**
  1. 点击到动画起步之间约 110 毫秒的静止期（7 帧）。
  2. 起步那一帧 31 毫秒。
  3. 收起状态下刷新时，列头找回键约 320 毫秒不可见。

### 0.2 待定的设计与窄栏

- [ ] **窄栏优先级**：标签条 → 下拉 → 最大化或恢复 → 关闭（镜像那一半已落地）。
- [ ] **窄视口手动展开为浮层**
  1. 由「窄视口且已展开」派生，沿用同一个收起开关，不新增状态机。
  2. 浮层：脱离弹性流 · 宽度取存值 · 背后一层遮罩 · 不画拖拽把手。
  3. 关闭三条路：`Esc` · 点遮罩 · 选中条目。
  4. 排在桌面客户端适配之后单独一批，两档分开验收；窄视口下二级导航暂时不可达。
- [ ] **待清的技术债**
  1. 内容区与标签浏览器两处的内部资料指针注释。
  2. hook 归位：认证域的六个 `use-*.ts` 与脚手架的 `use-routing-url-sync.ts`。
  3. token 检查器不校验 `var(--x)` 是否存在。

## 1. 已完成（一句话）

标签浏览器的键盘与鼠标 · 右键菜单 · 首页的打开记录 · 地址错误态 · 五态与截图 · 后两栏换边的键位与收放，都已落地，事实、读数与用例见已实现册与各用例文件。

## 2. 怎么验

1. 浏览器用例按层拆开在 `features/inbox/tests/`（`layout.shell` · `layout.split` · `layout.exclusive` · `layout.motion` · `layout.mirror`）与 `components/browser/tests/`。
2. 门禁：`pnpm lint` · `pnpm check` · `pnpm test:checkers` · `pnpm test`，加全量 `npx playwright test`。
3. 绘制层与引擎差异要在真引擎里量：真 Safari 配合成指针与逐帧截图，或本机 WebKit 配页内逐帧采样。

## 3. 依赖与风险

1. 让位顺序改过 F6 的两条既有规则（顺序与导航列豁免），规范与代码当前一致。
2. 分屏可能需要新 token（最小栏高 · 分隔条尺寸），走 `design/tokens.less` 与生成物，并与改同一份文件的其它实例错开。
