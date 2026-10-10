# components/base/drawer

`components/base/drawer` 是从窗口一侧滑入的面板，用在上游的 Dialog 之上并按抽屉排布。它比
`components/base/dialog` 更贴边：适合筛选、详情、设置这类"在旁边看一眼"的内容。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `drawer.tsx` | `Drawer` 组件与 `DrawerProps`。 |
| `drawer.less` | 抽屉的宽度、贴边位置、头部与底部的布局。 |
| `index.ts` | 对外出口。 |

## 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `open` | `boolean` | 无 | 是否打开。受控。 |
| `onOpenChange` | `(open: boolean) => void` | 无 | 打开状态变化。 |
| `title` | `ReactNode` | 无 | 标题。 |
| `closeLabel` | `string` | 无 | 关闭键的无障碍名，调用方从语言包取。 |
| `footer` | `ReactNode` | 无 | 底部操作区。 |
| `side` | `'start' \| 'end'` | `'end'` | 从哪一侧滑入。逻辑方向，镜像语言下自动换边。 |
| `initialFocus` | `boolean \| RefObject` | 无 | 打开后焦点落点。 |
| `className` | `string` | 无 | 追加类名。 |
| `children` | `ReactNode` | 无 | 抽屉正文。 |

## 使用方式

```tsx
<Drawer open={open} onOpenChange={setOpen} title={t('…title')} closeLabel={t('modal.close')}>
  <Filters />
</Drawer>
```

## 无障碍

- 用逻辑方向属性（`inset-inline-start` 一类），镜像语言下自动换边。
- 关闭键必须给 `aria-label`；`Esc` 关闭由上游负责。

## 验证方式

- 宽度与贴边位置按实测核对：抽屉的 `getBoundingClientRect()` 贴在窗口对应一侧。

## 已知限制

- 只有一个面板宽度；需要与内容区同宽的大弹窗用 `components/base/dialog`。
