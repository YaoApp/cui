# components/base/scroll-area

`components/base/scroll-area` 是滚动容器。滚动行为与溢出状态交给上游的 `@base-ui/react` 的 ScrollArea：
视口上用 `data-overflow-y-start` 与 `data-overflow-y-end` 暴露"哪一侧还有内容"，本组件据此画边缘阴影。

三栏各自的滚动都用它：导航列的上区与「当前」区、内容区、标签浏览器的标签条与页面。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `scroll-area.tsx` | `ScrollArea` 组件与 `ScrollAreaProps`。 |
| `scroll-area.less` | 视口、滚动条与边缘阴影；阴影只在真的还有内容时出现。 |
| `scroll-area.test.tsx` | 单元用例。 |
| `index.ts` | 对外出口。 |

## 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `children` | `ReactNode` | 无 | 可滚动的内容。 |
| `className` | `string` | 无 | 追加到根元素，用于给调用方自己的布局。 |

## 使用方式

```tsx
<ScrollArea className="nav__scroll">
  <NavList items={items} label={label} onSelect={onSelect} />
</ScrollArea>
```

容器自己会撑满父级剩余高度，因此父级要是弹性列并带 `min-block-size: 0`；调用方不需要再给高度。

## 状态

| 状态 | 表达方式 |
| --- | --- |
| 缺省 | 滚动条不可见，两侧都没有阴影。 |
| 溢出 | 还有内容的一侧出现渐隐阴影，上边与下边各自判定。 |
| 悬停 | 滚动条淡入，滑块取 `--border-control`。 |
| 滚动中 | 滚动条保持可见。 |

## 验证方式

单元用例与组件同目录：`scroll-area.test.tsx`。

## 已知限制

- 只画竖向滚动条；横向滚动交给内容自己处理。
