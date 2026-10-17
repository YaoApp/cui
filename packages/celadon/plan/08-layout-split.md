# 08 · 标签浏览器分栏：实施计划

## 0. Todo

- [ ] **1. 抽公共的分组动作**：把现有标签 store 的纯逻辑抽成与实例无关的一组函数（打开、导航、空白页、关闭、关闭其它、关闭全部、激活、排序、去重、记忆「打开过」、key 分配），主栏 store 只做薄封装，对外接口一字不改（含选择器引用的稳定性）；补单元用例。**现状：第二组先按同一套规则独立实现，两组动作还没有合并到一处，这一步待做。**
- [x] **2. 抽出标签条组件**：顶栏内联的标签条已经是 `parts/tabs` 组件（标签项、新开、溢出、右键菜单、拖动排序与键盘都在里面），第二栏直接复用；兄弟选择器与 `:has()` 的约束不变。
- [x] **3. 新增第二组标签 store**：`stores/browser/secondary.ts`，独立标签、活动页与「打开过」，持久化键 `cui.browser.secondary`；`seed()` 在开分栏时放首页；单元用例 6 条。
- [x] **4. 画第二栏**：新栏用 `order` 排在左（左右分栏）或在底（上下分栏），DOM 次序固定为「主栏 · 分隔条 · 第二栏」；第二栏自带标签条（`parts/secondary-pane`），左右分栏时分隔条也 `order: -1`，否则会压住本栏的分界线。
- [x] **5. 焦点与落点**：指针在本栏按下切焦点；第二栏内的地址入口走该组 `navigate`（不新开页）；关空与合并之后焦点回到主栏。
- [x] **6. 关空即关分栏**：关闭第二栏最后一页时 `setBrowserSplit('none')`，主栏不动；刷新恢复时若分栏开着而第二组为空，补首页。
- [x] **7. 主动关分栏时合并**：第二栏的标签经主栏打开入口并入并去重，再把第二组清空。
- [ ] **8. 分栏键按方向判定**：左右看栏宽（≥600），上下看栏高（新增面板最小高度 token）；「窗口宽不足以并排」只挡左右。**现状：两颗键仍共用宽度判定，上下分栏也受宽度限制，待做。**
- [ ] **9. 无障碍**：两组标签条各自 `tablist`，`aria-controls`、标签 id、新建键 id 按组生成；操作可读名称带「新栏」限定。**现状：新建键已用 `useId` 不重复，`tablist`/`aria-controls` 的按组生成与「新栏」限定待做。**
- [ ] **10. 用例与文档**：既有用例已改写（第二面板那条、焦点那条、换边那条），新增三条（关空自动关分栏、主动合并去重、刷新恢复两组）；已实现册的分栏一节与置灰文案待更新。

## 1. 口径（已定，实现依据）

1. 栏宽不加宽：低于 600 不允许左右分栏，两栏从存值宽度里平分。
2. 两组独立：新栏与主栏各有一组标签，主栏的 store 与用例不动，持久化只新增字段。
3. 左右分栏新栏在左、主栏在右；上下分栏新栏在下、主栏在上。
4. 新栏的标签关到一个不剩时，分栏自动关闭，回到单面板，不出现空面板。
5. 两种分栏都做完整标签条，新栏的标签条画在它自己的区域内、紧贴分隔条的一侧。
6. 分栏键不换位置，仍在顶栏右端。
7. 跨栏拖动不做，标签只在本栏内排序。

## 2. 具体实现

### 2.1 状态层（步骤 1、3）

现状：`app/src/stores/browser/tabs.ts` 一个 zustand store 承担全部标签逻辑，动作与状态写在一起。

改法：

- 新增 `stores/browser/tab-group.ts`（新建文件，见第 3 节目录结构），放与实例无关的纯函数。**函数清单按现有 store 的动作全集给全，不止六个**：

  | 函数 | 作用 |
  | --- | --- |
  | `openIn(group, entry)` | 追加并激活一页；key 由传入的分配器给 |
  | `navigateIn(group, key, target, meta)` | 把某一页换成新目标（同一页同一个窗口里打开东西），同目标已在别页则关掉本页并激活那一页 |
  | `openBlankIn(group, key)` | 在某一页上放空白页 |
  | `closeIn(group, key)` | 关闭一页；关空返回空组 |
  | `closeOthersIn(group, key)` | 关掉除它以外的全部 |
  | `closeAllIn(group)` | 全部关掉，返回空组 |
  | `activateIn(group, key)` | 只改活动页 |
  | `moveIn(group, from, to)` | 组内排序，「移除后再插入」的索引口径写进注释与用例 |
  | `homeIn(group)` | 组为空时给出首页组，非空原样返回 |
  | `rememberIn(recent, target)` | 「打开过」列表，上限 8 |
  | `nextKey(group, prefix)` | key 分配器；两组各自分配，合并时不复用第二组的 key |

