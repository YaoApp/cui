# components/base/select

`components/base/select` 是产品里的选项选择器。它包装 Base UI 的 Select，渲染一个 `role="combobox"` 的
触发器 `.select-trigger`，由它打开 `.select-popup` 选项弹层。触发器用自己的一套 `.select-trigger*` 类，
不借输入框的类；两者只共用同一批字段 token，因此看起来是一族，行为各写各的。主题、语言等单选与多选
都用它。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `select.tsx` | `Select` 组件，以及 `SelectProps`、`SelectOption`、`SelectGroup` 类型。 |
| `select.less` | 触发器、弹层、列表、选项与其槽位、分组标题、滚动箭头与筛选框。 |
| `select.test.tsx` | 单元用例，覆盖可访问名、受控值、键盘、禁用、空态、分组、选项槽位、触发器图标优先级、反色与纯文字档、搜索、多选与清除项。 |
| `index.ts` | 模块对外的出口，即 `Select`、`SelectProps`、`SelectOption` 与 `SelectGroup`。 |

## 结构与类名

触发器是一个 `<button role="combobox">`。弹层与列表经 portal 渲染，由 Base UI 定位；锚点宽度、可用高度
一类几何量由它以 CSS 变量挂在弹层上。

| 部位 | 类名 | 说明 |
| --- | --- | --- |
| 触发器 | `.select-trigger` · `.select__trigger` | 追加 `select-trigger--small` / `--large`、`select-trigger--plain`、`select-trigger--inverse`、`is-error` 与 `is-<state>`。由 `Select.Trigger` 渲染，带 `role="combobox"`。 |
| 触发器取值 | `.select__value` | 单行截断，没有选中时显示占位文字。单选与「多选但调用方传了 `icon`」时由 `Select.Value` 渲染；多选且没传 `icon` 时按选项逐个渲染，每项一个 `.select__value-item`（内含该项图标与 `.select__value-label`），项间用 `.select__value-sep` 的逗号加空格分隔。 |
| 触发器图标 | `.select__lead` | 可选的前置或末尾图标槽，`aria-hidden="true"`。调用方传了 `icon` 时放它；单选时放选中项的图标；多选时图标跟在各自标签前（见上一行），这个槽为空。 |
| 指示器 | `.select-icon` | `i-down` 图标；`indicator` 为假时不画。 |
| 定位器 | `.select__positioner` | 定位弹层，按起始边对齐并留 4px 的间隙。间隙由定位器给，组件不带外边距。 |
| 弹层 | `.select-popup` | `searchable` 时追加 `select-popup--search`；最大高度对齐整行。 |
| 筛选框 | `.select-search` | 容器只给四周内距；里层是基础件 `Input`（`.select-search__field`，取小档），放大镜走它自己的左侧图标槽（`.field__icon`），因此落在控件边框以内，控件左侧预留 `--spacing-32`。 |
| 空态文字 | `.select-popup__empty` | 没有选项时显示 `emptyText`，筛选无命中时显示 `noMatchText`。 |
| 列表 | `.select-list` | 滚动容器，行高为 `--row-height`。 |
| 滚动箭头 | `.select-arrow` · `.select-arrow--up` | 只有列表可滚时才显示；每个高 `--spacing-24`，浮在列表让出的空档上。 |
| 分组标题 | `.select-group-label` | 每个 `SelectGroup` 一个。 |
| 选项 | `.select-item` | 内含 `.select-item__icon`、`.select-item__body`（含 `.select-item__label` 与 `.select-item__description`）、`.select-item__trailing` 与 `.select-item__check`。 |
| 选中标记 | `.select-item__check` | `i-check` 图标，只在选中项上显示。 |

## 属性

