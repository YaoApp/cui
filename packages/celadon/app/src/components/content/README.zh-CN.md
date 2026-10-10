# components/content

`components/content` 是应用中间的内容区，三栏里的第二栏。它只管最小宽保护与自己这一块的滚动，栏宽由三栏的列轨给；
让位顺序见 `design/foundations.md` F6：第三栏先缩、再整条消失，中栏才可能低于最小。

同一目录下还有一个通用的占位页 `PlaceholderPage`：骨架阶段每一页只画页名与一句说明，业务内容随后接真接口。
它不认识业务，页名由调用方给。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `content.tsx` | `Content` 组件与 `ContentProps`。包一层滚动容器。 |
| `content.less` | 中栏的最小宽、底色、内距与说明文字样式。 |
| `parts/placeholder/` | `PlaceholderPage`：页名加一句说明的占位页。 |
| `index.ts` | 对外出口，即 `Content`、`PlaceholderPage` 与各自的类型。 |

## 属性

`Content`：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `children` | `ReactNode` | 无 | 页面内容，通常是路由的出口。 |

`PlaceholderPage`：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `titleKey` | `I18nKey` | 无 | 页名在语言包里的键。 |

## 使用方式

```tsx
<Content>
  <Outlet />
</Content>
```

```tsx
{ path: 'board', element: <PlaceholderPage titleKey="shell.navigation.item.board" /> }
```

## 无障碍与状态

- 内容区是 `<main>`，一个页面里只有一处。
- 溢出时显示边缘阴影，滚动条只在悬停或滚动时出现（见 `components/base/scroll-area`）。
- 占位页的页名是二级标题，说明文字取二级字色。

## 验证方式

- 单元用例与组件同目录：`content.test.tsx`。
- 浏览器用例：`app/src/features/inbox/tests/layout.browser.ts` 量中栏宽度不小于 400，并核对第三栏收掉后中栏变宽。

## 已知限制

- `design/main-shell.md` §四 的四种内容形态目前只有单块一种；双槽、单区与两栏等用到处再加。
