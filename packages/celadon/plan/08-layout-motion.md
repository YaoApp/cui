# 08 · 布局：动效（Motion）

- 主文档：[08-layout-index.md](08-layout-index.md)
- 分册：[08-layout-base.md](08-layout-base.md)（骨架）· [08-layout-nav.md](08-layout-nav.md)（导航列）· [08-layout-shell.md](08-layout-shell.md)（窗口封装）
- 依据：`内部文档/design/导航列收放动效方案.md`（观察标准 · 变形来源 · 业界做法 · FLIP 与 Motion 的接法）
- 状态：方案已定，未落地

这一册把界面里所有**会移动的东西**收进一套动效方案，Web 与桌面客户端共用同一套实现。目标只有一个：变化过程中不许变形、不许跳，观感上是整块在平移。

## 1. 现在的移动有哪些

先把现状列清楚，作为迁移基线。以下都是当前实现里真实存在的移动，取值来自布局状态与样式 token。

| 序号 | 移动 | 触发 | 现在怎么动 | 现状问题 |
| --- | --- | --- | --- | --- |
| 1 | 导航列整列收放 | 点收起键 · 窄视口自动 | `transition: inline-size var(--duration-base)` | 宽度逐帧变化导致条目与文字重排；收到底后整列不可见，因此不再有标志闪现 |
| 2 | 主导航区折起 | 点分区收起 | 同上，折叠行 `margin-block-start` 过渡 | 折叠行位置变化也带动重排 |
| 3 | 内容列左缘与列头内距 | 导航列收放 · 拖宽 | 列头 `padding-inline-start` 过渡 | 与 1 同步但不共用一套节奏，容易出现半拍 |
| 4 | 标签浏览器列收放 | 收掉 · 换边 | 布局让位（`display: none` 一侧） | 没有过渡，直接跳；换边是列序对调，没有动画 |
| 5 | 导航列宽度拖拽 | 拖右缘把手 · 键盘 | 逐帧写宽度 | 这是用户主动改宽，允许重排，不做动画 |
| 6 | 内容区滚动与标签条滚动 | 内容溢出 | 原生滚动 | 不属于本册 |
| 7 | 窗口动作（最小化 · 最大化 · 关闭） | 点窗口键 | 由系统负责 | 不属于本册 |

## 2. 为什么用 Motion

`layout` 属性就是 FLIP 的成品：元素位置或尺寸变化时，它自动量几何、加反向变换、用变换动到目标位置，**动画期间不动布局**（官方文档《Layout Animation》）。我们的病根正是「动画宽度带动内部重排」，这一条正好对症。

| 选择 | 结论 |
| --- | --- |
| 手写 FLIP | 可行，约四十行；需要自己处理文字缩放、圆角与阴影的投影修正 |
| 引入 Motion | 上述修正已内置；代价是新增一个运行时依赖 |
| 最终取向 | **引入 Motion**，Web 与桌面客户端共用；界面里所有位移类动效都走它，不再各写 `transition` |

硬约束三条：

1. 文字与图标所在的元素必须显式写 `layout="position"`，否则父级尺寸变化的投影会把它们一起缩放，文字会变形发虚。
2. 动效不新增状态。收起、展开、换边、折叠这些事实仍由布局状态给出，Motion 只负责把变化动出来。
3. 拖拽改宽期间关闭布局动画，否则指针拖动会被动画阻尼拖成黏滞感。

## 3. 接入范围与写法

| 序号 | 元素 | 落点 | 写法 |
| --- | --- | --- | --- |
| 1 | 导航列外壳 | `components/nav/nav.tsx` | `<motion.aside layout transition={panel}>`，宽度变化由投影完成 |
| 2 | 导航列的条目与文字 | `components/nav/parts/item` · `parts/main` · `parts/list` · `parts/footer` | 行容器加 `layout="position"`；文字本身不再单独动 |
| 3 | 列头与品牌行 | `parts/header` · `parts/brand` | 加 `layout="position"`，随列平移，不做显隐切换 |
| 4 | 内容列 | `components/content/content.tsx` | `<motion.main layout transition={panel}>`；列头 `layout="position"` |
| 5 | 内容列头的操作键与标题 | `components/content/parts/head` | 加 `layout="position"`；按键的出现与消失仍是条件渲染，位置由投影补 |
| 6 | 标签浏览器列 | `components/browser/browser.tsx` | `<motion.aside layout transition={panel}>`；收掉与换边都走投影，不再用 `display: none` |
| 7 | 标签条与标签 | `components/browser/parts/tabs` | 标签加 `layout="position"`，新建与关闭时其余标签平移 |
| 8 | 成套联动 | `routes/layout.tsx` | 三列外层包 `<LayoutGroup>`，同一组共享一次投影计算 |
| 9 | 折叠行 | `components/nav/parts/main` 与 `parts/scene` | 折叠行的进出用 `layout` 而不是切换 `margin`；文字用 `layout="position"` |
| 10 | 窗口键与标题栏 | `components/title-bar` · `components/window-controls` | 桌面壳的 Windows 标题栏不参与列联动，保持静态；只在窗口键悬停时用现有的按钮态 |

