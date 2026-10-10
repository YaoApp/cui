# components/base/tooltip

`components/base/tooltip` 是文字提示。行为交给上游的 `@base-ui/react` 的 Tooltip：悬停延时、焦点跟随、`Esc` 关闭都由它负责；
本组件只把提示画出来，视觉取自 token。

用在只有图标、没有可见文字的地方，例如导航列的收起键、折叠态的展开键、标签的关闭键。有可见文字的操作不需要提示。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `tooltip.tsx` | `Tooltip` 组件与 `TooltipProps`。 |
| `tooltip.less` | 浮层的底、字色、圆角、内距与层级（`--z-overlay`）。 |
| `tooltip.test.tsx` | 单元用例，钉住触发元素这一侧。 |
| `index.ts` | 对外出口。 |

## 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | 无 | 提示文字，调用方从语言包取。 |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'` | 提示相对触发元素的方向。 |
| `children` | `ReactElement` | 无 | 触发提示的元素，必须能接收 props（按钮、图标按钮、链接）。 |

## 使用方式

```tsx
<Tooltip label={t('shell.navigation.action.collapse')} side="bottom">
  <Button iconOnly aria-label={t('shell.navigation.action.collapse')} onClick={onToggle}>
    <Icon name="i-collapse" size={16} />
  </Button>
</Tooltip>
```

## 无障碍

- 触发元素自己的可访问名不被提示顶掉，提示文案与 `aria-label` 各管一件事。
- 键盘聚焦触发元素同样会显示提示。

## 验证方式

- 单元用例与组件同目录：`tooltip.test.tsx`（jsdom 里量不出浮层，因此只钉触发元素这一侧）。
- 浮层本身在真实浏览器里验：`app/src/features/inbox/tests/layout.browser.ts` 通过提示定位收起键与标签操作。

## 已知限制

- 提示里只能是纯文字，不支持富内容与自定义位置策略。
