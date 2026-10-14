# components/browser

`components/browser` 是应用右侧的标签浏览器，也就是三栏里的第三栏。按 `design/main-shell.md` §五，它按浏览器理解：
顶部标签条（一页一个标签，末尾是新建键，再右是下拉键），下面是当前页，分屏时是两个面板。
标签是全局一套，与会话弱关联。组件不认识业务：标签数据与页内容都由装配层给，组件本身不读任何 store。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `browser.tsx` | `Browser` 组件与 `BrowserProps`：标签条、下拉菜单、后段两颗键、面板与分隔条。 |
| `browser.less` | 这一栏的宽度与让位、顶栏、标签块、关闭键、菜单与分隔条、新标签页与内部路由占位页的样式。 |
| `types.ts` | `BrowserTab`：`key` · `label` · `closable` · `icon`。 |
| `hooks/use-column-resize.ts` | 整栏与内容区分界线的拖动：宽度只写 `--side-width`，拖动期间取整。 |
| `hooks/use-split-resize.ts` | 面板之间分隔条的拖动：比例写 `--split-ratio`，夹在 0.2 与 0.8 之间。 |
| `parts/page/` | `TabPage`：按页的目标派发内容（首页与空页 → 新标签页；外部网址 → 外部页；内部路由与快捷方式 → 内部路由页）。 |
| `parts/tabs/` | `BrowserTabs`：一行标签项加末尾的新建键。 |
| `parts/item/` | `BrowserTabItem`：一个标签块（图标 · 标题 · 关闭键）。 |
| `parts/new-tab/` | `NewTab`：新标签页，地址入口与「这一侧打开过的东西」；首页与 `＋` 新建出来的空页共用这一个组件。 |
| `parts/web/` | `Web`：外部地址页的占位与地址行。 |
| `parts/internal/` | `Internal`：内部路由页的占位与路径（含快捷方式解析后的路径）。 |
| `index.ts` | 对外出口：`Browser` · `TabPage` · `NewTab` · `Web` 与各自的类型。 |

## 属性

`Browser`：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `tabs` | `BrowserTab[]` | 无 | 标签条上的页。 |
| `activeKey` | `string` | 无 | 当前页的 `key`。找不到对应标签时按首页处理。 |
| `side` | `'right' \| 'left'` | 无 | 这一栏在哪一侧，写到 `data-side` 上。 |
| `collapsed` | `boolean` | `false` | 整栏收成零宽（用户收起或视口放不下）。 |
| `split` | `'none' \| 'columns' \| 'rows'` | `'none'` | 单面板或分屏方向。 |
| `splitBlocked` | `boolean` | `false` | 栏宽放不下两个面板：菜单里两颗分栏项置灰。 |
| `splitRatio` | `number` | `0.5` | 第一个面板占的比例。 |
| `onSplitRatio` | `(ratio: number) => void` | 无 | 分隔条拖动后交回比例。 |
| `onSplit` | `(split: BrowserSplit) => void` | 无 | 切换分屏方向。 |
| `width` | `number \| null` | `null` | 拖出来的栏宽；`null` 跟随 token 默认宽。 |
| `onWidth` | `(width: number \| null) => void` | 无 | 分界线拖动或双击复位后交回宽度。 |
| `onActivate` | `(key: string) => void` | 无 | 切到某一页。 |
| `onClose` | `(key: string) => void` | 无 | 关掉某一页。`closable: false` 的页不画关闭键。 |
| `onNew` | `() => void` | 无 | 新建：开一个空页并停到它（此后在这一页里换内容）。 |
| `onMove` | `() => void` | 无 | 换到另一侧。 |
| `onCollapse` | `() => void` | 无 | 收掉整栏。 |
| `exclusive` | `boolean` | `false` | 面板独占整扇窗口（导航区与内容区让位）。 |
| `onExclusive` | `() => void` | 无 | 进或退独占。 |
| `children` | `ReactNode` | 无 | 第一个面板的当前页。 |
| `secondary` | `ReactNode` | 无 | 第二个面板的当前页，只有分屏时渲染。 |
| `secondaryLabel` | `string` | 无 | 第二个面板小条上的名字。 |
| `focusedPane` | `number` | 无 | 聚焦哪个面板：标签条的点击落在聚焦的那个面板上。 |
| `onFocusPane` | `(pane: number) => void` | 无 | 面板被点中时交回编号。 |

