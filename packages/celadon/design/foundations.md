# 规范（对应 foundations.html）

> 数值**实时读 `tokens.css`**（唯一来源 `tokens.less`）；本文件与页面一一对应，**以 `tokens.css` 为准**。
> 页面左列浅色 / 右列暗色；**文案随语言变，数值不随语言变**。

## F1 间距

**纯 4 基数列（4/8/12/16/24/32/48），无细档** —— 档位越少越有节奏，也避免"该 4 还是 6"随意挑。**禁魔法数字**；档位越大用于越外层的间距。

| token | 值 |
| --- | --- |
| `--spacing-4` | `4px` |
| `--spacing-8` | `8px` |
| `--spacing-12` | `12px` |
| `--spacing-16` | `16px` |
| `--spacing-24` | `24px` |
| `--spacing-32` | `32px` |
| `--spacing-48` | `48px` |

| 用途 | 允许档位 |
| --- | --- |
| 组件内距（控件 padding） | `4 · 8 · 12` |
| 元素间（同组 gap） | `8 · 12 · 16` |
| 区块间（section） | `24 · 32 · 48` |
| 栅格槽宽（gutter） | `16 · 24` |

实例：卡片内距 16 · 标题与正文 8 · 按钮间 12。

## F2 圆角

四档加一胶囊，**元素越大圆角越大**。

| token | 值 | 用法 |
| --- | --- | --- |
| `--radius-xs` | `4px` | 标签 / 芯片 |
| `--radius-small` | `6px` | 按钮 · 输入框 · 小控件 |
| `--radius-medium` | `8px` | 卡片 · 面板 · 弹层 |
| `--radius-large` | `12px` | 大容器 · 图片 |
| `--radius-pill` | `999px` | 标签 · 胶囊按钮 · 头像角标 |

## F3 阴影与层级

层级由**阴影 + z-index** 共同定义；**遮罩只用于 L3**。

| 层级 | 阴影 token | 表面 | z token | z 值 | 用于 |
| --- | --- | --- | --- | --- | --- |
| L0 base | `none` | `--background-content` | `--z-base` | `0` | 贴合内容（表格行 / 列表） |
| L1 raised | `--shadow-subtle` | `--elevation-surface-1` | `--z-raised` | `10` | 卡片 / 标签页 / 徽标 |
| L2 floating | `--shadow-floating` | `--elevation-surface-2` | `--z-overlay` | `1000` | 下拉 / 气泡 / 悬浮面板 |
| L3 overlay | `--shadow-overlay` | `--elevation-surface-3` | `--z-modal` | `1100` | 弹窗 / 抽屉 / 通知（配 --scrim） |
| sticky | `--shadow-subtle` | `--background-navigation` | `--z-sticky` | `100` | 吸顶工具条 / 分节标题 |

**`--shadow-none` 不是 token** —— L0 的阴影就是字面量 `none`（页面里作为哨兵值判断）。

**暗色下阴影在暗底上不可见** —— 所以层级改由**面阶**（`--elevation-surface-1/2/3`）+ 1px 暖白内高光表达；浅色仍靠阴影。
吸顶：滚动时头部固定（z `100`）并出现阴影；不滚动时它只是普通标题。

## F4 动效

时长按位移与重要性分档；**进场 decelerate、退场 accelerate**。

| token | 值 |
| --- | --- |
| `--duration-fast` | `120ms` |
| `--duration-base` | `200ms` |
| `--duration-slow` | `320ms` |

| 缓动 token | 值 | 用途 |
| --- | --- | --- |
| `--easing-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | 标准 |
| `--easing-decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | 进场 |
| `--easing-accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | 退场 |

**常用场景（12 个，全部真实可操作）**

| 场景 id | 场景 | 时长 | 缓动 |
| --- | --- | --- | --- |
| `hover` | 悬停过渡 | `--duration-fast` | `--easing-standard` |
| `press` | 按下反馈 | `--duration-fast` | `--easing-standard` |
| `focus` | 焦点环 | `--duration-fast` | `--easing-standard` |
| `fade` | 淡入 | `--duration-base` | `--easing-decelerate` |
| `dropdown` | 下拉出现 | `--duration-base` | `--easing-decelerate` |
| `panel` | 面板展开 | `--duration-base` | `--easing-decelerate` |
| `collapse` | 面板收起 | `--duration-fast` | `--easing-accelerate` |
| `drawer` | 抽屉滑入 | `--duration-slow` | `--easing-decelerate` |
| `modal` | 弹窗出现 | `--duration-base` | `--easing-decelerate` |
| `toast` | 通知出现 | `--duration-base` | `--easing-decelerate` |
| `list` | 列表依次进入 | `--duration-base` | `--easing-decelerate` |
| `stream` | 流式输出 | `--duration-base` | `--easing-standard` |

**场景级覆盖**：容器加 `.motion-quiet` / `.motion-rich` 即可局部改强度（随继承生效）；
**系统"减少动态"是总开关，任何局部都覆盖不掉** —— 开启后全部时长归零（在 `tokens.less` 统一处理，组件无需各自判断）。

**规则**

- 该动：面板展开/收起、下拉出现、按下反馈、加载、流式输出、状态切换。
- 不该动：滚动跟随、文字重排、频繁重复的微交互（会晕）。
- 只动 transform / opacity（不动 width/height/top/left）。
- 减动效：开启系统"减少动态效果"后全部时长归零（tokens.less 内统一处理，组件无需各自判断）。

## F5 边框（含 WCAG 1.4.11 决策）

字段底与内容底只差 **1.05:1**，所以边框是输入框唯一的识别手段 —— **1.4.11 要求 3:1**。

| token | 浅色 | on 字段底（浅）| on 内容底（浅）| 暗色 | on 字段底（暗）| on 内容底（暗）|
| --- | --- | --- | --- | --- | --- | --- |
| `--border-subtle` | `#EBEAE6` | 1.10:1 | 1.15:1 | `#2E2C28` | 1.11:1 | 1.27:1 |
| `--border-default` | `#DEDCD7` | 1.25:1 | 1.31:1 | `#3B3933` | 1.34:1 | 1.54:1 |
| `--border-control` | `#C9C7C0` | 1.54:1 | 1.62:1 | `#4A4740` | 1.67:1 | 1.91:1 |
| `--border-hover` | `#9F9D96` | 2.47:1 | 2.60:1 | `#5E5A52` | 2.26:1 | 2.59:1 |
| `--border-control-strong` | `#8D8A80` | 3.14:1 | 3.31:1 | `#7C776B` | 3.47:1 | 3.98:1 |

