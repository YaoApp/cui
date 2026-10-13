# 08 · 布局：内容区与标签浏览器

- 上层：[08-layout-index.md](08-layout-index.md)（三栏骨架 · 导航列 · 外壳）
- 依据：`design/main-shell.md` §四（内容形态）· §五（第三栏：浏览器式的侧栏）· §六（入口与呈现方式）· §七（独占与运行）· `design/foundations.md` F6（三栏竖分割与让位顺序）· `architecture/06-state.md` §2.3（公共状态放哪）· `architecture/12-motion.md`（动效的引入条件）
- 状态：进行中（2026-10-13）。分两轮：第一轮做列与窗口这一层的交互（互换 · 让位 · 分屏 · 独占 · 动效），第二轮做标签浏览器的其余细节（键盘 · 首页记录 · 状态齐）。

三栏骨架与两处收起已经落地（见 [08-layout-base.md](08-layout-base.md)、[08-layout-nav.md](08-layout-nav.md)），本册不重做骨架。本册管两件事：内容区与标签浏览器这两栏在窗口左右互换，以及标签浏览器自身补齐到设计里的样子。内容区不改形态，只把与相邻一栏有关的呈现（描边 · 列头留白）跟着位置走。

## 1. 现有的与缺的

| 能力 | 落点 | 现状 |
| --- | --- | --- |
| 第三栏在哪一侧 | `stores/layout/columns.ts` 的 `browserSide` · `components/browser/browser.tsx` 的 `data-side` · `browser.less` 的 `[data-side='left']` | 状态与样式在，**列序是错的**：`routes/layout.less:13` 用 `flex-direction: row-reverse`，互换时把导航列一起镜像到右边 |
| 换边的入口 | 标签条右端「换到另一侧」键（`shell.browser.action.move`） | 在，四语文案齐；按本册要收进「…」菜单 |
| 收掉与展开 | `browserCollapsed` · 标签条右端的「收掉这一栏」键 | 在，只隐藏浏览器一栏 |
| 标签 | 标签条（`role='tablist'`）· 关闭 · 新建 · 溢出横向滚动 | 在；「只有首页时不画新建键」未做，键盘路径未做 |
| 首页 | `components/browser/parts/home/`：地址表单与「这一侧打开过的东西」 | 在；列表内容现在是当前标签，不是使用顺序记录 |
| 外部地址页 | `components/browser/parts/web/`：地址与占位说明 | 占位，不抓取内容 |
| 分屏 | 无 | 未做 |
| 面板独占窗口 | 无 | 未做 |
| 动效 | 只有导航列折叠用了 Motion | 互换 · 收起展开 · 分栏 · 独占 · 标签开关都未有动效 |
| 侧栏宽度可拖 | F6 规定可拖到上限，token `--side-resize-handle` 6px 已在 | 未实现，本册不做，另行排期 |
| 内容区 | `components/content/`：单块加列头 | 本册不改形态 |

## 2. 先写回设计

下面这几条是这一轮新定的设计，代码之前先落进规范，之后照规范做。规范里写全，计划里只记落点。

| 要写的规则 | 落点 |
| --- | --- |
| 内容区与标签浏览器两栏互换，导航列位置与状态不变；互换后两侧各自保留原宽，分界线移位 | `design/main-shell.md` §三 与 §五 |
| 让位顺序改为：内容区先压到最小，再压标签浏览器，最后压导航列。这一条同时改了 F6 的两处：原「侧栏先缩、再整条消失」的顺序，与原「导航栏不参与宽度让步」的豁免 | `design/foundations.md` F6 · `design/main-shell.md` §三 |
| 窗口的最窄值与既有自动收起的关系：`--nav-auto-collapse` 1024 与 `--bp-nav-drawer` 768 两档在新的让位顺序里各起什么作用，写清先后，避免自动收起绕过顺序 | `design/foundations.md` F6 · `design/main-shell.md` §三 |
| 标签浏览器不再自动整条消失，最窄收在 `--side-min`；此后窗口不再变窄 | `design/foundations.md` F6 |
| 标签浏览器的一层分屏：左右与上下两种方向、面板绑标签、分隔条可拖、栏宽不足时左右分栏禁用 | `design/main-shell.md` §五 |
| 面板独占窗口：聚焦面板占满整扇窗口，与系统的窗口最大化分开；独占时 macOS 的交通灯留白由面板头部承担 | `design/main-shell.md` §五 与 §七 |
| 标签条右端最多两颗键加「…」菜单；只有首页时不画新建键；新建落在聚焦面板的首页 | `design/main-shell.md` §五 |
| 这几处动效都用 Motion，时长与缓动取现有 token 与动效强度档（`--duration-*-quiet` / `-rich`），不用 `display: none` 切换，尊重 `prefers-reduced-motion` | `architecture/12-motion.md` · `design/foundations.md` 动效一节 |