`SelectProps` 是联合类型：单选取 `value: string` 与 `onValueChange: (value: string) => void`；多选设置
`multiple: true`，取 `value: readonly string[]` 与 `onValueChange: (value: string[]) => void`。
两者共用的 `SelectBaseProps` 如下：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `options` | `readonly SelectOption[]` | `[]` | 平铺选项。给了 `groups` 时以它为准。 |
| `groups` | `readonly SelectGroup[]` | 无 | 分组选项，每组带一个组标题。 |
| `aria-label` | `string` | 必给 | 可访问名，落在触发器上。 |
| `id` | `string` | 无 | 触发器的 id。 |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 触发器高度 24 / 32 / 40，与按钮、输入框、复选框同梯。 |
| `placeholder` | `ReactNode` | 无 | 没有选中时显示；一个选项都没有时也显示。 |
| `emptyText` | `ReactNode` | 无 | 一个选项都没有时显示在弹层里。组件不自带文案。 |
| `icon` | `ReactNode` | 无 | 触发器图标，位置与颜色与输入框的图标槽一致。显式传了就一律以它为准（只显示这一个，多选也用它）。不传时按选中项派生：单选取选中项的图标放开头槽；多选把每个选中项的图标放在**它自己标签的前面**（`[图标] 项一, [图标] 项二`）。没有选中项时不显示图标。 |
| `error` | `boolean` | `false` | 危险描边与聚焦环，与输入框同一套规则。 |
| `disabled` | `boolean` | 无 | 阻断交互。 |
| `state` | `'hover' \| 'focus' \| 'loading'` | 无 | 挂在触发器上的静态态类，供并排展示。 |
| `searchable` | `boolean` | `false` | 在弹层顶部加一个筛选输入框。 |
| `searchLabel` | `string` | 无 | 筛选输入框的可访问名与占位文字，由调用方给四语。 |
| `noMatchText` | `ReactNode` | 无 | 筛选没有命中任何选项时显示。 |
| `filterOption` | `(option: SelectOption, query: string) => boolean` | 无 | 自定义过滤；不给则按标签文本不区分大小写包含查询。 |
| `variant` | `'field' \| 'plain'` | `'field'` | `field` 是字段外观，`plain` 不画字段底与边框。 |
| `iconPosition` | `'start' \| 'end'` | `'start'` | 触发器图标在取值之前还是之后。 |
| `indicator` | `boolean` | `true` | 是否画右侧的 `i-down` 指示器。 |
| `inverse` | `boolean` | `false` | 深底或品牌底上的反色档，与按钮的反色档同一处理。 |
| `required` | `boolean` | `false` | 只管表单校验，与能否清除选中无关。 |
| `className` | `string` | 无 | 追加到触发器上的类。 |

`SelectOption` 描述一行选项：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `value` | `string \| null` | `null` 是清除项，选中它即取消选择，触发器回到占位文字。 |
| `label` | `ReactNode` | 行文字。 |
| `icon` | `ReactNode` | 可选的前置图标。 |
| `description` | `ReactNode` | 可选的第二行说明。带说明的行会超过单行行高。 |
| `trailing` | `ReactNode` | 可选的右侧附加内容，例如徽标或快捷键。 |
| `disabled` | `boolean` | 行仍然显示，但不能被选中，键盘也不会停留。 |

`SelectGroup` 有 `label: ReactNode` 与 `options: readonly SelectOption[]`。

## 状态

| 状态 | 表达方式 |
| --- | --- |
| 默认 | 触发器取字段 token。 |
| 悬停 | 边框取 `--border-hover`；纯文字档与反色档改取 `--background-hover` 底。由 `:hover` 或 `.is-hover` 触发。 |
| 聚焦 | 触发器是按钮语义，鼠标点击不加环也不改底色；只有 `:focus-visible` 画环，反色档取 `--focus-ring-inverse` 或 `--brand`。 |
| 禁用 | 原生 `disabled` 属性；禁用底、禁用字与禁用边界，指针为 `not-allowed`。 |
| 错误 | 边框与聚焦环取 `--danger`，悬停与聚焦都保持危险色。 |
| 加载 | 指针为 `progress`。触发器本身不画加载圆环。 |
| 空 | 没有选中时显示占位文字；没有选项时弹层显示 `emptyText`，筛选无命中时显示 `noMatchText`。 |
| 清除 | 单选再点已选中项即取消并回传空字符串；`value: null` 的空值项同样表示清除。 |

弹层照动效规范的下拉场景：进场 200 毫秒、减速缓动，只动透明度与很小的缩放，原点由定位器给；退场
120 毫秒、加速缓动，只淡出，整块菜单不会在眼前飞走。弹层在进场结束时记住当时的宽度，退场期间不跟随
触发器。单选中选之后新值先挂起，等弹层完全消失再回传给调用方，触发器标签与宽度因此都在弹层看不见之后
才变。选中标记取 0.2 秒的 `fade` 场景。选项行不做逐行进入。

## 尺寸

| 档位 | 触发器高度 | 行高 | 字号 | 圆角 |
| --- | --- | --- | --- | --- |
| `small` | 24 | 20 | 12 | `--radius-small` |
| `medium` | 32 | 24 | 14 | `--radius-medium` |
| `large` | 40 | 24 | 16 | `--radius-large` |

