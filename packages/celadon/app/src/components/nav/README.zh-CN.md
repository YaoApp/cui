# components/nav

`components/nav` 是应用左侧的导航列，按 `design/main-shell.md` §三 分四段：头部内块、上区主导航、下区当前、底部一行。
两处收起是两件事：头部的键收整列，上区自己的键只折主导航。组件不认识业务，条目、「当前」区的内容与账号名全部由装配层给。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `nav.tsx` | `Nav` 组件与 `NavProps`。四段装配，两处收起的状态与两个动作由调用方传入。 |
| `nav.types.ts` | `NavItem`：`key` · `icon` · `labelKey` · `to` · `badge?` · `active?`。 |
| `nav.less` | 列容器、四段的布局、两处收放、图标轨、菜单与各状态；宽度取 `--nav-default` 与 `--nav-collapsed`。 |
| `parts/header/` | 头部内块：品牌、整列收起键；客户端里另加窗口控制，Web 下不画。 |
| `parts/main/` | 上区主导航：内块（分区名与折上区键）与六项列表；折起后整段让位。 |
| `parts/scene/` | 下区：二级导航插槽；主导航折起时这一区顶上「当前」那一行与展开键。 |
| `parts/footer/` | 底部一行：头像与名字在左，快捷图标在右。 |
| `parts/list/` | 上区列表容器，逐项渲染。 |
| `parts/list/parts/item/` | 一个条目：图标、文字、未读角标、当前态。渲染真链接。 |
| `parts/menu/` | 折叠态的找回菜单，用上游 `@base-ui/react` 的 `Menu` 部件。 |
| `index.ts` | 对外出口，即 `Nav`、`NavProps` 与 `NavItem`。 |

四个部件各自一个 `index.ts`，只导出自己的组件与 props 类型。样式是**一份** `nav.less`，由 `nav.tsx` 引入：列容器与跨部件的状态规则（收起、展开、让位、宽度界线）在这里统一管，各部件自己的规则留在同一文件内按段落排布；部件样式文件是可选的，本模块不做拆分。

## 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `items` | `NavItem[]` | 无 | 主导航六项。缺省不渲染条目。 |
| `shortcuts` | `NavItem[]` | 无 | 底部一行的快捷图标，与主导航里对应条目是同一份内容。 |
| `scene` | `I18nKey` | 无 | 「当前 · 场景」里的场景名。没有场景时传 `shell.navigation.scene.none`。 |
| `sceneIcon` | `IconId` | 无 | 场景图标，画在「当前」那一行的最前。 |
| `accountName` | `string` | 无 | 底部一行的名字，取不到会话用户时由装配层给占位词。 |
| `collapsed` | `boolean` | 无 | 整列是否收起。取值由调用方持有，组件不自己存偏好。 |
| `onToggle` | `() => void` | 无 | 收起键的动作。 |
| `mainFolded` | `boolean` | 无 | 上区是否折叠，与整列收起不是一件事。 |
| `onToggleMain` | `() => void` | 无 | 上区的折叠键与下区的展开键共用的动作。 |
| `children` | `ReactNode` | 无 | 下区的二级导航，由业务域以插槽给；不传时下区只有场景标题。 |
| `onSelect` | `(item: NavItem) => void` | 无 | 选中一个条目。条目是真链接，带修饰键的点击交还浏览器。 |

部件级的 props：`NavHeader` 取 `collapsed` · `onToggle`；`NavMain` 取 `items` · `compact` · `folded` · `onToggleFold` · `onSelect`；
`NavScene` 取 `items` · `currentLabel` · `sceneIcon` · `folded` · `onSelect` · `onUnfold` · `children`；
`NavFooter` 取 `name` · `shortcuts` · `onSelect`；`NavList` 取 `items` · `label` · `compact` · `onSelect`；
`NavItemRow` 取 `item` · `compact` · `onSelect`；`NavMenu` 取 `items` · `currentLabel` · `sceneIcon` · `onSelect`。

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
| 悬停 | 底取 `--background-hover`；整列收起时指针落在列上，标志淡出并浮出展开图标。 |
| 焦点 | `box-shadow: var(--focus-ring)`，由 `:focus-visible` 触发。 |
| 当前 | 底取 `--background-selected`，文字取 `--brand-ink`，并带 `aria-current="page"`。 |
| 未读 | 角标底取 `--brand-soft`，字色取 `--brand-ink`。 |
| 收起 | 列宽取 `--nav-collapsed`，文字与分区名收起，条目居中，下区让位；再点标志展开。 |
| 折叠 | 上区高度与不透明度过渡到零，下区顶上「当前」那一行与展开键找回。 |

## 无障碍

- 整列是 `<nav>`，带无障碍名；上区列表带自己的名字。
- 每个条目是带真实 `href` 的链接，可右键、复制、在新窗口打开；左键点击交给调用方路由。
- 折叠后「当前」那一行是菜单触发元素，带 `aria-expanded`；菜单打开时焦点进菜单，方向键在条目间移动，`Esc` 关闭并把焦点交回这一行。
- 图标按钮一律给 `aria-label`，并有文字提示。

## 验证方式

- 单元用例与组件同目录：`nav.test.tsx`，覆盖条目与当前态、修饰键点击、折叠与展开键、整列收起、两处动作分流、二级导航插槽。
- 浏览器用例：`app/src/features/inbox/tests/layout.browser.ts` 覆盖整列收起与刷新保持、折叠与键盘找回、菜单的 `Esc` 与焦点交回、最小窗口不出横向滚动。
- 几何按实测核对：栏宽取 `getBoundingClientRect().width`，与 `--nav-default`、`--nav-collapsed` 一致；条目、图标与头像的位置与 `design/main-shell.md` §三 对齐。

## 已知限制

- 收起与展开的形态切换用时长常量（`COLLAPSE_MS` · `EXPAND_MS`）与样式里的时长对齐，两边必须同步改。
- 样式里有两条按列宽取值的界线（`@nav-rail-band` 与 `@nav-label-band`），它们是现行行为的依据，改动前先量两态的列宽。
- 抽屉形态（视口小于 `--bp-nav-drawer`）还没有做。
- 未读数只接 `badge` 这个口子，真实数字由装配层给。
- 只有收件箱提供了二级导航插槽；其余场景的二级导航随各自业务域落地。
