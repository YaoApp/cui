# components/base/input

`components/base/input` 是产品里的文本字段。它组合 Base UI 的 Field 与 Input，因此标签关联、受控值、
禁用与表单参与都保持原生行为；外观上，它在 `.input` 控件外面套一层 `.field` 字段框。用户名、邮箱、
密码与数字输入都用它，靠 `type` 与调用方的校验规则区分。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `input.tsx` | `Input` 组件与 `InputProps`。 |
| `input.less` | `.field` 字段框与其槽位、`.input` 控件的七态与三个尺寸档，以及 `.hint-error` 错误文字。 |
| `input.test.tsx` | 单元用例，覆盖标签与消息关联、回调、禁用、抖动触发、尺寸类、槽位与静态态。 |
| `index.ts` | 模块对外的出口，即 `Input` 与 `InputProps`。 |

## 结构与类名

控件是真实的 `<input>`，带 `.input` 类，因此设计规则作用在控件本身而不是外框上。外框是 `.field`，
其中可以有 `.field__label`，有容纳图标槽、控件与尾部槽位的 `.field__box`，以及始终存在的
`.field__message`，它在有提示或错误时分别装入两者。

| 部位 | 类名 | 说明 |
| --- | --- | --- |
| 外框 | `.field` | `Field.Root`；承载调用方传入的 `className` 与 `disabled` / `invalid` 状态。 |
| 标签 | `.field__label` | `Field.Label`，带 `htmlFor={id}`；只有给了 `label` 才渲染。 |
| 字段框 | `.field__box` | 给了 `error` 时追加 `is-error`。 |
| 图标槽 | `.field__icon` | `aria-hidden="true"`；只有给了 `icon` 才渲染。 |
| 控件 | `.input` | 追加 `input--small` / `input--large`、`is-error`、`is-<state>` 与 `is-shake`。 |
| 尾部槽 | `.field__trail` | `state="loading"` 且没有 `trailing` 时放 `.spinner`，否则放调用方的 `trailing`。 |
| 消息 | `.field__message` → `.field__hint`、`.hint-error` | 消息容器始终渲染，没有提示也没有错误时为空。 |

## 属性

`InputProps` 继承 `Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>`。原生 `size` 属性被排除，因为本组件的
`size` 是尺寸档，含义不同。`value`、`onChange`、`type`、`placeholder`、`disabled`、`readOnly` 等原样透传。
组件自有的属性如下：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 必给 | 标签的 `htmlFor`、提示 id `{id}-hint` 与错误 id `{id}-error` 都由它拼出。 |
| `label` | `string` | 无 | 字段标签。 |
| `hint` | `string` | 无 | 字段下方的提示，经 `aria-describedby` 关联。 |
| `error` | `string` | 无 | 字段下方的错误文字，经 `aria-describedby` 关联；同时给字段框与控件加上 `is-error`。 |
| `icon` | `ReactNode` | 无 | 左侧槽位，按装饰渲染。 |
| `trailing` | `ReactNode` | 无 | 右侧槽位，例如密码的可见性切换。 |
| `className` | `string` | 无 | 追加到 `.field` 上的类。 |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 控件高度 24 / 32 / 40，与按钮、选择器触发器、复选框同梯。 |
| `state` | `'hover' \| 'focus' \| 'error' \| 'loading'` | 无 | 静态态类，供并排展示。真实交互仍由 CSS 伪类驱动。 |
| `shake` | `boolean \| number` | 无 | 一次性错误抖动。传计数器时每次变化都重播，调用方不必复位布尔值。 |
| `strong` | `boolean` | `false` | 控件边界取达标档 `--border-control-strong`，默认档更浅。入口类页面（登录、注册、服务器选择）用这一档：实测浅色 3.45:1、暗色 3.74:1，都在控件边界要求的 3:1 之上。 |

## 状态

| 状态 | 表达方式 |
| --- | --- |
| 默认 | `--background-field`、`--border-control` 与 `--text-primary`。 |
| 悬停 | 边框取 `--border-hover`，由 `:hover` 或 `.is-hover` 触发。 |
| 聚焦 | 边框取 `--brand`，加 1px `--brand` 描边，底色取 `--background-field-focus`，由 `:focus` 或 `.is-focus` 触发。 |
| 禁用 | 真实的 `disabled` 属性；取 `--background-disabled`、`--text-disabled` 与 `--border-disabled`，指针为 `not-allowed`。 |
| 错误 | 边框取 `--danger`，聚焦描边取 `--danger`，控件与字段框带 `is-error`，文字为 `.hint-error` 的 `--danger-ink`。悬停与聚焦都不改变危险描边。 |
| 加载 | `aria-busy="true"`、`cursor: progress`，右侧槽位放 `.spinner`。底色、文字色与裁剪都不变。 |
| 空 | 原生 `placeholder`，颜色取 `--text-placeholder`；清单页另有值为空的样例。 |
| 只读 | 原生 `read-only` 属性，底色取 `--background-readonly`，文字取 `--text-secondary`。 |
| 抖动 | `.is-shake` 播放一次横向位移。默认不播，只有调用方传入 `shake` 才播。 |

