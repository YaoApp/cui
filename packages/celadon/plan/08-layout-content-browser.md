# 08 · 布局：未完成（跟踪，已归档）

- 本册**只列还要做的事**；已完成的事实与读数见 [08-layout-implemented.md](08-layout-implemented.md)。
- 依据：`design/main-shell.md` §四 · §五 · §七 · `design/foundations.md` F4 与 F6 · `design/layout.md` · `architecture/06-state.md` §2.3。
- 状态：**已归档**（2026-10-17）。收口时无未完成项；本册不再更新，后续事项按新编号另立计划。

## 0. 待办

- 无。

## 1. 已完成（一句话）

标签浏览器的键盘与鼠标 · 右键菜单 · 首页的打开记录 · 地址错误态 · 五态与截图 · 后两栏换边的键位与收放 · 栏宽按窗口可用宽度收（与栏内定尺壳一致），都已落地；镜像两轮复核与上一批复核的遗留按决定收口；技术债三条已清（内容区与标签浏览器的内部资料指针注释 · 认证域六个 hook 归位到 `hooks/` · 新增自定义属性检查器，顺带修掉 `--shadow-medium` 这个不存在的 token）；第三栏收放的首帧时序、窄栏逐颗收键按人工验收判定不做，窄视口浮层标为以后实现，三者都记在已实现册第 11、12 节。

## 2. 怎么验

1. 浏览器用例按层拆开在 `features/inbox/tests/`（`layout.shell` · `layout.split` · `layout.exclusive` · `layout.motion` · `layout.mirror`）与 `components/browser/tests/`。
2. 门禁：`pnpm lint` · `pnpm check` · `pnpm test:checkers` · `pnpm test`，加全量 `npx playwright test`。
3. 绘制层与引擎差异要在真引擎里量：真 Safari 配合成指针与逐帧截图，或本机 WebKit 配页内逐帧采样；Windows 客户端用 `.yao/skills/celadon-client-verify` 的窗口级工具取景与点击。

## 3. 依赖与风险

1. 让位顺序改过 F6 的两条既有规则（顺序与导航列豁免），规范与代码当前一致。
2. 分屏可能需要新 token（最小栏高 · 分隔条尺寸），走 `design/tokens.less` 与生成物，并与改同一份文件的其它实例错开。
3. 客户端产物：`tauri.conf.json` 的 `frontendDist` 指向 `cui/packages/celadon/dist-client`，产物必须解到那里；编完由 `windows-build-and-run.ps1` 核对二进制里嵌的 CSS 名。
