# 08 · 布局：窗口封装（壳）

- 主文档：[08-layout-implemented.md](08-layout-implemented.md)（已实现的部分）· [08-layout-content-browser.md](08-layout-content-browser.md)（未完成的跟踪）
- 依据：`design/foundations.md`（窗口尺寸与分割线规则）· `architecture/10-icons.md`（图标取用与新增流程）· `architecture/03-boundaries.md` §1 与 §3（落位与组件归属）
- 状态：Windows 标题栏已落地，产品级细节待做

这一册只讲一件事：**窗口最外面那一层**。桌面客户端没有原生标题栏时，顶部那一条由应用自己画，它要同时承担标题栏、拖动区与窗口按钮的职责；macOS 走系统透明标题栏，交通灯仍是原生的；Web 没有窗口可管，这条不画。三端渲染同一套组件，差异只有内边距与窗口按钮由谁提供。

## 1. 目录结构

```
packages/celadon/app/src/
  components/title-bar/             Windows 的标题栏一行：左端收起键，右端窗口键
    title-bar.tsx                   按平台决定画不画（controls === 'own' 才画）
    title-bar.less                  行高、内边距、收起键与悬停
    index.ts                        对外出口
  components/window-controls/       三个窗口键：最小化 · 最大化与还原 · 关闭
    window-controls.tsx             动作接线，键位与图形
    window-controls.less            命中区、间距、字形与悬停
    window-controls.test.tsx        三种平台取值与三个动作
    README.zh-CN.md                 使用说明
    index.ts                        对外出口
  platform/client/window.ts         组件只读这一处：能力、平台、四个动作与拖动带判定
  platform/bridge/window.ts         前端对等面：四条命令与 start_dragging
  routes/routes.tsx 的 ShellFrame   把标题栏放在路由最外层

celadon-desktop/src-tauri/
  src/bridge/window.rs              窗口装饰的唯一决策处与四条命令
  tauri.conf.json                   窗口尺寸、label、macOS 专有键
  capabilities/default.json         core:window:allow-start-dragging
```

## 2. 对外接口

窗口封装对上层只有两种东西：一个组件与一个钩子。组件不认识布局状态（收起与展开由装配层以 props 传入），钩子不判平台（平台事实来自清单）。

### `components/title-bar`

| 属性 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `navCollapsed` | `boolean` | 是 | 导航列是否收起，用来选收起键的图标与文案 |
| `onToggleNav` | `() => void` | 是 | 收起键的动作 |

不画的情形由组件内部判定：`controls !== 'own'` 时返回空（macOS 有原生交通灯，Web 没有窗口）。

### `components/window-controls`

无属性。它读 `useWindowChrome()`，`controls` 为 `own` 时才渲染三个键。

### `platform/client/window.ts`

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `visible` | `boolean` | 有没有窗口可管（桌面为真） |
| `controls` | `'native' \| 'own' \| 'none'` | 窗口按钮归谁：macOS 原生 · Windows 自绘 · Web 没有 |
| `maximized` | `boolean` | 当前是否最大化，用来在最大化与还原之间换图形 |
| `toggleMaximize` · `minimize` · `close` | `() => void` | 三个窗口动作 |
| `dragState` | `string` | 最近一次拖动请求的结果，供排查用的探针显示 |

## 3. 施工清单

| 序号 | 事项 | 落点 | 判定 |
| --- | --- | --- | --- |
| 1 | 窗口装饰一处决策 | `bridge/window.rs` | Windows 关原生装饰，macOS 保留；别处不碰装饰 |
| 2 | 四个窗口动作 | `bridge/window.rs` · `platform/bridge/window.ts` | 最小化 · 最大化与还原 · 关闭 · 读最大化状态，四条命令同名对等 |
| 3 | 顶部一条带子可拖 | `platform/client/window.ts` | 落点在带内且不是控件时进入拖动；控件照旧可点 |
| 4 | Windows 标题栏一行 | `components/title-bar/` | 单独一行画在所有页面之上，左端一个收起键、右端三个窗口键 |
| 5 | 三个窗口键 | `components/window-controls/` | 行高 32 · 左右留白各 8 · 命中区 32 · 间距 8（中心距 40） |
| 6 | 图形走图标规范 | `design/icons/` · 上述两个组件 | 最小化与关闭用 lucide；最大化与还原属于「14 像素档下的简化版」，画在自有雪碧图 |
| 7 | 路由最外层装配 | `routes/routes.tsx` 的 `ShellFrame` | 所有页面（含入口页）都在标题栏之下，内容与 Web 一致 |
| 8 | 窗口规格取规范 | `tauri.conf.json` | 默认 1280 × 820，最小 520 × 600 |
| 9 | 四语与状态齐 | `app/src/locales/` | 三键文案四语齐；默认 · 悬停 · 焦点 · 已最大化四种状态都有可判定的表达 |
| 10 | 用例 | `window-controls.test.tsx` · `title-bar` 与钩子的用例 | 三种平台取值 · 三个动作 · 拖动带跳过控件 |
| 11 | 文档与规范写回 | `内部文档/design/桌面客户端壳.md` · 本册 | 实现有变即改，实测值写进文档 |

