# components/base/captcha-field

`components/base/captcha-field` 是产品里的图形验证码字段。它在文本字段右侧挂一个取图控件；用户填的字
由调用方持有，当前这张图与它的标识由组件持有，并在每次取回后把标识交给调用方。取图走接口声明
`entryCaptcha`（`GET /user/entry/captcha`，经 `useRequest` 发），组件不拼地址也不带身份。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `captcha-field.tsx` | `CaptchaField` 组件与 `CaptchaFieldProps`。 |
| `captcha-field.less` | `.captcha-field__control` 控件的三种过程、`.captcha-field__picture` 图片与 `.captcha-field__retry` 重试文字。 |
| `captcha-field.test.tsx` | 单元用例，覆盖标签关联、控件的可访问名、值回传、禁用、调用方错误、取图三态与 `captcha_id` 的交接。 |
| `index.ts` | 模块对外的出口，即 `CaptchaField` 与 `CaptchaFieldProps`。 |

## 结构与类名

字段框复用共享的 `Input`，因此标签、提示、错误与尺寸档都来自它。验证码部分是该字段的尾部槽位，槽位按档
定宽，取该档字段高度的三倍，三档依次是 72、96 与 120；输入框的预留同式再加一个间距档（`--spacing-8`），
图片与输入的文字因此各有各的位置。

| 部位 | 类名 | 说明 |
| --- | --- | --- |
| 字段 | `.captcha-field` | `Input` 外面的包裹层，承载调用方传入的 `className`。 |
| 外框 | `.field`、`.field__label`、`.field__box`、`.field__message` | 由 `Input` 渲染；错误与提示经 `aria-describedby` 关联。 |
| 控件 | `.captcha-field__control` | 尾部槽里的原生 `<button type="button">`，`aria-label` 取 `refreshLabel`。 |
| 图片 | `.captcha-field__picture` | `<img>`，`src` 取 `captcha_image`，`alt` 取 `imageAlt`；取回后显示。 |
| 重试 | `.captcha-field__retry` | 取图失败时控件里的文字，点击即重新取图。 |

图片铺满槽宽（`inline-size: 100%`），高按图片自身比例（`block-size: auto`）。后端给的图约 3:1，三档实测
宽乘高为 72 × 24、96 × 32 与 120 × 40，换图不改变字段的几何。

## 属性

`CaptchaFieldProps` 是一组独立的属性，不继承原生输入属性。组件自有的属性如下：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 必给 | 输入框的 id；标签的 `htmlFor`、提示 id `{id}-hint` 与错误 id `{id}-error` 都由它拼出。 |
| `value` | `string` | 必给 | 用户填进输入框的验证码文字。 |
| `onValueChange` | `(value: string) => void` | 必给 | 每次输入都回调。 |
| `onCaptchaIdChange` | `(captchaId: string) => void` | 无 | 每次取图成功后回传新的 `captcha_id`。 |
| `label` | `string` | 无 | 字段标签。 |
| `placeholder` | `string` | 无 | 输入框的占位文字。 |
| `hint` | `string` | 无 | 字段下方的提示，经 `aria-describedby` 关联。 |
| `error` | `string` | 无 | 调用方的错误文字，经 `aria-describedby` 关联。 |
| `disabled` | `boolean` | `false` | 同时禁用输入框与取图控件。 |
| `required` | `boolean` | `false` | 标记输入框必填。 |
| `name` | `string` | 无 | 输入框的表单名。 |
| `autoComplete` | `string` | `'off'` | 输入框的 `autocomplete`；验证码不重复使用，默认关闭。 |
| `size` | `'small' \| 'medium' \| 'large'` | 无 | 传给字段的尺寸档：字段高 24 / 32 / 40，尾部槽宽 72 / 96 / 120。 |
| `strong` | `boolean` | `false` | 透传给输入框：控件边界取达标档 `--border-control-strong`，入口类页面用这一档。 |
| `className` | `string` | 无 | 追加到 `.captcha-field` 上的类。 |
| `refreshLabel` | `string` | 无 | 控件的可访问名，也是取图失败时控件上的文字。四语由调用方给。 |
| `imageAlt` | `string` | 无 | 图片的替代文字。四语由调用方给；给空串时图片按装饰处理。 |

## 过程状态

一张图有三种过程，三者都在同一个控件里表达：

| 过程 | `state.status` | 控件显示 | 字段显示 |
| --- | --- | --- | --- |
| 取图中 | `'loading'` | 共享的 `.spinner`。 | `aria-busy="true"` 与 `cursor: progress`；底色、文字色与裁剪都不变。 |
| 取回 | `'ok'` | `.captcha-field__picture` 图片。 | 无额外内容。 |
| 取图失败 | `'error'` | `.captcha-field__retry` 文字，点击即再取一次。 | 失败文案进入字段的错误位；调用方给了 `error` 时以调用方为准。 |