统一的过渡参数复用现有 token，不新增：时长用 `--duration-base`（它自带 `still` / `quiet` / `rich` 三档，减少动效偏好已经覆盖），曲线用 `--easing-decelerate`。Motion 的 spring 参数写不进 CSS 自定义属性，集中在 `app/src/components/base/motion/panel-motion.ts` 一处，注释注明与这两个 token 的对应关系。

Motion 的 `transition` 写法统一为：优先 spring（`type: 'spring'` 并把 stiffness 与 damping 从 token 读入），确需时长曲线时退回 `{ duration, ease }`。`prefers-reduced-motion` 下统一退化为瞬时。

## 4. 两端的差异

| 端 | 收起后的宽度 | 说明 |
| --- | --- | --- |
| Web | 零宽（与桌面一致） | 整列宽度收到 0，内容从最左铺满；重新展开的入口在内容列头左端 |
| 桌面客户端 | 零宽 | 导航列整体移出窗口，展开键落到内容列头 |

差异只在**目标宽度**，动画机制完全相同：同一个 `layout`，同一组 token，同一份组件。目标宽度由布局状态给出，不做平台分支。

## 5. 施工顺序

每一步单独截图核对，通过了再进下一步。

| 步骤 | 内容 | 完成判据 |
| --- | --- | --- |
| 1 | 引入 Motion，封装一个 `usePanelMotion()`（返回 `layout` 与 `transition` 的统一写法）与一个 `MotionPanel` 包装组件 | 单元用例通过；未接入任何界面 |
| 2 | 导航列外壳与条目接上 `layout` 与 `layout="position"` | 收起与展开动画中，条目纵坐标与行高四帧一致 |
| 3 | 内容列与列头接上，按键仍条件渲染 | 内容列左缘与导航列同步，标题不跳 |
| 4 | 标签浏览器列接上，收掉与换边改走投影 | 收掉与换边都有过渡，标签纵坐标不变 |
| 5 | 折叠行改走 `layout` | 折叠行进出无跳变，条目不移位 |
| 6 | 拖拽改宽期间关闭布局动画 | 拖拽手感与现在一致，没有阻尼拖尾 |
| 7 | `prefers-reduced-motion` 退化 | 该偏好下无动画，功能正常 |

## 6. 验证方式

1. 收起与展开各取**动画中段**（约 120 毫秒）与**落定后**两帧，Web 与桌面客户端各一份。
2. 逐帧量：每条导航条目的 `getBoundingClientRect()` 的 `top` 与 `height`、条目文字的 `left`、导航列与内容列的 `inline-size`。
3. 判定：条目的 `top` 与 `height` 四帧一致（允许 0.5 像素取整差）；文字 `left` 与列左缘之差恒定；宽度按动画推进单调变化。
4. 反向核对：临时去掉 `layout` 再跑一次，应当出现纵坐标跳变，证明量法能发现变形。
5. 拖拽核对：拖拽过程中关闭动画，指针位置与列右缘的差不超过 1 像素。

## 7. 已知限制

- **本版本的 `layout` 没有产生投影**。三列已按第 3 节接上 `MotionPanel`（`layout`，行与列头另加 `layout='position'`），但实测收起时元素的计算样式始终是 `transform: none`，宽度直接跳到目标值；同一份上下文里走 `animate` 的折叠行动画正常（高度 93 → 17 → 2 逐帧变化），说明运行时本身可用，是布局投影这一路没有生效。因此收起、展开、分栏合栏与标签开关目前由 CSS 过渡给出可见动画（`--duration-base` + `--easing-decelerate`），拖动期间一律关掉；三列与行上的 `layout` 接线保留，等上游修好即生效。判据见 `app/src/features/inbox/tests/layout.browser.ts` 的三条动效用例与「动画前 / 中段 / 落定后条目纵坐标与高度一致」的实测。
- Motion 的布局动画会为参与元素建立投影，元素过多时内存与合成开销上升；导航列条目数量少，可接受，标签条需要限制同时在动画的标签数量。
- 布局动画依赖 React 的渲染时机，`layout` 只在 React 提交后触发；如果状态更新被合并成一次，动画只会播放一次（这是期望行为，但排障时要知道）。
- 窄视口的浮层形态（F6 暂缓项）不在本册范围，等桌面客户端适配完成后另开一册。
- 系统级窗口动作仍然由系统负责，不做自定义动画。
