# components/base/dialog

`components/base/dialog` 是弹层页面：把一页内容放进浮层里。它基于上游的 `@base-ui/react` 的 Dialog，
焦点陷阱、`Esc` 关闭、点遮罩关闭与滚动锁定都由上游负责；本组件给两档宽度与一套头部与底部的结构。

按 `design/main-shell.md` §六，导航入口在这类浮层里呈现（大弹窗形态），会话里的引用则在第三栏开一页。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `dialog.tsx` | `DialogPage` 组件、`DialogProps`、`DialogSize` 与 `DialogOpenType`，并再导出上游的部件。 |
| `dialog.less` | 两档宽度、高度上限、头部、正文与底部的布局。 |
| `dialog.test.tsx` | 单元用例：打开与关闭、尺寸档、焦点与关闭键。 |
| `index.ts` | 对外出口：`DialogPage` 与 `DialogParts`。 |

## 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `open` | `boolean` | 无 | 是否打开。受控。 |
| `onOpenChange` | `(open: boolean) => void` | 无 | 打开状态变化。 |
| `onOpenChangeComplete` | `(open: boolean) => void` | 无 | 过渡结束后回调，适合在关闭动画后清理。 |
| `title` | `ReactNode` | 无 | 标题。 |
| `description` | `ReactNode` | 无 | 说明文字。 |
| `closeLabel` | `string` | 无 | 关闭键的无障碍名，调用方从语言包取。 |
| `footer` | `ReactNode` | 无 | 底部操作区。 |
| `size` | `'form' \| 'page'` | `'form'` | 宽度档：表单档 480，页面档取内容区可读上限。 |
| `disablePointerDismissal` | `boolean` | `false` | 为真时点遮罩不关闭，用于不能误关的流程。 |
| `initialFocus` | `boolean \| RefObject \| ((openType) => …)` | 无 | 打开后焦点落点；人机验证这类第三方控件要显式不动焦点。 |
| `className` | `string` | 无 | 追加类名。 |
| `children` | `ReactNode` | 无 | 浮层正文。 |

## 使用方式

```tsx
<DialogPage
  open={open}
  onOpenChange={setOpen}
  title={t('auth.captcha.title')}
  closeLabel={t('modal.close')}
  size="form"
  footer={<Button onClick={submit}>{t('auth.action.confirm')}</Button>}
>
  <CaptchaField … />
</DialogPage>
```

## 无障碍

- 标题与说明接到上游的 `aria-labelledby` 与 `aria-describedby` 上；关闭键必须给 `aria-label`。
- `initialFocus` 默认按内容定：有输入控件时进输入框，第三方控件不动焦点。

## 验证方式

单元用例与组件同目录：`dialog.test.tsx`。

## 已知限制

- 宽度只有两档（480 与内容区可读上限）。`design/main-shell.md` §六 写的 880 × 620 还没有对应的档位。