## 4. 不做

- **Snap Layouts 悬停**：2026-10-12 定。四个窗口动作正常，键盘 `Win + Z` 仍可调出分屏面板，为此加原生命中测试或引插件不划算。
- **窗口效果**（Mica 与 Acrylic 一类背景材质）：2026-10-12 定。界面是不透明底色加卡片，开了也看不见。
- **拖动窗口时标题栏的按下态底色**：2026-10-12 定。系统接管拖动后网页拿不到「正在拖动」的可靠信号，为一条底色反馈接窗口移动事件不划算。
- **Web 端画窗口按钮**：浏览器自己有窗口边框。
- **桌面壳内的前端服务**：客户端跑内嵌产物，不起 dev server。

## 5. 产品级细节（这一册要做完的部分）

| 序号 | 事项 | 现状 | 要做到 |
| --- | --- | --- | --- |
| 1 | 标题栏左端内容 | 只有一个收起键 | 按最终版式定：收起键的图标、悬停、焦点环与提示语四语齐 |
| 2 | 窗口键的可访问性 | 有 `aria-label` 与四语文案 | 键盘可达（Tab 进、Enter 触发）、焦点环与悬停同一档、关闭键不做红 |
| 3 | 最大化与还原的状态同步 | 窗口尺寸变化时读一次 | 拖动边缘改变尺寸、双击标题栏、系统快捷键三条路径都能同步图形 |
| 4 | 拖动带的判定 | 顶部 48 像素内、跳过控件 | 与标题栏行高解耦（行高变而带不变），并把判定抽成可测的纯函数 |
| 5 | 入口页与产品页的一致性 | 都在标题栏之下 | 入口页顶行不再重复画窗口键（已撤），确认两条路径的观感一致 |
| 6 | 平台事实的来源 | 清单的 `client.os` | 平台判定只此一处，组件不判宿主、不读 `navigator` |
| 7 | 截图与实测留档 | 已有参照图、键特写、整窗与圆角 | 每次版式有变即更新，读数写进文档 |
| 8 | 临时件清理 | 登录页拖动探针仍在 | 确认拖动稳定后删掉探针与 `dragState` |
| 9 | macOS 的交通灯留白 | 取值 `--traffic-lights-width`（62 像素）只在设计页使用 | 先量顶行内容与交通灯是否重叠，确需留白就在顶行落这一档；这条是 macOS 唯一的自留形状 |

## 5.1 两平台的分工（为什么不各写一套）

共享的部分：三个窗口动作与读最大化状态（壳里四条命令、前端对等面四条）、拖动（顶部一条带子与 `start_dragging`）、平台判定（清单的 `client.os` 一处）。这些都不分平台，各写一套只会多出一份要同步的代码。

分开的部分只有**呈现**：macOS 把顶栏与内容压在同一行，交通灯由系统提供，应用侧只需要按 `--traffic-lights-width` 留白；Windows 是一条独立的标题栏行，左端一个收起键、右端三个自绘窗口键。分界已经落在组件层：`title-bar` 与 `window-controls` 都以 `controls` 为唯一的开关，`native` 与 `none` 时返回空。需要为 macOS 单独加的只有上表第 9 条那条留白，不加第二套标题栏。

## 5.2 三列的列头（与导航联动）

三列各有一条 40 像素的列头，高度统一取 `--row-height`（40），彼此对齐成一条通栏，这一条是窗口拖动区。

| 列 | 列头内容 | 与其他列的联动 |
| --- | --- | --- |
| 导航列 | macOS：交通灯留白加收起键；Windows 与 Web：收起键 | 品牌不进列头，放列头下面的品牌行 |
| 内容列 | 内容标题（单独的组件） | **导航收起时**：接管交通灯留白（macOS），并显示展开导航的键 |
| 标签浏览器列 | 标签条 · 新建 · 换边 · 收掉 | 高度与左两列一致 |

要点：

1. **内容标题是单独的组件**（`components/content/parts/head/`），它不认识业务，只收标题、图标与右侧插槽；页面不再各自画标题行。
2. **展开键跟着导航收起转移**：导航展开时它在导航列的列头，收起时内容列的列头显示它（macOS 同时把交通灯留白从导航列转移到内容列）。
3. 联动只走一处状态：布局 store 的 `navCollapsed`，由装配层把状态与动作传给两条列头，两个组件之间不互相引用。

## 6. 已知限制

- Windows 的自绘标题栏只在壳里出现，Web 与 macOS 不画这一行；macOS 的交通灯留白取值 `--traffic-lights-width`（62 像素）目前只在设计页使用，应用侧尚未落这条留白。
- 窗口键的图形随图标规范走：最大化与还原是「14 像素档下的简化版」的自绘图形，规范若调整需同步。
- 边缘与角落拉伸、窗口圆角与投影由系统提供，实测可用，不需要我们写代码；改壳配置时要复核这两条没有被破坏。
