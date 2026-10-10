# components/base/turnstile-field

`components/base/turnstile-field` 是人机验证控件，接 Cloudflare Turnstile。它把脚本加载、挂载与令牌回传收在一处，
调用方只拿令牌，不碰脚本与全局对象。

用在需要人机验证的入口表单上。图形验证码另有 `components/base/captcha-field`。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `turnstile-field.tsx` | `TurnstileField` 组件与 `TurnstileFieldProps`。 |
| `turnstile-field.less` | 控件区、错误态与占位。 |
| `turnstile-field.test.tsx` | 单元用例：脚本加载、令牌回传、错误态。 |
| `index.ts` | 对外出口。 |

## 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `sitekey` | `string` | 无 | 站点键，来自入口配置。 |
| `onTokenChange` | `(token: string) => void` | 无 | 拿到令牌时回调；失效或失败时回空串。 |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | 控件主题。 |
| `label` | `string` | 无 | 这一块的无障碍名。 |
| `error` | `string` | 无 | 错误文字，给出时进入错误态。 |
| `className` | `string` | 无 | 追加类名。 |

## 使用方式

```tsx
<TurnstileField
  sitekey={config.turnstileSitekey}
  onTokenChange={setToken}
  label={t('auth.captcha.label')}
  error={captchaError}
/>
```

## 无障碍

- 第三方控件自己带焦点行为；打开弹窗时不要把焦点抢到别处（规则见 `design/layout.md` §6）。

## 验证方式

单元用例与组件同目录：`turnstile-field.test.tsx`。

## 已知限制

- 只支持 Turnstile；换提供方需要另加基础件。
