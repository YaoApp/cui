# components/nav

应用左侧的导航列。规范来源是 `design/main-shell.md` 第三节与 `design/foundations.md` 的 F6，本文档与这两处**逐条对齐**，不写它们没有的内容。

导航列有两种**互相独立**的收放，这是本模块最容易混淆的地方：

| 收放 | 状态来源 | 效果 | 出口 |
| --- | --- | --- | --- |
| 整列收起 | `collapsed` | 列宽收为 `0`，导航区整体不可见，内容列从最左铺满 | **内容列头左端的打开按钮**，不在本组件里 |
| 上区折叠 | `mainFolded` | 收起上区六项主导航，「当前」那一行与展开键在列底常驻 | 下区那一行的展开键 |

两件事互不影响：整列收起时上区照常渲染（只是整列不可见），上区折叠时整列宽度不变。组件不认识业务，条目、「当前」区的内容与账号名全部由装配层给。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `nav.tsx` | `Nav` 组件与 `NavProps`。四段装配，两处收放的状态与动作由调用方传入；列宽由 `useNavResize` 管。 |
| `nav.types.ts` | `NavItem`：`key` · `icon` · `labelKey` · `to` · `badge?` · `active?`。 |
| `nav.less` | 列容器、四段布局、两处收放、折叠菜单与各状态。宽度取 `--nav-width`（运行时由拖动写入，缺省 `--nav-default`，上下限 `--nav-min` 与 `--nav-max`）；整列收起为 `0`，由 `[data-width='zero']` 一条规则表达。 |
| `hooks/use-nav-resize.ts` | 列宽拖动：指针按下、按帧应用、键盘方向键、双击复位、悬停高亮与光标。 |
| `parts/header/` | 头部内块：整列收起键；Web 上另画品牌（标志与产品名）。桌面客户端的 `controls` 为 `own` 时整块不渲染，窗口键由壳负责。 |
| `parts/brand/` | 品牌行：标志与产品名，两端在 `controls` 不为 `none` 时画在头部下方一行。 |
| `parts/main/` | 上区主导航：内块（分区名与折叠键）与六项列表。折叠时整段不占高度，列表仍在结构里由动画收起。 |
| `parts/scene/` | 下区：二级导航插槽；上区折叠时这一区顶上「当前」那一行与展开键。 |
| `parts/footer/` | 底部一行：头像与名字在左，快捷图标在右；`margin-block-start: auto` 钉在列底。 |
| `parts/list/` | 上区列表容器，逐项渲染。 |
| `parts/list/parts/item/` | 一个条目：图标、文字、未读角标、当前态。渲染真链接。 |
| `parts/menu/` | 折叠态的找回菜单，用上游 `@base-ui/react` 的 `Menu` 部件。 |
| `index.ts` | 对外出口，即 `Nav`、`NavProps` 与 `NavItem`。 |

四个部件各自一个 `index.ts`，只导出自己的组件与 props 类型。样式是**一份** `nav.less`，由 `nav.tsx` 引入：列容器与跨部件的状态规则（收起、折叠、贯通高度）在这里统一管，各部件自己的规则留在同一文件内按段落排布。

## 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `items` | `NavItem[]` | 无 | 主导航六项。缺省不渲染条目。 |
| `shortcuts` | `NavItem[]` | 无 | 底部一行的快捷图标，与主导航里对应条目是同一份内容。 |
| `scene` | `I18nKey` | 无 | 「当前 · 场景」里的场景名。没有场景时传 `shell.navigation.scene.none`。 |
| `sceneIcon` | `IconId` | 无 | 场景图标，画在「当前」那一行的最前。 |
| `accountName` | `string` | 无 | 底部一行的名字，取不到会话用户时由装配层给占位词。 |
| `navWidth` | `number \| null` | `null` | 存下来的列宽；`null` 表示用缺省值。 |
| `onNavWidth` | `(width: number \| null) => void` | 无 | 拖动结束或键盘调整后的列宽写回。 |
| `collapsed` | `boolean` | 无 | 整列是否收起。取值由调用方持有，组件不自己存偏好。 |
| `onToggle` | `() => void` | 无 | 整列收起键的动作。 |
| `mainFolded` | `boolean` | 无 | 上区是否折叠，与整列收起不是一件事。 |
| `onToggleMain` | `() => void` | 无 | 上区的折叠键与下区的展开键共用的动作。 |
| `children` | `ReactNode` | 无 | 下区的二级导航，由业务域以插槽给；不传时下区只有场景标题。 |
| `onSelect` | `(item: NavItem) => void` | 无 | 选中一个条目。条目是真链接，带修饰键的点击交还浏览器。 |

部件级 props：`NavHeader` 取 `onToggle`（Web 上另有内部平台判定）；`NavMain` 取 `items` · `compact` · `folded` · `onToggleFold` · `onSelect`；
`NavScene` 取 `items` · `currentLabel` · `sceneIcon` · `folded` · `columnWidth` · `onSelect` · `onUnfold` · `children`；
`NavFooter` 取 `name` · `shortcuts` · `onSelect`；`NavList` 取 `items` · `label` · `compact` · `onSelect`；
`NavItemRow` 取 `item` · `compact` · `onSelect`；`NavMenu` 取 `items` · `currentLabel` · `sceneIcon` · `columnWidth` · `onSelect`。

