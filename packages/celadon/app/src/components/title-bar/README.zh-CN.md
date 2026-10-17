# components/title-bar

`components/title-bar` 是 Windows 客户端的自绘标题栏：单独一行，位于整个应用之上，看起来就是系统标题栏。
最左侧只有一颗导航列收起键，右端是自绘的三个窗口键；下方内容与 Web 端完全一致。

macOS 不画这一行：那里的原生交通灯与内容顶行在同一行里。Web 没有窗口，`WindowChrome` 的能力标记不是
`own`，组件因此不渲染。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `title-bar.tsx` | `TitleBar` 组件与 `TitleBarProps`。 |
| `title-bar.less` | 行高、左端内距、底色与两端的键位。 |
| `index.ts` | 对外出口。 |

## 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `navCollapsed` | `boolean` | 无 | 导航列是否收起，决定收起键的图形与文案。 |
| `onToggleNav` | `() => void` | 无 | 点收起键时调用，由装配层切导航列的收起状态。 |

## 使用方式

```tsx
<TitleBar navCollapsed={navCollapsed} onToggleNav={toggleNav} />
```

只在 `useWindowChrome().controls === 'own'` 时渲染；组件自己会判，调用方不必再判平台。

## 无障碍

- 收起键带 `aria-label` 与 `aria-expanded`，文案随当前状态在「收起这一栏」与「展开这一栏」之间切换。

## 验证方式

- 平台分支由 `nav.client.test.tsx` 一类的按平台用例覆盖；标题栏本身在 Windows 客户端里由窗口级工具截图核对。

## 已知限制

- 只有一颗导航收起键；标题文字区为空，刻意不画应用名，窗口标题仍由系统给。
