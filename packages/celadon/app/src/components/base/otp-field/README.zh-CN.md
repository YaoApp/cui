# `components/base/otp-field`

一次性口令字段：口令拆成一位一个正方形格子。它是**多控件**字段，所以不套单控件的 `Field`，
而是自己按同一套 `.field*` 类搭字段结构，与文本输入框的观感因此一致。

## 目录内容

| 路径 | 作用 |
| --- | --- |
| `otp-field.tsx` | 组件、属性，以及键盘、粘贴与焦点的规则。 |
| `otp-field.less` | 格子：底、描边、圆角、聚焦环、错误、禁用与只读。 |
| `otp-field.test.tsx` | 单元用例：填值、完成回调、键盘、粘贴、只收数字、状态、尺寸。 |
| `index.ts` | 再导出组件与属性类型。 |

## 结构与类名

```
.field                                   字段列（标签 · 格子 · 消息）
├── label.field__label                   指向第一格
├── .otp-field.otp-field--{size}
│   └── .otp-field__cells[role=group]    由标签命名，带 aria-required
│       └── input.otp-field__cell  × N   一位一个格子
├── input[type=hidden][name]             只有给了 `name` 才渲染
└── .field__message
    ├── p.field__hint
    └── p.hint-error
```

## 属性

| 属性 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `id` | `string` | 必填 | 第一格的 id；标签与错误都按它关联，其余格按 `${id}-2` 派生。 |
| `value` | `string` | 必填 | 当前口令：只有数字，从左往右连续。 |
| `onValueChange` | `(value: string) => void` | 必填 | 每次被接受的变化都回调。 |
| `onComplete` | `(value: string) => void` | – | 填满最后一格的那一次回调一次。 |
| `label` | `string` | – | 可见标签，同时是这一组的可访问名。 |
| `hint` | `string` | – | 显示在格子下方。 |
| `error` | `string` | – | 调用方的校验错误；格子转为错误态并显示文案。 |
| `disabled` | `boolean` | `false` | 锁住每一格。 |
| `readOnly` | `boolean` | `false` | 口令可读不可改。 |
| `required` | `boolean` | `false` | 给这一组加 `aria-required`；原生校验交给调用方与隐藏字段。 |
| `name` | `string` | – | 渲染一个隐藏输入承载整段口令，供原生表单提交。 |
| `length` | `number` | `6` | 格子数。 |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸档，与输入框同梯：24 / 32 / 40。 |
| `className` | `string` | – | 追加到字段列上的类。 |
| `autoComplete` | `string` | `'one-time-code'` | 只给第一格，让浏览器能自动填口令。 |
| `cellLabel` | `(index: number) => string` | – | 每一格的可访问名；不传时退回「标签 + 序号」。四语由调用方给。 |
| `state` | `'hover' \| 'focus'` | – | 静态态，供并排样例用；真实交互仍由伪类驱动。 |

## 行为

值是**从左往右连续**的数字，格子只是它的视图，因此不会出现空洞。输入数字是接着往后填，或替换该位已有的数字。
第一格带 `id`；点右侧空格子会把光标拉回第一格空位，口令因此始终保持连续。

| 按键或操作 | 结果 |
| --- | --- |
| 数字 | 接受，光标移到下一格。 |
| 字母等非数字 | 忽略，该格原有数字保留。 |
| `Backspace` / `Delete` | 清掉本格及其右侧，光标退到上一格。 |
| `ArrowLeft` / `ArrowRight` | 移动光标。 |
| `Home` / `End` | 第一格，或第一格空位。 |
| 粘贴整段口令 | 从当前格铺开，非数字字符丢弃。 |
| 自动填充（一次给多位） | 按粘贴处理。 |

`onComplete` 只在填满最后一格的那一次触发，调用方不必盯着每一次按键。格子只收数字，口令长度由 `length` 固定。

## 尺寸与实测值

格子逐档与输入框对齐，这正是这条梯子的意义。清单页里与同档输入框并排实测：

| 档位 | 格子 | 输入框高 | 字号 | 行高 |
| --- | --- | --- | --- | --- |
| `small` | 24 × 24 | 24 | 12 | 20 |
| `medium` | 32 × 32 | 32 | 14 | 24 |
| `large` | 40 × 40 | 40 | 16 | 24 |

格子是正方形（边长取该档控件高度），横向排列，间距 `--spacing-8`。圆角按档位取同名 token
（`--radius-small` / `--radius-medium` / `--radius-large`）。

## 状态

| 状态 | 表现 |
| --- | --- |
| 默认 | 字段底、控件描边、主文字色。 |
| 悬停 | 指针所在格子的描边换 `--border-hover`。 |
| 聚焦（键盘或点击） | 品牌色描边加同色环，底提到聚焦底；格内内容被选中，输入即替换。 |
| 错误 | 每一格都是危险色描边，聚焦时环也是危险色，格子下方显示文案；悬停与聚焦都不改描边色。 |
| 只读 | 只读底与次文字色。 |
| 禁用 | 禁用底与描边、禁用文字色，指针为 `not-allowed`。 |
| 空 | 与默认相同，只是还没填。 |
| 加载 | 不提供：口令输入本身不加载，用它的提交按钮承担进行中状态。 |

## 无障碍

格子放在 `role="group"` 里，由可见标签经 `aria-labelledby` 命名；提示与错误用 `aria-describedby` 关联，
错误还会给每格加 `aria-invalid`。每格有自己的可访问名（调用方的 `cellLabel`，或「标签 + 序号」），
读屏会念出这是第几位。`inputMode="numeric"` 唤起数字键盘，第一格向系统请求 `one-time-code` 自动填充。

## 类与 token

| 位置 | 内容 |
| --- | --- |
| `.otp-field__cell` | `--background-field` · `--border-control` · `--text-primary`，行高与字号按档取控件 token。 |
| 聚焦 | 描边与环用 `--brand`，底用 `--background-field-focus`。 |
| 错误 | 描边与环用 `--danger`。 |
| 禁用 / 只读 | `--background-disabled` · `--border-disabled` · `--text-disabled`；只读用 `--background-readonly` · `--text-secondary`。 |
| 间距 | 格间 `--spacing-8`；边长取 `--spacing-24` / `--spacing-32` / `calc(--spacing-32 + --spacing-8)`。 |

## 用法

```tsx
const [code, setCode] = useState('')
const [otpId, setOtpId] = useState('')

<OtpField
  id="verification-code"
  value={code}
  onValueChange={setCode}
  onComplete={(value) => verify(value, otpId)}
  label={t('auth.code.label')}
  hint={t('auth.code.hint')}
  error={error}
  name="verification_code"
  cellLabel={(index) => t('auth.code.cell', { index: index + 1 })}
/>
```

值、错误与文案归调用方；格子与输入规则归组件。

## 验证方式

- `otp-field.test.tsx`：一位一格、标签关联、键盘次序、退格、粘贴、字母被忽略、完成回调只触发一次、
  错误与状态类名、禁用与只读、隐藏字段。
- `base.browser.ts`：三档格子边长与高度分别对同档输入框 24 / 32 / 40 且字号一致；逐位输入六位；
  敲字母被忽略；整段粘贴；隐藏字段带值；错误样例、禁用样例与只读样例。

## 已知限制

- 只收数字。要收字母数字混合口令需要换过滤规则，格子也要加宽。
- `required` 用 `aria-required` 表达在整组上；原生表单校验由调用方通过 `name` 给的隐藏字段完成。