- `tabs.ts` 改成薄封装：状态、动作名、`cui.browser` 持久化与 `migrate` 全部保留，动作内部改调 `tab-group.ts`。对外导出的 `useTabsStore`、选择器与动作签名不变（选择器返回的引用稳定性也要保持，避免拖动与溢出计算期间重渲染）。
- 新增 `stores/browser/secondary.ts`：结构照 `tabs.ts`，只保留 `tabs` · `activeKey` · `recent`，持久化键 `cui.browser.secondary`，版本 1。它有**自己的**「打开过」与首页规则，不读主栏的。
- 现有的旧分屏字段（`secondaryKey`、`secondary`、`secondaryLabel`、`.browser__pane-head`）在该步骤一并删除，避免两套模型并存。

### 2.2 标签条组件（步骤 2）

现状：标签条连同溢出计算、右键菜单写在 `app/src/components/browser/browser.tsx` 里，只服务于顶栏。

改法：新增 `components/browser/parts/tab-strip/`（新建目录，见第 3 节），组件接这些属性：

| 属性 | 说明 |
| --- | --- |
| `group` | `primary` 或 `secondary`，落到 `data-group`，供用例与读屏限定定位，避免同名标签与第二个 `⌄` 命中多个 |
| `tabs` · `activeKey` | 本组标签与活动页 |
| `onActivate` · `onNavigate` · `onClose` · `onNew` · `onMove` | 本组的动作 |
| `onRefresh` · `onCloseOthers` · `onCloseAll` · `closableCount` | 右键菜单的条目与可关计数 |
| `overflowMenu` | 溢出菜单，沿用现有实现，按组各自计算 |
| `idPrefix` | 生成 `tablist`、每个标签、新建键的 id，两组不重复 |

顶栏改用它，主栏行为不变；`browser.tsx` 里原来那段内联结构整块删除，样式按原样搬到组件的 `.less`。

### 2.3 第二栏（步骤 4）

- `components/browser/parts/secondary-pane/`（新建目录，见第 3 节）：组件接 `tabs` · `activeKey` 与本组动作，内部是「标签条 + 页面容器」，页面仍用现有 `ScrollArea` 与 `TabPage` 渲染。
- **DOM 次序固定为「主栏 · 分隔条 · 第二栏」**，视觉次序由 `order` 给：左右分栏把第二栏 `order: -1`（在左），上下分栏第二栏排最后（在底）。切方向只改 `order` 与排布属性，两栏不重挂，滚动位置、地址草稿与拖动中的手势都不丢。
- 比例语义统一为**第二栏占比**：`columns.ts` 的注释与 `use-split-resize` 的说明同步改写；左右分栏时指针向右拖动是缩小第二栏，拖动方向按方向取反（钩子加一个方向参数），上下分栏保持向下增大。已存的旧比例在左右与上下之间对调一次，迁移时按「旧值即第一面板占比」换算成新值。
- 样式加在 `app/src/components/browser/browser.less`：第二栏的头部容器（标签条）、与分隔条相接一侧的分隔线、`columns` 与 `rows` 两套排布。栏宽不加宽，`[data-split] .browser__shell` 的 `var(--side-width-tool)` 兜底删掉，删除前确认该 token 没有别的使用者。

### 2.4 装配层（步骤 5、6、7）

- `app/src/routes/layout.tsx`：第二栏的页由第二组 store 的活动页渲染，`renderTab` 复用；第二栏内的导航走该组的 `navigate`，不新开页。
- 焦点栏决定「新建标签与外链落在哪一组」：焦点在第二栏时调第二组的 `open`，否则调主栏的。焦点栏在第二栏关空、合并、切换方向、收起与换边之后重置为 0。
- 关空即关分栏：第二组 `close` 之后若 `tabs` 为空，调用 `setBrowserSplit('none')`，不向主栏搬运标签，也不改主栏活动页。刷新恢复时若分栏开着而第二组为空，补首页，避免空面板。
- 主动关分栏：点分栏键（`onSplit('none')`）时，把第二组的 `tabs` 依序经**主栏的打开入口**并入（key 冲突由主栏分配器重建），第二组活动页成为主栏活动页，然后清空第二组。

### 2.5 判定（步骤 8）

- `browser.tsx` 的 `tooNarrowToSplit` 拆成两条：`tooNarrowForColumns`（第二栏可用宽度 < 600 + 8 像素分隔条，量的是栏**实际**宽度而不是存值，镜像态收掉内容区后以实际宽度为准）与 `tooNarrowForRows`（栏高 < 两块面板最小高度之和）。面板最小高度新增 token，从 token 读，不写字面值；栏高由第二栏容器的实际高度取。
- 装配层现有的 `splitBlocked`（视口宽 ≤ 1287）只挡左右，不再与方向无关地挡上下。
- 两颗分栏键各按自己的判定置灰；`disabled` 的语义按「当前方向不可用」而不是「未分栏时不可用」，已处在方向 A 时另一方向不可用要能看见原因。置灰原因区分「窗口太窄」与「窗口太矮」，四语齐；`shell.browser.split.blocked` 现有文案接上。

