# components/base/button

`components/base/button` 是产品里的按钮。它经由 Base UI 渲染原生 `<button>`，因此键盘触发、`disabled`
属性与表单参与都保持原生行为；外观则由按钮族的设计类画出八个变体。表单主操作、工具条操作、图标按钮与
危险操作都用它。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `button.tsx` | `Button` 组件与 `ButtonProps`。 |
| `button.less` | 按钮族的设计类与组件自有的布局：变体的四态、三个尺寸档、胶囊形态、图标形态与加载态。 |
| `button.test.tsx` | 单元用例，覆盖变体与尺寸类、回调、禁用、键盘触发、加载态与静态态。 |
| `parts/label/label.tsx` | 私有子件 `Label`。每个按钮的内容都包在 `<span class="button__label">` 里。 |
| `parts/label/index.ts` | `Label` 子件的再导出。 |
| `index.ts` | 模块对外的出口，即 `Button` 与 `ButtonProps`。 |

## 结构与类名

一个按钮渲染一个 `<button>` 元素。基础类是 `.button`，尺寸类是 `.button--small`、`.button--medium`
或 `.button--large`。变体贡献自己的类，可选的修饰类 `.button--pill`、`.button--block`、`.button--icon`、
`.is-loading` 与 `.is-hover` / `.is-active` / `.is-focus` 叠加在其上。内容落在
`<span class="button__label">` 里；加载期间标签之前渲染一个 `.spinner`。

| 部位 | 类名 |
| --- | --- |
| 元素 | `.button` 加 `.button--<size>` |
| 形态 | `.button--pill`；默认的 `rounded` 形态不追加类 |
| 变体 | `.btn-primary.is-solid` · `.btn-primary` · `.btn-ghost` · `.btn-warn` · `.btn-success` · `.btn-danger` · `.button--inverse` · `.button--plain` |
| 修饰 | `.button--block` · `.button--icon` · `.is-loading` · `.is-hover` / `.is-active` / `.is-focus` |
| 内容 | `.button__label`；加载指示器为 `.spinner` |

## 属性

`ButtonProps` 继承原生按钮属性，因此 `type`、`disabled`、`name`、`value`、`onClick` 等原样透传。
Base UI 的 Button 渲染原生 `<button type="button">`，并用 `data-*` 暴露状态，上面的视觉类因此是唯一的
主题层。组件自有的属性如下：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `variant` | `'solid' \| 'soft' \| 'ghost' \| 'plain' \| 'warn' \| 'success' \| 'danger' \| 'inverse'` | `'soft'` | 外观变体。`solid` 是品牌实心，`soft` 是品牌浅底，`ghost` 是白底描边，`plain` 无底无框，`warn` / `success` / `danger` 为描边式语义档，`inverse` 为深底反色档。 |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 控件高度 24 / 32 / 40。 |
| `shape` | `'rounded' \| 'pill'` | `'rounded'` | `rounded` 取所在尺寸档的同名圆角 token；`pill` 取 `--radius-pill`。 |
| `block` | `boolean` | `false` | 占满整行，用于表单主操作。 |
| `loading` | `boolean` | `false` | 禁用按钮，设置 `aria-busy="true"`，并渲染指示器。 |
| `state` | `'hover' \| 'active' \| 'focus'` | 无 | 静态态类，供并排展示。真实交互仍由 CSS 伪类驱动。 |
| `iconOnly` | `boolean` | `false` | 方形图标按钮。必须给 `aria-label`。 |
| `icon` | `ReactNode` | 无 | 与文字并排的图标。 |
| `iconPosition` | `'start' \| 'end'` | `'start'` | 图标在 `.button__label` 里的位置。 |
| `children` | `ReactNode` | 无 | 标签文字。可以为空，图标按钮因此不必给文字。 |

## 状态

| 状态 | 表达方式 |
| --- | --- |
| 默认 | 变体自身的静止配色。 |
| 悬停 | 同族更深一档的颜色，由 `:hover` 或 `.is-hover` 触发。 |
| 按下 | `transform: scale(.94)`，不换色，由 `:active` 或 `.is-active` 触发。 |
| 聚焦 | `box-shadow: var(--focus-ring)`；语义档与反色档取各自色系的环。由 `:focus-visible` 或 `.is-focus` 触发。 |
| 禁用 | 真实的 `disabled` 属性；禁用底、禁用字与禁用边框 token，指针为 `not-allowed`。 |
| 加载 | `disabled`、`aria-busy="true"`、`.is-loading`，标签之前有一个 `.spinner`。 |