## 3. 第一轮：列与窗口这一层的交互

### 3.1 施工清单

| # | 事 | 落点 | 算做完的样子 |
| --- | --- | --- | --- |
| 1 | 列序改成显式顺序：`导航列 · 内容区 · 标签浏览器` 与 `导航列 · 标签浏览器 · 内容区` | `routes/layout.less`（去掉 `row-reverse`）· `routes/layout.tsx` | 互换后导航列的 `x` 与宽与互换前完全一致；三栏总宽等于窗口宽；无横向滚动条 |
| 2 | 分界线的侧别 | `components/browser/browser.less` 的 `[data-side]` | 只有一条分界线，落在内容区与标签浏览器之间；互换后换到另一侧，颜色仍取 `--border-subtle`；浏览器贴窗口左缘时左缘无分界线 |
| 3 | 交通灯留白的归属 | `components/content/parts/head/head.tsx` · `nav.less` | macOS 上留白仍由导航列列头承担，内容列头的 `padding-inline-start` 在互换前后相同 |
| 4 | 让位顺序 | `routes/layout.less` · `components/content/content.less` · `components/browser/browser.less` | 压窄窗口依次看到内容区到 `--center-min`、标签浏览器到 `--side-min`、导航列收起；标签浏览器在左时同样顺序；与 `--nav-auto-collapse` 的先后按 §2 写好的规范执行；窗口最窄值 = 三栏最小之和加把手 |
| 5 | 互换的入口 | `components/browser/browser.tsx` | 「换到另一侧」收进「…」菜单，四语文案齐，动作后焦点仍在原键上 |
| 6 | 「…」菜单的实现 | 优先复用 `components/nav/parts/menu/` 的做法；做成公共件则落 `components/base/menu/` | 键盘可达（方向键 · `Esc` 交回焦点），与标签条右端两颗键同一行不换行 |
| 7 | 分屏的结构 | `components/browser/` 新增面板容器（`parts/pane/`） | 一层分屏，左右与上下两种；两个面板各绑一个标签，同一标签不重复占两栏；两面板各自滚动；面板头部高取 `--row-height` |
| 8 | 分屏的键与状态 | `components/browser/browser.tsx` · `browser.less` | 标签条右端「左右分栏」「上下分栏」「…」；同键再按回单面板，异键直接改朝向；栏宽不足时左右分栏禁用并给气泡，上下分栏按栏高判 |
| 9 | 分隔条 | 新增分隔条组件（照 `nav/hooks/use-nav-resize.ts` 的做法） | 拖动跟手、松手把比例写入本机、双击回平分；不参与布局；宽度取 token 而非字面值 |
| 10 | 面板独占窗口 | `components/browser/` | 「…」里的独占项让聚焦面板占满整扇窗口，客户端自身的导航与内容列头都不出现；macOS 上交通灯留白由面板头部承担；退出回原侧原宽，分栏方向与比例不变 |
| 11 | 标签的规则 | `components/browser/browser.tsx` | 第一个标签固定是首页且不可关；只有首页时不画新建键；新建落在聚焦面板并停在首页；关掉面板最后一页落回首页 |
| 12 | 动效 | 各栏与面板的容器 | 互换用布局动画；收起展开、分栏合栏、独占还原用布局动画；拖动跟手无过渡、落位与双击复位有过渡；标签开关淡入淡出加位移；时长与缓动取 token 与动效强度档；`prefers-reduced-motion` 下全部即时 |
| 13 | 状态与偏好 | `stores/layout/columns.ts`（侧别 · 分屏方向 · 分屏比例 · 收掉）· 新增 `stores/browser/` 一族（标签与面板的绑定） | 侧别与分屏记本机、刷新保持、清空回到默认；标签与面板的绑定是公共事实，按 `architecture/06-state.md` §2.3 落 `stores/browser/`，不塞进 layout 一族 |
| 14 | 组件文档与计划回写 | `components/browser/README.zh-CN.md` · 本册 · [08-layout-index.md](08-layout-index.md) | 组件的状态表补分屏 · 独占 · 禁用态三行；本册与索引的状态跟着更新 |
| 15 | 用例 | `features/inbox/tests/layout.browser.ts` · `components/browser/` 的 `*.test.tsx` 与 `tests/*.browser.ts` · `stores/layout/` 与新增 store 的单元用例 | 互换与让位各一条浏览器用例；分屏 · 独占 · 禁用态 · 「…」菜单各一条；侧别 · 分屏 · 标签绑定的单元用例；新增 `.less` 由同目录 `.tsx` 引入，浏览器用例落在 `tests/` 内 |

