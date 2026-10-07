# `components/theme-toggle`

一个图标按钮，在浅色与深色主题之间切换。它属于平台控件而不是基础件：主题由调用方解析与持久化，
组件只读当前生效的主题，并报出「下一步该切到哪一档」。形态照登录原型的工具条：纯文字档的图标按钮，
图标本身说明点击后的结果。

## 目录内容

| 路径 | 作用 |
| --- | --- |
| `theme-toggle.tsx` | 组件与属性定义。 |
| `theme-toggle.test.tsx` | 单元用例：图标反转、可访问名、点击目标、尺寸档。 |
| `index.ts` | 再导出组件与属性类型。 |

## 结构与类名

```
.button.button--{size}.button--plain.button--icon.theme-toggle
└── svg.icon            月亮或太阳
```

`.theme-toggle` 是组件自己唯一的类；观感来自按钮的纯文字档，所以组件没有自己的样式表。

## 属性

| 属性 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `theme` | `'light' \| 'dark'` | 必填 | 当前生效的主题。 |
| `onSelect` | `(theme: Theme) => void` | 必填 | 点击时收到相反的那一档。 |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 方形档位，24 / 32 / 40。 |

组件不接受 `className`，也不接受子元素：一个图标按钮只做一件事。

## 行为

图标是**反转**的：显示的是点击之后会变成的那一档，而不是当前这一档。浅色主题下画月亮，深色主题下画太阳。
清单页实测：主题 `light` 时图标 `#i-moon`，点击后主题变 `dark`、图标变 `#i-sun`。

可访问名同样说的是动作，读屏会把按下去会发生什么念出来。两条文案在共用语言包里
（`themeToggle.switchToLight` 与 `themeToggle.switchToDark`，即「切换到浅色」与「切换到深色」），
不放在本目录，因为首页、总览与脚手架三处都在用它。

## 尺寸与实测值

| 档位 | 按钮盒 | 图标 |
| --- | --- | --- |
| `small` | 24 × 24 | 16 |
| `medium` | 32 × 32 | 16 |
| `large` | 40 × 40 | 20 |

图标与别处一样按自己的尺寸档走，不跟字号。按钮是正方形，边长由 `iconOnly` 给、横向内距归零；
调用方必须给 `aria-label`，本组件总是给。

## 状态

| 状态 | 表现 |
| --- | --- |
| 默认 | 无底无框，图标取次文字色。 |
| 悬停 | 底换 `--background-hover`，图标取主文字色。 |
| 焦点（键盘） | 按钮外画 `--focus-ring`；指针点击不画环。 |
| 禁用 | 不提供：不能切主题的调用方不渲染这个按钮。 |
| 加载 | 不提供。 |

## 无障碍

按钮是原生 `<button>`，`aria-label` 写的是动作，因此不需要 `aria-pressed`，也不需要提示气泡。
键盘可达，且只有键盘聚焦时画环。`iconOnly` 只用于样式标记「这是图标按钮」，含义由标签承担。

## 类与 token

| 位置 | 内容 |
| --- | --- |
| `.theme-toggle` | 组件自己的钩子，目前没有规则。 |
| `.button--plain` | 底、悬停底、聚焦环、禁用色。 |
| `.button--icon` | 方形盒与按档的图标尺寸。 |
| `--background-hover` · `--focus-ring` · `--text-secondary` · `--text-primary` | 纯文字档读的颜色。 |

## 用法

```tsx
const { theme, setTheme } = useThemePreference()

<ThemeToggle theme={theme} onSelect={setTheme} />
```

`useThemePreference` 把 `system` 解析成具体主题，并在用户做出选择后持久化这一选择。组件保持纯粹，
需要别的策略（例如设置页里要列出三档）的调用方可以自己保留状态。

## 验证方式

- `app/src/components/theme-toggle/theme-toggle.test.tsx`：两档主题下的图标反转、动作名、点击目标、
  尺寸类名，以及没有可见文字。
- `app/src/features/scaffold/base/tests/base.browser.ts`：方形盒与图标尺寸、图标等于当前主题的反面、
  点击后主题真的翻转。

## 已知限制

- 按钮只在浅色与深色之间切换，不提供「回到跟随系统」这一档；首次访问默认跟随系统，用户做出选择后就不再跟随。
- 图标来自雪碧图的 `i-moon` 与 `i-sun`，两者都是界面图标，已在图标用例里覆盖。