**决策**

- 默认态保留弱边界（观感优先）；
- 提供 --border-control-strong / --border-hover-strong 达标档；
- 系统开启"高对比"时由 tokens.less 的媒体查询自动切换（浅/暗均已实测生效）。

> ⚠️ **这是一处有意偏离**：默认态**不满足 1.4.11 的字面要求**；如需严格达标，把 `--border-control` 直接指向强边界即可（一行改动）。

## F6 三栏竖分割（导航区 | 内容区 | 侧栏）

主结构是三栏**竖分割**（grid 列轨），不是横向条带。**让位顺序：侧栏先缩 → 侧栏整条消失 → 中栏才可能低于最小**；**导航栏不参与宽度让步**。
屏幕兼容靠**按视图类型给默认宽 + 视口驱动**，不靠"给不同屏幕不同窗口尺寸"。

| 栏 | 最小 | 最大 | 默认 |
| --- | --- | --- | --- |
| 导航区 | `--nav-min` `264px` | `--nav-max` `420px` | `--nav-default` `280px` · 收起：客户端 `--nav-collapsed-desktop` `0px`（导航留在窗口左上）· Web `--nav-collapsed` `56px` 图标轨 |
| 内容区 | `--center-min` `400px` | 剩余空间（内文另有可读上限） | 剩余空间 |
| 侧栏 | `--side-min` `300px` | **总宽 −（导航区 + 内容区最小 + 把手）** —— 可自由拖拽到此上限，不写死比例 | `--side-width-reading` `400px` / `--side-width-tool` `600px` / `--side-width-task` `640px` / `--side-width-wide` `840px` 按视图类型 |

| 屏幕 | token | 值 |
| --- | --- | --- |
| 默认窗口 | `--window-default` × `--window-default-height` | `1280px × 820px` |
| 最小窗口 | `--page-min-width` × `--page-min-height` | `520px × 600px` |
| 侧栏拖拽把手 | `--side-resize-handle` | `6px` |

- 阈值按**视口 CSS px** 判定（已含系统缩放）：4K@200% ≈ 1920 CSS px，与 1080p 的 1920 同构，因此同一套规则都合理。
- 窗口只给默认/最小值（记住用户上次尺寸）；高度不足时收起次级工具条，**底栏保留**。

**让位顺序（代价最大的先丢）**

- 侧栏**先缩**：在最小 300 与**可用空间上限**之间夹取。
- 侧栏**整条消失**：剩余空间不足 300 时直接不开（不是压窄）。
- **中栏才可能低于最小**（400）：只在侧栏整条已被移除之后。
- **导航栏不参与宽度让步**：视口 < 1024 时自动收成 56px 图标轨；手动展开则**覆盖**中栏（浮层），不挤压它。
- 高度方向：先收次级工具条，**底栏保留到最后**。

**导航收起的三档（客户端 / Web 各自对应）**

| 场景 | 收起形态 | 左上控制区 | 状态 |
| --- | --- | --- | --- |
| 客户端 / Web 宽屏（≥1024） | **收起为 0**：导航区完全消失，内容区从窗口最左铺满；**红绿灯与收起键位置不变**（落在内容区顶上，内容顶行让出左内距） | 客户端：窗口左上（红绿灯旁），位置不变 | 持久化偏好 + 临时标志（两级） |
| Web 中档（768–1023） | **保留 56px 图标轨**（浏览器没有标题栏可放图标） | Web 无红绿灯 ✗ → 入口在**图标轨顶部** | 同；窄屏的临时展开不写回偏好 |
| Web 窄屏（<768） | 抽屉：浮在内容上 + 遮罩 | Web 抽屉态：内容顶行的**汉堡按钮** | 临时（Esc / 点遮罩关闭） |

> **没有标题栏**：三栏竖切，每栏各自的顶行；窗口左上角只浮着"红绿灯 + 收起键"，**位置永不移动**。
> 自动收轨阈值 `--nav-auto-collapse` `1024px`；Web 转抽屉阈值 `--bp-nav-drawer` `768px`。