`BrowserTab`：`key`（页的稳定标识，页里换内容不变）· `label`（标签上的名字）· `closable`（是否画关闭键）· `icon`（可选，图形名；不给时按是否可关推）。

`TabPage`：`tab`（要渲染的那一页，`stores/browser/tabs.ts` 的 `TabEntry`）· `recent`（新标签页上的「打开过的东西」）· `onOpen`（地址入口提交的一段输入）。

`NewTab`：`recent` · `onOpen`。`Web`：`address`。`Internal`：`path`。

## 使用方式

页的内容按目标派发，页里打开的落点由装配层定（见 `routes/layout.tsx`）：

```tsx
<Browser
  tabs={view}
  activeKey={activeKey}
  side={browserSide}
  split={browserSplit}
  onActivate={(key) => activateTab(key)}
  onClose={(key) => closeTab(key)}
  onNew={() => openBlankTab()}
  onMove={() => setBrowserSide(browserSide === 'right' ? 'left' : 'right')}
  onCollapse={toggleBrowser}
  secondary={renderTab(secondaryTab)}
>
  {renderTab(active)}
</Browser>

/* renderTab：一页的内容交给 TabPage，提交后落在这一页里 */
<TabPage tab={tab} recent={recent} onOpen={(input) => navigateTab(tab.key, parseTarget(input))} />
```

标签的打开与关闭走 `stores/browser/tabs.ts`；输入解析成什么内容走 `stores/browser/targets.ts`
（空串是新标签页，`/` 开头是内部路由，已知名字是快捷方式，其余按外部网址）。

## 无障碍

- 整栏是 `<aside>` 并带无障碍名；标签条是 `role="tablist"`，每个标签的主体是 `role="tab"`，当前页带 `aria-selected="true"`。
- 新建、下拉、换边、分栏、最大化/恢复、收起这一栏都是图标按钮，一律给 `aria-label` 与文字提示。
- 关闭键是 `role="button"`，带 `aria-label`，不进 Tab 序（键盘关闭走标签上的 `Delete`，随第 9 条落地）。
- 标签标题被省略号截断时，完整内容由本包统一的 `Tooltip` 给；被省略的那一层不接指针。
- 地址栏是带可见标签的输入框，回车提交。

## 状态

| 状态 | 表达方式 |
| --- | --- |
| 缺省 | 标签块透明底；当前页取 `--nav-select`。 |
| 悬停 | 标签块取 `--nav-hover`；关闭键由不画转为画，放大 1.2 并把颜色由次级提到主级，不加底色。 |
| 焦点 | 主体上画 `--focus-ring`（标签可聚焦随第 9 条落地后可见）。 |
| 空 | 新标签页在没有任何打开过的页时显示空态文字。 |
| 收掉 | 整栏零宽并带 `inert`，内容区拿到空出来的宽度。 |
| 让位 | 宽到容不下这一栏时整条收到零宽，不是压窄。 |

## 验证方式

- 单元用例与组件同目录：`browser.test.tsx`；标签集与目标解析在 `app/src/stores/browser/tabs.test.ts` 与 `targets.test.ts`。
- 浏览器用例（组件自验）：`tests/tab.browser.ts`（标签块与关闭键）、`tests/exclusive-width.browser.ts`（独占与导航收起同时成立时的栏宽）。
- 浏览器用例（三栏与布局）：`app/src/features/inbox/tests/` 下按层拆开——`layout.shell.browser.ts`（三栏骨架 · 导航 · 本栏收放与列头 · 换边 · 让位）、`layout.split.browser.ts`（分屏与分隔条）、`layout.exclusive.browser.ts`（上下分栏与独占）、`layout.motion.browser.ts`（动效）；共用件在 `layout.helpers.ts`。

## 已知限制

- 溢出还没进菜单：标签条仍是滚动容器，放不下的标签没有收进下拉（第 14 条）。
- 标签右键菜单（刷新 · 关闭 · 关闭其他 · 关闭全部）还没做（第 13 条）。
- 键盘与拖动换序还没做（第 9、16 条）；关闭键因此还不进 Tab 序，焦点态在界面上还到不了。
- 关闭一页后，其余标签不做跟随位移（原按布局投影实现，投影会在 WebKit 上引起重栅格化，已从标签上移除）。
- 外部网址与内部路由的页现在都是占位，真实内容随后接；「打开过的东西」也只列本次会话里打开的页。
