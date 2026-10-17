# 08 · 布局：未完成（跟踪）

- 本册**只列还要做的事**；已完成的事实与读数见 [08-layout-implemented.md](08-layout-implemented.md)。
- 依据：`design/main-shell.md` §四 · §五 · §七 · `design/foundations.md` F4 与 F6 · `design/layout.md` · `architecture/06-state.md` §2.3。
- 状态：进行中（2026-10-16）。`[~]` 做了一半 · `[ ]` 还没动。

## 0. 待办

### 0.1 收口与复核

- 无（第三栏收放的三条首帧时序问题已判定不做，理由见 [08-layout-implemented.md](08-layout-implemented.md) 第 11 节）。

### 0.2 待定的设计与窄栏

- [ ] **待清的技术债**
  1. 内容区与标签浏览器两处的内部资料指针注释。
  2. hook 归位：认证域的六个 `use-*.ts` 与脚手架的 `use-routing-url-sync.ts`。
  3. token 检查器不校验 `var(--x)` 是否存在。

## 1. 已完成（一句话）

标签浏览器的键盘与鼠标 · 右键菜单 · 首页的打开记录 · 地址错误态 · 五态与截图 · 后两栏换边的键位与收放，都已落地；两轮镜像复核与上一批复核的遗留按决定收口，不再逐条列出；事实、读数与用例见已实现册与各用例文件。

## 2. 怎么验

1. 浏览器用例按层拆开在 `features/inbox/tests/`（`layout.shell` · `layout.split` · `layout.exclusive` · `layout.motion` · `layout.mirror`）与 `components/browser/tests/`。
2. 门禁：`pnpm lint` · `pnpm check` · `pnpm test:checkers` · `pnpm test`，加全量 `npx playwright test`。
3. 绘制层与引擎差异要在真引擎里量：真 Safari 配合成指针与逐帧截图，或本机 WebKit 配页内逐帧采样。

## 3. 依赖与风险

1. 让位顺序改过 F6 的两条既有规则（顺序与导航列豁免），规范与代码当前一致。
2. 分屏可能需要新 token（最小栏高 · 分隔条尺寸），走 `design/tokens.less` 与生成物，并与改同一份文件的其它实例错开。
