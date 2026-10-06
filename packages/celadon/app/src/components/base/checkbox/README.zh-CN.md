# components/base/checkbox

`components/base/checkbox` 是产品里的独立勾选项。它包装 Base UI 的 Checkbox，渲染一个隐藏的原生
`<input type="checkbox">`，可见的方框、勾与横杠都是装饰。条款确认、逐项选择，以及需要不确定态的
全选控件都用它。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `checkbox.tsx` | `Checkbox` 组件与 `CheckboxProps`。 |
| `checkbox.less` | 自包含的 `.checkbox*` 类：方框、勾与横杠、标签、悬停表面、各状态与三个尺寸档。 |
| `checkbox.test.tsx` | 单元用例，覆盖标签关联、回调、键盘、选中与不确定态、禁用、只读、消息、尺寸、标记与无标签情况。 |
| `index.ts` | 模块对外的出口，即 `Checkbox` 与 `CheckboxProps`。 |

## 结构与类名

| 部位 | 类名 | 说明 |
| --- | --- | --- |
| 字段 | `.checkbox` | 追加 `checkbox--small` / `checkbox--large`；有 `error` 时加 `is-error`，静态态加 `is-<state>`。静态态挂在这里，因为悬停表面画在整行上。 |
| 行 | `.checkbox__row` | 容纳方框、标签与悬停表面。 |
| 方框 | `.checkbox__box` | Base UI 的根节点，内部是隐藏的原生勾选框与 `.checkbox__mark` 标记。选中暴露 `data-checked`，不确定暴露 `data-indeterminate`，禁用暴露 `data-disabled`，只读暴露 `data-readonly`。 |
| 标记 | `.checkbox__mark` | 方框的指示器，装勾的图标，不确定态装 `.checkbox__dash` 横杠。属装饰。 |
| 标签 | `.checkbox__label` | `id="{id}-label"` 与 `htmlFor={id}`；只有给了 `label` 才渲染。 |
| 消息 | `.checkbox__message` → `.checkbox__hint`、`.checkbox__error` | 只有给了 `hint` 或 `error` 才渲染。 |

## 属性

`CheckboxProps` 不继承原生输入属性，组件自有的属性如下：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 必给 | 标签 id `{id}-label` 与消息 id `{id}-hint`、`{id}-error` 都由它拼出。 |
| `label` | `ReactNode` | 无 | 点标签等于点控件。 |
| `hint` | `ReactNode` | 无 | 字段下方的提示，经 `aria-describedby` 关联。 |
| `error` | `ReactNode` | 无 | 字段下方的错误文字，经 `aria-describedby` 关联；字段同时带上 `is-error`。 |
| `checked` | `boolean` | 无 | 受控值。 |
| `defaultChecked` | `boolean` | 无 | 非受控时的初始值。 |
| `onCheckedChange` | `(checked: boolean) => void` | 无 | 回传新值。 |
| `indeterminate` | `boolean` | 无 | 不确定态，标记换成横杠。 |
| `disabled` | `boolean` | 无 | 阻断交互。 |
| `readOnly` | `boolean` | 无 | 可聚焦、可读取，但交互不改变取值。 |
| `required` | `boolean` | 无 | 表单校验。 |
| `name` | `string` | 无 | 表单字段名。 |
| `value` | `string` | 无 | 选中时提交的表单值。 |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 方框 12 / 16 / 20、行高 24 / 32 / 40，与按钮、输入框、选择器触发器同梯。 |
| `state` | `'hover' \| 'focus' \| 'error' \| 'loading'` | 无 | 静态态类，挂在整行容器上供并排展示。 |
| `className` | `string` | 无 | 追加到 `.checkbox` 上的类。 |

## 状态

| 状态 | 表达方式 |
| --- | --- |
| 未选中 | 不填底；边界取 `--border-control-strong` 对内容底，浅色实测 3.45:1、暗色 3.74:1。 |
| 选中 | 底与边界取 `--background-inverse`，标记取 `--text-inverse`。选中色有意不用品牌色。 |
| 不确定 | 绘制与选中相同，勾换成 `.checkbox__dash` 横杠。 |
| 悬停 | 整行铺一层 `--background-hover` 表面，画在 `.checkbox__row::before` 上；标签提到 `--text-primary`；方框本身不变。表面向行内两侧让 `--spacing-8`、向块向上下让 `--spacing-4`，因此不贴内容。 |
| 聚焦 | `box-shadow: var(--focus-ring)`，选中态取 `--focus-ring-inverse`；只由 `:focus-visible` 触发，鼠标点击不留环。 |
| 禁用 | `aria-disabled="true"`、`data-disabled` 与 `tabindex="-1"`；禁用底、禁用字与禁用边界，指针为 `not-allowed`。 |
| 只读 | `aria-readonly="true"`；可聚焦、可读取，但悬停表面、边界与标签颜色都保持静止档。 |
| 错误 | 字段带 `is-error`，边界取 `--danger`，另有 `.checkbox__error` 文字。方框的底不变。 |
| 加载 | `state="loading"`、`aria-busy="true"`，方框指针为 `progress`。 |