本组件没有错误态与空态。按钮总会有文字或图标；操作失败用 `variant="danger"` 表达，它是外观变体而不是
校验状态；图标按钮的可访问名由 `aria-label` 提供。

## 尺寸

| 档位 | 高度 | 横向内距 | 字号 | 圆角 | 图标 |
| --- | --- | --- | --- | --- | --- |
| `small` | 24 | 12 | 12 | `--radius-small` | 16 |
| `medium` | 32 | 16 | 14 | `--radius-medium` | 16 |
| `large` | 40 | 24 | 16 | `--radius-large` | 20 |

三档高度 24 / 32 / 40 由间距刻度推出（`--spacing-24`、`--spacing-32` 与 `32 + 8`）。胶囊形态保持同样的
高度。图标按钮是方形：行内边长等于该档的控件高度（24 / 32 / 40），横向内距归零，胶囊形态因此变成正圆。
图标尺寸取图标梯的 16 / 16 / 20，由组件统一给，写在 `icon` 元素上的 `size` 会被覆盖。

## 无障碍

- Base UI 渲染原生 `<button type="button">`，禁用时设置 `data-disabled`，因此回车与空格的触发、禁用属性
  与表单参与都是原生行为。
- 图标按钮没有可见文字，必须给 `aria-label`；缺了可访问名，按钮读不出名字。
- `loading` 同时禁用按钮并暴露 `aria-busy="true"`；指示器本身是装饰。
- 焦点环取自 token，浏览器默认轮廓被移除，每个变体的键盘焦点都可见。
- `state` 只用于静态展示，不改变行为；`state="focus"` 不会真的移动焦点。

## 类与 token

变体类住在组件同目录的 `button/button.less` 里，颜色一律取 token，用到 `--brand`、`--brand-soft`、
`--brand-solid-hover`、`--brand-soft-hover`、`--warm`、`--success`、`--danger`、`--danger-ink`、
`--background-surface`、`--background-inverse`、`--background-inverse-hover`、`--background-disabled`、
`--text-disabled`、`--border-disabled` 以及各变体的焦点环。组件自有的布局取间距刻度、圆角 token、
`--line-height-control`、`--font-size-caption` / `--font-size-body` / `--font-size-body-lg`，以及动效 token
`--duration-fast` 与 `--easing-standard`。按下照动效规范的 `press` 场景，只做缩放。

字族不由组件指定：浏览器默认样式表给原生 `<button>` 落了 `font` 简写，作用域上的字族到不了按钮内部，
所以按钮根上写 `font-family: inherit` 把作用域的字族接过来。没有这一条，切换语言后按钮里的字会掉回
浏览器默认族，而按钮文字（例如「下一步」）正是最先被看出来的地方。

## 使用方式

```tsx
import { Button, Icon } from '@/components/base'

<Button variant="solid" onClick={save}>保存</Button>
<Button icon={<Icon name="i-plus" />}>新建任务</Button>
<Button variant="plain" iconOnly aria-label={t('actions.close')}>
  <Icon name="i-act-close" />
</Button>
```

清单页在 `app/src/features/scaffold/base/base.tsx` 里按属性、状态、尺寸、图标按钮与图标加文字五组列出样例，
页面路由是 `/app/scaffold/base`。

## 验证方式

```bash
pnpm lint        # stylelint、eslint 与 tsc
pnpm check       # token、i18n 与约定检查器
pnpm test        # 单元测试，含 button.test.tsx
pnpm build       # 生产构建
pnpm exec playwright test app/src/features/scaffold/base/tests/   # 清单页的浏览器用例
```

浏览器用例实测三档高度 24 / 32 / 40、圆角 token、每个变体在默认 / 悬停 / 按下 / 聚焦四态的绘制差异、
按下的 `.94` 缩放、图标按钮的方形边长与图标尺寸 16 / 16 / 20。

## 已知限制

- 没有 `error` 属性。失败用 `variant="danger"` 表达，它是外观变体，不是校验状态。
- 没有空态。按钮总有文字，或者有图标加 `aria-label`。
- `loading` 固定把指示器放在 `.button__label` 之前，没有自定义加载文案或把指示器放到末尾的入口。
- `state` 只覆盖 `hover`、`active` 与 `focus`。禁用样例用真实的 `disabled` 属性产生，不用静态类。
- 组件有意忽略 `icon` 元素上的 `size`：图标尺寸按档位统一给。