### 3.2 算做完的样子

- 三栏几何：互换前 · 互换后 · 浏览器收掉三种状态下各留一份三栏 `x` 与宽的读数，导航列的前后读数一致。
- 让位：从 1280 压到最小的过程中每一步留读数，能看到 §3.1 第 4 条的三段，以及与自动收起那一档的先后。
- 分屏：单面板 · 左右 · 上下 · 独占四种几何各留一份读数与浅暗两张截图。
- 动效：五个动作各录一次，核对时长与缓动取的是 token 与强度档；打开减少动态效果后再录一次，为即时。
- 四语与状态：新增文案四语齐；默认 · 悬停 · 焦点 · 禁用 · 独占中 · 空都有据可查。
- 门禁：`pnpm lint` · `pnpm check` · `pnpm test` · `pnpm build` 全过；本轮专项浏览器用例全过。

### 3.3 提交拆分

按处拆，一处一条：① 列序与分界线；② 让位顺序；③ 分屏结构与分屏键；④ 分隔条；⑤ 「…」菜单；⑥ 面板独占；⑦ 标签规则；⑧ 动效；⑨ 状态与偏好；⑩ 组件文档与计划回写。前九条各自跑该处的 Less 编译、`pnpm lint` 与相关用例后立刻提交。

## 4. 第二轮：标签浏览器的其余细节

| # | 事 | 落点 | 算做完的样子 |
| --- | --- | --- | --- |
| 1 | 标签的键盘路径 | `components/browser/browser.tsx` | 方向键在标签间移动、`Home`/`End` 到首末、`Delete` 关闭、`Enter` 激活；关闭后焦点落相邻标签；有浏览器用例 |
| 2 | 首页的「打开过的东西」 | `components/browser/parts/home/` | 按使用顺序记录打开过的页，同一份内容复用同一页；空态四语齐；有单元用例与一条浏览器用例 |
| 3 | 地址的错误态 | `parts/home/` · `components/base/input` | 空输入与非法地址有错误态，四语齐 |
| 4 | 溢出与长内容 | `browser.less` | 标签溢出横向滚动时新建键与「…」保持可见；首页与外部地址页各自滚动，不带动标签条 |
| 5 | 状态齐与截图 | 各控件 | 默认 · 悬停 · 焦点 · 禁用 · 空逐条落实，浅暗各一张截图 |
| 6 | 用例与回写 | 同上一轮 | 第二轮专项用例全过；设计与计划的结论回写到 §2 表里对应分册 |

## 5. 不做

- 内容区的单区与两栏两种形态（`design/main-shell.md` §四 的另外两种）。
- 外部地址页的真实抓取与渲染，维持占位。
- 标签浏览器宽度可调：F6 已规定可拖到上限（`--side-resize-handle` 6px 已在 token 里），但未实现，本册只做分屏两侧的比例，宽度可拖另行排期。
- 分屏超过一层（面板里再分）。
- 标签历史跨会话同步。

## 6. 风险与依赖

- 让位顺序改了 F6 的两条既有规则（顺序与导航列豁免），属于设计变更：先改规范再改代码，避免代码与规范各说一套。
- 窗口最窄值会因为「标签浏览器不再自动消失」而抬高，与 `--nav-auto-collapse` 1024 那一档的先后必须先定，否则窄窗口下的表现两套规则打架。
- 分屏可能需要新 token（最小栏高 · 分隔条尺寸）；新增 token 走 `design/tokens.less` 与生成物，且按 `architecture/AGENTS.md` 的串行点，与改同一份文件的其它实例错开。
- 动效要在布局阶段搭好结构：三栏与两个面板必须是稳定、可测量的盒子，互换只改顺序与位置、不重建节点，否则 Motion 的布局动画量不到前后状态。
- Windows 客户端的窗口起不来（进程活、窗口句柄 0），屏幕验证目前只能在 macOS 与 Web 上做；这一条与本册无关，但会挡住「两端各走一遍」的最后一拍。