触发器高度 24 / 32 / 40 由浏览器用例实测，行高 20 / 24 / 24 来自控件行高 token。弹层内距
`--spacing-4`，圆角取
`--radius-medium`，最大高度对齐整行，等行高的列表因此不会在末尾露出半行。选项行最小高取 `--row-height`（40），
块向内距 `--spacing-8`，行内内距 `--spacing-12`。带说明的两行选项按内容长高，实测 52。滚动箭头高
`--spacing-24`。筛选框取输入框的小档。

选项图标与选中标记取 16px，比同行正文（14px）高一档；触发器图标是调用方给的节点，默认尺寸也是 16px。
两者对**首行的行盒**对齐，不按基线。单行选项在行内居中，实测图标中心 20、行中心 20。两行选项整行顶对齐，图标与勾落在首行，
**中心与标题文字行的中心对齐**（实测行盒中心 16.5、图标盒中心 16.0），不按标题含降部的墨迹另做偏移，也不沉到整块中心。

## 无障碍

- `aria-label` 必给。Base UI 的 Trigger 渲染带 `role="combobox"` 的按钮，名字落在它上面。
- 键盘：回车、空格与方向键打开弹层，方向键移动高亮，回车选中，Escape 关闭。禁用项被键盘跳过，也无法选中。
- 弹层是 listbox，每一行是 option。禁用项把禁用状态如实暴露给辅助技术。
- 前置与末尾图标槽是 `aria-hidden="true"`，选中标记是装饰。选中与否由选项的可访问状态承载。
- 筛选输入框的可访问名由 `searchLabel` 给。它只拦文字输入的按键，方向键、回车与 Escape 放行，因此键盘可以
  从输入框走进列表，也可以关闭弹层。
- `state` 只用于静态展示，不改变行为。

## 类与 token

触发器、弹层、列表、选项、箭头与筛选框全部定义在 `select/select.less`。触发器与输入框取同一批字段 token，
即 `--background-field`、`--border-control`、`--border-hover`、`--brand`、`--danger`、`--background-disabled`、
`--text-disabled` 与 `--border-disabled`，但类仍是自己的。纯文字档取 `--background-hover`；反色档取
`--background-inverse`、`--background-inverse-hover`、`--text-inverse` 与 `--focus-ring-inverse`。弹层取
`--background-surface`、`--border-default`、`--shadow-floating` 与 `--radius-medium`。选项行高亮取
`--background-hover`，选中取 `--brand-soft` 与 `--brand-ink`；两种底色都画在行的 `::before` 上，并在块向两端
各内缩半个间距档，两行相邻时颜色不会相接。选中标记与滚动箭头取项目自己的图标。

## 使用方式

```tsx
import { Select } from '@/components/base'

<Select
  aria-label="主题"
  value={theme}
  onValueChange={setTheme}
  options={[
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: null, label: '清除' },
  ]}
  placeholder="请选择主题"
/>
```

清单页在 `app/src/features/scaffold/base/base.tsx` 里按属性、形态、状态、尺寸、选项、分组、长列表、多选、
搜索与空态十组列出样例，页面路由是 `/app/scaffold/base`。

## 验证方式

```bash
pnpm lint        # stylelint、eslint 与 tsc
pnpm check       # token、i18n 与约定检查器
pnpm test        # 单元测试，含 select.test.tsx
pnpm build       # 生产构建
pnpm exec playwright test app/src/features/scaffold/base/tests/   # 清单页的浏览器用例
```

浏览器用例实测触发器三档高度 24 / 32 / 40 以及中档与输入框同高、`i-down` 指示器、选项行高对
`--row-height`、长列表与带筛选长列表的整行高度、箭头让出的空档与不重叠、分组标题、选项槽位、选中另一项后
触发器图标换成该项的图标、多选与搜索行为、清除与重选行为、反色档的绘制，以及鼠标聚焦不留环的规则。

## 已知限制

- `aria-label` 必给。组件不渲染外部标签，也不接受 `aria-labelledby`。
- `state` 没有 `error` 成员，错误由布尔属性 `error` 表达；也没有打开态，弹层由 Base UI 驱动。
- `options` 与 `groups` 二选一。给了 `groups` 时忽略 `options`。
- 取值都是字符串。`value: null` 的空值项是清除项，单选中回传空字符串。
- 多选没有全选控件。
- 触发器只在键盘聚焦时画环，这是有意为之；鼠标选中一项后焦点回到触发器，不留环。
- `state="loading"` 只把指针换成 `progress`，触发器不画可见的进程指示器。
