# components/base/alert-dialog

`components/base/alert-dialog` 是不可误关的确认弹层，用在上游的 AlertDialog 之上。它与
`components/base/dialog` 的差别是：它没有关闭叉，点遮罩不关闭，必须有明确的一次选择。

用在会丢东西或有后果的操作上，例如覆盖、删除、离开未保存的页面。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `alert-dialog.tsx` | `AlertDialog` 组件与 `AlertDialogProps`。 |
| `index.ts` | 对外出口。 |
| `alert-dialog.test.tsx` | 单元用例：只有两个出口、`Esc` 归取消、焦点落点。 |

## 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `open` | `boolean` | 无 | 是否打开。受控。 |
| `onOpenChange` | `(open: boolean) => void` | 无 | 打开状态变化；取消与 `Esc` 都走它。 |
| `title` | `ReactNode` | 无 | 标题，与 `role="alertdialog"` 关联。 |
| `description` | `ReactNode` | 无 | 正文：说清后果与不可撤回之处。 |
| `confirm` | `ReactNode` | 无 | 主操作的文案；按钮由弹窗自带。 |
| `cancel` | `ReactNode` | 无 | 次操作的文案；按钮由弹窗自带。 |
| `onConfirm` | `() => void` | 无 | 选主操作时执行；默认随后关闭并把焦点还回去。 |
| `onCancel` | `() => void` | 无 | 选次操作时执行；不传则只关闭。 |
| `closeOnConfirm` | `boolean` | `true` | 主操作后是否立即关闭；异步动作传 `false`，结果回来再关。 |
| `confirmDisabled` | `boolean` | `false` | 主操作置灰，用于动作进行中。 |
| `cancelDisabled` | `boolean` | `false` | 次操作置灰，用于异步动作进行中。 |
| `className` | `string` | 无 | 追加类名。 |
| `children` | `ReactNode` | 无 | 需要额外展示的内容。 |

## 使用方式

```tsx
<AlertDialog
  open={open}
  onOpenChange={setOpen}
  title={t('…title')}
  description={t('…description')}
  confirm={t('auth.action.confirm')}
  cancel={t('auth.action.cancel')}
  onConfirm={confirm}
/>
```

## 无障碍

- 上游给 `role="alertdialog"`；标题与正文接到 `aria-labelledby` 与 `aria-describedby`。
- 打开后焦点进主操作或正文，`Esc` 等同取消。

## 验证方式

单元用例与组件同目录：`alert-dialog.test.tsx`。

## 已知限制

- 只有标题、正文与两个出口；需要表单或更多分支时用 `components/base/dialog`。