`NavItem` 的字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `key` | `string` | 稳定的键，用于选中判定与列表 key。 |
| `icon` | `IconId` | 图标，取自 `design/icons/manifest.json`。 |
| `labelKey` | `I18nKey` | 文字在语言包里的键。 |
| `to` | `string` | 应用内路径，不带命名空间。 |
| `badge` | `number` | 未读数，缺省与 0 都不画角标。 |
| `active` | `boolean` | 当前项，由装配层按地址判定。 |

## 使用方式

条目与状态都在装配层准备，导航列只负责画与回调：

```tsx
const items: NavItem[] = [
  { key: 'inbox', icon: 'i-inbox', labelKey: 'shell.navigation.item.inbox', to: '/inbox' },
]

<Nav
  items={items}
  shortcuts={items.filter((item) => item.key === 'workspace')}
  scene="inbox.title"
  sceneIcon="i-inbox"
  accountName={account?.name ?? t('shell.navigation.account.placeholder')}
  navWidth={navWidth}
  onNavWidth={setNavWidth}
  collapsed={collapsed}
  onToggle={toggleNav}
  mainFolded={mainFolded}
  onToggleMain={toggleMain}
  onSelect={(item) => navigate(item.to)}
>
  <InboxNav />
</Nav>
```

## 状态

| 状态 | 表达方式 |
| --- | --- |
| 缺省 | 条目透明底，文字取 `--text-primary`。 |
| 悬停 | 底取 `--nav-hover`（导航列专用档，通用 `--background-hover` 只服务白底场景）；键盘高亮 `[data-highlighted]` 同用这一档。 |
| 焦点 | `box-shadow: var(--focus-ring)`，由 `:focus-visible` 触发。 |
| 当前 | 底取 `--nav-select`，文字取 `--text-primary`，并带 `aria-current="page"`；选中由明度差表达，不用品牌色。 |
| 未读 | 角标底取 `--brand-soft`，字色取 `--brand-ink`；当前项上的角标不渲染，样式保留。 |
| 整列收起 | 列宽为 `0`（`[data-width='zero']`），内距与右侧描边一起收到零，整列不可见；重新展开的出口在内容列头左端。 |
| 上区折叠 | 上区收缩到零高：折叠体的高度由 Motion 动到 `0`（`overflow: hidden`），上区自身 `flex: 0 1 auto` 不吃剩余高度；列底出现「当前」那一行与展开键。 |
| 拖动列宽 | 指针进入右缘 4 像素带后光标即时变化、高亮延迟 300 毫秒出现；按下按帧应用，双击复位，方向键调整。把手上标了 `data-no-drag`，窗口拖动不吃它。 |
| 窗口拖动与双击 | 窗口顶带（`--window-drag-band`，48 像素）内的空白处：**按下并移动**拖动窗口，双击在最大化与还原之间切换，单击不做任何事；两个平台都由应用受理。列头空白处可以拖，列头里的键与右缘把手不吃这两个动作；顶带里不参与文本选择，指针是箭头。 |
| 内容超高 | 上区与下区**各自**有滚动区：区域自身裁切（`overflow: hidden`），内部滚动区吃剩余高度并**在悬停时显示滚动条**。两区互不叠压。 |

## 无障碍

- 整列是 `<nav>`，带无障碍名；上区列表带自己的名字。
- 每个条目是带真实 `href` 的链接，可右键、复制、在新窗口打开；左键点击交给调用方路由。
- 折叠后「当前」那一行是菜单触发元素，带 `aria-expanded`；菜单打开时焦点进菜单，方向键在条目间移动，`Esc` 关闭并把焦点交回这一行。
- 图标按钮一律给 `aria-label`，并有文字提示；整列收起后不再参与焦点顺序。
- 拖动把手是 `role="separator"`，带 `aria-valuemin` · `aria-valuemax` · `aria-valuenow`，支持方向键。

## 验证方式

- 单元用例与组件同目录：`nav.test.tsx` 覆盖条目与当前态、修饰键点击、折叠与展开键、整列收起（断言 `data-collapsed`）、两处动作分流、二级导航插槽；`hooks/use-nav-resize.test.tsx` 覆盖拖动、键盘与复位。
- 浏览器用例：`app/src/features/inbox/tests/layout.browser.ts` 覆盖整列收起与刷新保持、折叠与键盘找回、菜单的 `Esc` 与焦点交回、最小窗口不出横向滚动。
- 几何按实测核对：栏宽与两段高度取 `getBoundingClientRect()`，收起态读数为列宽 `0`、内容列从 `0` 起铺满；折叠态读数为上区高度 `0`、折叠行贴用户区上方、间距一档内距。

## 已知限制

- 折叠动画用 Motion 的弹簧参数（`stiffness 420` · `damping 38` · `mass 0.9`），减少动效偏好下退化为瞬时；参数与 `design/foundations.md` 的时长档位没有强绑定，改样式不会同步改它。
- 列宽可拖区间为 `264–420`，窄视口（`≤1023`）由 `collapsed` 自动收起，走的是同一个状态与同一套样式；窄视口下临时展开的浮层（覆盖中栏）尚未实现。
- 二级导航只在收件箱接上；其余场景随各自业务域落地。
- 未读数只接 `badge` 这个口子，真实数字由装配层给。