悬停与聚焦是频繁重复的微交互，不做过渡：方框与标签的 `transition-duration` 实测均为 `0s`。只有勾与横杠
有一次进场，属动效规范的 `fade` 场景，时长 0.2 秒、减速缓动。错误由调用方持有的持续状态，组件负责把红边与
消息画出来，何时解除由调用方决定。

## 尺寸

| 档位 | 方框 | 行最小高 | 标签最小高 | 字号 |
| --- | --- | --- | --- | --- |
| `small` | 12 | 24 | 24 | 12 |
| `medium` | 16 | 32 | 32 | 14 |
| `large` | 20 | 40 | 40 | 16 |

方框 12 / 16 / 20 与行高 24 / 32 / 40 由浏览器用例实测，标签高度与字号一并量到。方框圆角取
`--radius-xs`，不跟尺寸档走。勾取图标梯，中档 14、大档 16；小档让标记铺满 12 的方框，因为图标梯最小的一档
比方框还大。横杠宽 8，高为两倍边框宽。标签折行时文字落在方框下方，方框与首行对齐，不取整块居中。

## 无障碍

- `id` 必给，它落在隐藏的原生勾选框上，方框带 `aria-labelledby="{id}-label"`。标签元素必须带这个 id，
  组件已经带上，否则控件念不出名字。
- 标签同时带 `htmlFor={id}`，点标签等于点控件。
- 禁用是 `aria-disabled="true"` 加 `data-disabled` 加 `tabindex="-1"`，不是原生 `disabled` 属性。
- 只读是 `aria-readonly="true"`。
- 不确定态是 `aria-checked="mixed"`。
- 提示与错误经 `aria-describedby` 关联，id 为 `{id}-hint` 与 `{id}-error`。消息容器只在至少有一者时渲染。
- 空格切换聚焦控件，Tab 移动焦点。
- 标记（勾或横杠）属装饰，不进无障碍树。

## 类与 token

类全部自包含在 `.checkbox*` 下，不借输入框的类；两者只共用同一批 token。选中与不确定态取反色族
`--background-inverse` 与 `--text-inverse`，暗色主题因此自动翻成浅底深勾。未选中的边界取
`--border-control-strong`，失败边界取 `--danger`。悬停表面取 `--background-hover`，焦点环取 `--focus-ring`
或 `--focus-ring-inverse`，禁用态取 `--background-disabled`、`--text-disabled` 与 `--border-disabled`。
悬停表面画在行的 `::before` 伪元素上，因此方框与标签不动，组件也不加外边距。

## 使用方式

```tsx
import { Checkbox } from '@/components/base'

<Checkbox id="updates" label="接收更新通知" checked={updatesOn} onCheckedChange={setUpdatesOn} />
```

清单页在 `app/src/features/scaffold/base/base.tsx` 里按属性、状态与尺寸三组列出样例，页面路由是
`/app/scaffold/base`。

## 验证方式

```bash
pnpm lint        # stylelint、eslint 与 tsc
pnpm check       # token、i18n 与约定检查器
pnpm test        # 单元测试，含 checkbox.test.tsx
pnpm build       # 生产构建
pnpm exec playwright test app/src/features/scaffold/base/tests/   # 清单页的浏览器用例
```

浏览器用例对浅暗两套各量一次：未选中边界对内容底不低于 3:1，选中绘制等于反色 token，不确定态画出横杠，
悬停表面取悬停底而方框前后完全一致，只读行没有悬停，多行时方框与首行对齐，过渡时长为 0s，标记动画是
0.2 秒的 `fade` 场景，三个尺寸档的方框为 12 / 16 / 20、行高为 24 / 32 / 40。

## 已知限制

- 没有 `inverse` 属性。反色族本身就是选中色，因此没有单独的反色形态。
- 没有图标槽。标记固定是勾，不确定态是横杠。
- 错误是节点，组件只负责把它画出来。用户改选之后清除错误属于调用方。
- `state` 的 `hover`、`focus`、`error`、`loading` 只用于静态展示。选中、不确定、禁用与只读都走真实属性。
- 本组件只是勾选框，不是单选组，也不是开关。
