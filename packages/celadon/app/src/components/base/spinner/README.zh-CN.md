# components/base/spinner

`components/base/spinner` 是加载指示器。它用两瓣互成 180° 的四分之一弧画出一个有方向的圆，一周时长取
`--duration-loop`，并尊重 `prefers-reduced-motion`：偏好减少动效时直接停住。

按钮与输入框的加载态用它，页面里的等待区也可以用它。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `spinner.tsx` | `Spinner` 组件，无属性。 |
| `spinner.less` | 尺寸、颜色与旋转动画；减少动效时停住。 |
| `spinner.test.tsx` | 单元用例。 |
| `index.ts` | 对外出口。 |

## 属性

`Spinner` 不接收属性。尺寸与颜色由父级给：它取 `--spacing-16` 见方、颜色随 `currentColor`，
需要别的尺寸时用外层容器或 `--spinner-duration` 覆盖时长。

## 使用方式

```tsx
<Button loading>{t('auth.action.login')}</Button>
```

## 无障碍

- 指示器本身对读屏隐藏；加载中这件事由承载它的控件表达，例如按钮上的 `aria-busy="true"`。

## 验证方式

单元用例与组件同目录：`spinner.test.tsx`。

## 已知限制

- 只有一种形状；进度百分比类指示器用到处再加。