取图在挂载时跑一次。每次点击控件都再跑一次，每次成功都把新的 `captcha_id` 交给 `onCaptchaIdChange`。

## 尺寸

| 档位 | 字段高度 | 尾部槽宽 | 图片（宽乘高） |
| --- | --- | --- | --- |
| `small` | 24 | 72 | 72 × 24 |
| `medium` | 32 | 96 | 96 × 32 |
| `large` | 40 | 120 | 120 × 40 |

三档高度来自共享的字段梯子，按钮、输入框、选择器触发器与复选框也在这条梯子上。尾部槽宽取该档字段高度的
三倍，输入框的预留为槽宽再加一个间距档（`--spacing-8`）。图片铺满槽宽（`inline-size: 100%`），高按图片
自身比例（`block-size: auto`）。大档的宽度写作 `calc(var(--spacing-32) * 3 + var(--spacing-8) * 3)`，
因为间距梯子上没有 40 这一档，该档的控件高度在仓内写作 32 加 8。

## 无障碍

- `id` 必给。标签用 `htmlFor={id}` 关联，输入框收到 `aria-describedby="<id>-hint <id>-error"`，
  两者都存在时提示在前，只有存在的那些才写进去。
- 控件带 `aria-label={refreshLabel}`，三种过程下都有可访问名。
- 图片的 `alt` 取 `imageAlt`；没有给时为空串，图片按装饰处理。
- 控件是原生 `<button type="button">`，Tab 可达，回车与空格可激活，`type="button"` 使它不提交外层表单。
- 取图进行中，字段带 `aria-busy="true"`；圆环本身是装饰。
- `disabled` 同时传给输入框与控件，禁用后不能刷新。
- 调用方的 `error` 优先于组件自己的失败文案，字段因此不会同时出现两条消息。

## 类与 token

`.captcha-field__control`、`.captcha-field__picture` 与 `.captcha-field__retry` 定义在
`captcha-field.less`。颜色、间距、圆角、字号与行高一律取 token：`--text-secondary`、`--text-disabled`、
`--focus-ring`、`--radius-xs`、`--font-size-caption`、`--line-height-tight`、`--spacing-8`、`--spacing-24`
与 `--spacing-32`。字段框与尺寸档来自 `input/input.less` 里的共享字段类。

## 使用方式

```tsx
import { useState } from 'react'
import { Button, CaptchaField } from '@/components/base'
import { useTranslation } from '@/platform/i18n'

const { t } = useTranslation()
const [captcha, setCaptcha] = useState('')
const [captchaId, setCaptchaId] = useState('')

<form onSubmit={(event) => {
  event.preventDefault()
  // captcha_id 与用户填的字一起提交，字段名用服务端读的名字。
  void verify({ username, captcha, captcha_id: captchaId })
}}>
  <CaptchaField
    id="captcha"
    label={t('login.captcha.label')}
    placeholder={t('login.captcha.placeholder')}
    refreshLabel={t('login.captcha.refresh')}
    imageAlt={t('login.captcha.image')}
    value={captcha}
    onValueChange={setCaptcha}
    onCaptchaIdChange={setCaptchaId}
    error={error}
  />
  <Button type="submit">{t('login.submit')}</Button>
</form>
```

清单页在 `app/src/features/scaffold/base/base.tsx` 里按属性与尺寸两组列出样例，页面路由是
`/app/scaffold/base`。

## 验证方式

```bash
pnpm lint        # stylelint、eslint 与 tsc
pnpm check       # token、i18n 与约定检查器
pnpm test        # 单元测试，含 captcha-field.test.tsx
pnpm build       # 生产构建
pnpm exec playwright test app/src/features/scaffold/base/tests/   # 清单页的浏览器用例
```

单元用例换掉平台出口，因此走的是真的 `send` 路径。清单页取图真实打后端，所以浏览器用例不断言图片
一定出现。

## 已知限制

- `GET /user/entry/captcha` 接受可选的 `captcha_id`，用来取同一张图的下一态。本版没有用它：每次刷新
  一律取新图。
- `refreshLabel` 与 `imageAlt` 都是调用方给的字符串。不给 `refreshLabel` 时控件没有可访问名，不给
  `imageAlt` 时图片按装饰处理。
- `label`、`placeholder`、`hint` 与 `error` 都是字符串，组件不接受节点。
- 传了 `disabled` 时，挂载仍会取一次图。禁用的控件点不动，但第一张图仍会请求。
- 组件只负责报告取图失败并提供重试。验证码填错代表什么、何时解除错误，属于调用方。
- 尾部槽宽是按约 3:1 的图片推算的固定值。后端若改图片比例，图片会跟着变宽高，槽位不会自动跟随。