### 2.6 无障碍（步骤 9）

- `tab-strip.tsx` 的 `idPrefix` 与 `group` 用于 `tablist` 的 `id`、每个标签的 `id` 与 `aria-controls`、新建键的 `id`；第二栏那一份加可读名称限定（「新栏」），四语齐。
- 现有 `new-tab.tsx` 已用 `useId`，`aria-controls` 目前不存在，这两处按上表补齐或改写。

### 2.7 用例（步骤 10）

先改写会受影响的既有用例，再补新的：

| 层 | 文件 | 覆盖 |
| --- | --- | --- |
| 改写 | `app/src/features/inbox/tests/layout.split.browser.ts:47-48` · `:301-303` · `:306-337` | 阈值文案、第二面板内容、点标签切焦点这三段按两组模型改写 |
| 改写 | `app/src/features/inbox/tests/layout.exclusive.browser.ts:33-39` | 独占与分栏叠加的分支按新判定改 |
| 单元 | `stores/browser/tab-group.test.ts`（新建） | 全量动作：重复打开去重、导航换目标、关空、关闭其它与全部、组内排序越界、key 分配、首页复用、记忆上限 |
| 单元 | `stores/browser/secondary.test.ts`（新建） | 第二组的动作、持久化键、独立「打开过」、开分栏即放入首页 |
| 浏览器 | `app/src/features/inbox/tests/layout.split.browser.ts`（续） | 补：两栏各自关闭与新建 · 关空自动关分栏 · 主动合并去重 · 刷新恢复两组（含空第二栏补首页）· 焦点与外链落点 · 窄窗口置灰（左右看宽、上下看高）· 上下分栏标签条紧贴分隔条 · 切方向两栏不重挂 · 右键菜单与溢出按组各自可用 |

## 3. 改动后的目录结构

```
app/src/
  components/browser/
    browser.tsx                        改：删掉内联标签条与旧分屏字段，装配两栏，比例与判定按方向
    browser.less                       改：第二栏头部、两种排布与 order、删工具档兜底
    parts/
      tab-strip/                       新：抽出的标签条（属性见 2.2）
        tab-strip.tsx
        tab-strip.less
      new-tab/                         改：id 由 idPrefix 派生，补 aria-controls
      secondary-pane/                  新：第二栏（标签条 + 页面容器）
        secondary-pane.tsx
    hooks/
      use-column-resize.ts             不变
      use-split-resize.ts              改：方向参数，比例语义统一为第二栏占比
      use-tab-overflow.ts              改：按组调用，不再读全局 store
  stores/browser/
    tab-group.ts                       新：与实例无关的分组纯函数与 key 分配
    tab-group.test.ts                  新
    tabs.ts                            改：薄封装，接口与引用稳定性不变；删旧分屏字段
    secondary.ts                       新：第二组标签（含自己的最近打开与首页规则）
    secondary.test.ts                  新
    targets.ts                         不变
  routes/
    layout.tsx                         改：第二栏页与焦点落点、关空即关分栏、主动合并、splitBlocked 只挡左右
  features/inbox/tests/
    layout.split.browser.ts            改：改写三段 + 补九类用例
    layout.exclusive.browser.ts        改：独占与分栏叠加一段
  locales/                             改：置灰原因（太窄 / 太矮）与「新栏」限定，四语齐
  design/tokens.less                   改：新增面板最小高度 token
  plan/08-layout-implemented.md        改：分栏一节按两组模型重写（旧的分屏描述作废）
```

## 4. 落地顺序与验证

1. 步骤 1、2 只做重构，行为零变化：跑 `pnpm lint`、`pnpm check`、`pnpm test`，现有 11 条分栏用例与标签条用例全过再继续（这两步不许改任何用例）。
2. 步骤 3 到 7 按顺序做，每步跑内圈（改动文件的 lint 与相关用例），分栏行为全部可见；每步结束都确认收起、换边、独占、窄窗口这四组行为未变。
3. 步骤 8、9 收尾，步骤 10 改写与补用例、更新文档。
4. 全量门禁：`pnpm lint` · `pnpm check` · `pnpm test:checkers` · `pnpm test` · 全量 `npx playwright test`（可达与后端不可达两遍）。
5. Windows 与 macOS 客户端需重新构建后复测两栏的圆角、分隔条、窄窗口置灰与换边叠加。