错误是持续状态：只要错误文字还在，悬停与聚焦都保持危险描边，聚焦描边也取危险色而不是品牌色。

## 尺寸

| 档位 | 高度 | 行高 | 字号 | 圆角 | 行内内距 |
| --- | --- | --- | --- | --- | --- |
| `small` | 24 | 20 | 12 | `--radius-small` | 8 |
| `medium` | 32 | 24 | 14 | `--radius-medium` | 8 |
| `large` | 40 | 24 | 16 | `--radius-large` | 12 |

三档高度 24 / 32 / 40 由浏览器用例实测，行高 20 / 24 / 24 来自控件行高 token。整高由
`min-block-size` 定、块向内距归零，
行高取整数的控件行高，文字盒因此不会落在小数位置。圆角照规矩取与档位同名的 token。有图标槽或尾部槽时，
控件在那一侧让出 `--spacing-32` 的行内内距，文字不会压到槽位上。

左图标槽的位置与尺寸由组件定，不由调用方定：三档图标同取 16（图标画在 24 网格上），槽位是边长等于
图标的方盒，距字段框左边的距离等于图标的上下留白，也就是「档位高度减图标高度」的一半，
三档是 4 · 8 · 12；图标与文字之间另留 6。槽位里的图形（SVG 的固有尺寸或 `<img>` 的原始宽度）
一律归一到 16。三档与七个状态实测：图标 16×16，左边距与上下留白都是 4 / 8 / 12，图标中心与框中心
相差 0，文字起点在框左 27 · 31 · 35（1px 边框加左边距、图标与 6 的间距）。调用方传的 `size`
只影响自身，不会让图标在三档之间变化。

## 无障碍

- `id` 必给。标签用 `htmlFor={id}` 关联，控件收到 `aria-describedby="<id>-hint <id>-error"`，两者都存在时
  提示在前，只有存在的那些才写进去。
- 错误来自服务端而不是浏览器原生校验，因此 `Field.Error` 用 `match={Boolean(error)}` 渲染。
- 图标槽是 `aria-hidden="true"`，加载指示器是装饰；忙碌状态由控件上的 `aria-busy="true"` 表达。
- `disabled` 与 `readOnly` 直接传给原生控件。
- `state` 只用于静态展示，不改变焦点与取值。

## 类与 token

`.field` 与 `.input` 定义在 `input/input.less`。颜色、间距、圆角、字号与行高一律取 token，例如
`--background-field`、`--background-field-focus`、`--background-readonly`、`--background-disabled`、
`--border-control`、`--border-hover`、`--brand`、`--danger`、`--danger-ink`、`--text-primary`、
`--text-secondary`、`--text-tertiary`、`--text-placeholder`、`--text-disabled` 与 `--focus-ring`。加载圆环复用
共享的 `.spinner`。数字输入的原生步进器由浏览器绘制、不随主题，已整体去掉外观。达标边界
`--border-control-strong` 在系统要求更高对比度时由 token 自动切换。

## 使用方式

```tsx
import { Input } from '@/components/base'

<Input
  id="account"
  label="账号"
  hint="用邮箱登录"
  error={error}
  value={account}
  onChange={(event) => setAccount(event.target.value)}
  shake={attempt}
/>
```

清单页在 `app/src/features/scaffold/base/base.tsx` 里按属性、状态、消息、类型与尺寸五组列出样例，
页面路由是 `/app/scaffold/base`。

## 验证方式

```bash
pnpm lint        # stylelint、eslint 与 tsc
pnpm check       # token、i18n 与约定检查器
pnpm test        # 单元测试，含 input.test.tsx
pnpm build       # 生产构建
pnpm exec playwright test app/src/features/scaffold/base/tests/   # 清单页的浏览器用例
```

浏览器用例实测三档高度 24 / 32 / 40、七个状态样例、提示与错误的关联及两者到字段框下沿的一致间距、
加载圆环，以及加载字段不变的绘制。

## 已知限制

- 没有 `variant` 属性。纯文字档与反色档的类定义在 `input.less` 里，但 `Input` 组件不暴露它们。
- 强边界档由 `strong` 显式开启；系统要求更高对比度时，`tokens.less` 的媒体查询会在它之上再抬一档。
- 消息容器始终渲染但不预留一行。带消息与不带消息的字段分到不同子组，而不是用空占位对齐。
- `label`、`hint` 与 `error` 都是字符串，组件不接受节点。
- `shake` 只负责播放动画，判断取值是否非法属于调用方。
