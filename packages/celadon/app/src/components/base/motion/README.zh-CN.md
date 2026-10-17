# components/base/motion

`components/base/motion` 是参与列联动的动效件：位置与尺寸的变化交给 Motion 的布局投影，动画期间不重排布局。
它包住的是 Motion 的 `motion.div`，另外提供两档过渡与两个读取 CSS 时长的函数。

用在「栏宽变化、内部元素要跟着平移但不该被缩放」的地方。目前唯一的使用处是内容列头（`content/parts/head`，
以 `header` 与 `position` 传入），列宽变化时标题随列平移。三栏的收放、换边与分屏本身走 CSS 过渡与 token，
按 `architecture/12-motion.md` 的归属规则，不经过本组件。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `motion-panel.tsx` | `MotionPanel` 组件与 `MotionPanelProps`。 |
| `panel-motion.ts` | `PANEL_SPRING`（收放弹簧）· `PANEL_INSTANT`（拖动期间不动画）· `panelDurationMs` · `panelEase` · `panelTiming`。 |
| `motion-panel.test.tsx` | 单元用例：标签选择、`position` 档、减少动效下退化为瞬时。 |
| `index.ts` | 对外出口。 |

## 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `as` | `'div' \| 'aside' \| 'main' \| 'section' \| 'nav' \| 'li' \| 'header' \| 'span'` | `'div'` | 参与布局动画的元素标签：列用 `aside`、主区用 `main`、行用 `li`、列头用 `header`、标签用 `span`。 |
| `position` | `boolean` | `false` | 位移型元素（行、文字、图标）传它：只平移不缩放，文字因此不变形、不发虚。 |
| `transition` | Motion 的过渡 | 弹簧 | 拖动改宽期间传 `PANEL_INSTANT`，宽度跟手不做动画。 |

## 使用方式

```tsx
<MotionPanel
  as="header"
  position
  className="content__head"
  data-controls={chrome.controls}
  data-nav={navCollapsed ? 'collapsed' : 'expanded'}
>
  {…}
</MotionPanel>
```

## 约定

- 位移型元素（列头、条目、文字）一律传 `position`：只平移不缩放，文字因此不变形、不发虚。
- 首次落位不播动画（`initial={false}`）：还原存值那一帧直接到位。
- `prefers-reduced-motion: reduce` 下退化为 `PANEL_INSTANT`，瞬时到位（弹簧参数写不进 CSS 变量，所以这一档由组件读库的偏好判定）。
- 弹簧参数写在 `panel-motion.ts`；时长与曲线取 `design/tokens.less` 的 `--duration-base` 与 `--easing-decelerate`。

## 验证方式

- 单元用例与组件同目录：`motion-panel.test.tsx`。
- 真机读数在 `app/logs/` 的动效记录里，逐帧量栏宽与文本宽度。

## 已知限制

- 不支持自定义 spring 档位；需要另一套节奏时在调用处传 `transition`。
