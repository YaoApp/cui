# 08 · 布局（主文档）

- 依据：`design/main-shell.md`（结构与交互）· `architecture/03-boundaries.md` §1 与 §3（落位）
- 分册：[08-layout-base.md](08-layout-base.md)（第一阶段：骨架）· [08-layout-nav.md](08-layout-nav.md)（导航列）
- 状态：已实现 · 待验收（2026-10-10）

## 1. 组件与目录

```
app/src/
  routes/
    layout.tsx               三栏装配、栏宽与让步顺序；没有上下文时不画导航栏（现名 surface-layout.tsx）
    entry-gate.tsx           根地址的去向（已有）
  components/
    base/
      dialog/                已有：弹窗页面的底子，`DialogPage` 提供两档宽度
      tooltip/               图标按钮、折叠后的导航、被截断的标签
      tabs/                  标签条与视图切换的底子
      scroll-area/           三栏的滚动与边缘阴影
      avatar/                底部一行、会话与应用卡片
    nav/                     左栏：导航
      header/                品牌与收起键
      list/                  导航列表，主导航与二级导航共用
        parts/
          item/              条目：图标、文字与角标
          menu/              折叠态弹出的主导航，用上游的 `menu` 部件
      footer/                头像、工作空间与电脑快捷图标
    content/                 中栏：页面容器
    browser/                 右栏：标签浏览器
      tabs/                  标签条与新建入口
      home/                  首页与打开外部地址
      web/                   外部地址页
    window/                  独占窗口，以及右上角的窗口按钮
    dock/                    右下角的悬浮入口
    modal/                   弹窗页面的宿主，现成，从 `features/modal/` 迁来
  features/
    inbox/                   收件箱：会话与 `@` 引用
    apps/                    应用：列表与造应用
    board/                   看板：列表与两栏容器
    workspace/               工作空间
    computer/                电脑
    settings/                设置
    auth/                    已有：登录、注册与服务器选择
    scaffold/                已有：开发面
    home/                    已有：首页
  stores/
    layout/
      columns.ts             三栏的布局事实：两处收起、标签浏览器所在的一侧、内容区形态
    apps/
      running.ts             运行中的应用与它们的窗口状态
    browser/
      tabs.ts                标签浏览器里打开的页，各业务域都能开一页
  platform/
    process/                 本机应用的启动、运行上下文、状态与结束，经 tauri 桥
    client/                  窗口动作，按能力开关暴露（已有）
```

## 2. 名字

| 名字 | 中文 |
| --- | --- |
| `layout` | 三栏的装配与让步 |
| `nav` · `header` · `list` · `item` · `menu` · `footer` | 导航栏、头部、导航列表、条目、折叠态弹出的主导航、底部 |
| `content` | 内容区 |
| `browser` · `tabs` · `tab` · `home` · `web` | 标签浏览器、标签条、标签、首页、外部地址 |
| `window` · `dock` | 独占窗口、悬浮入口 |
| `dialog` · `modal` | 弹窗的底子（控件 `base/dialog`）、弹窗页面（宿主与注册表 `components/modal`） |
| `process` · `columns` · `tabs` | 本机应用进程、三栏的布局事实、标签浏览器里打开的页 |

## 3. 落位

| 层 | 放什么 | 判据 |
| --- | --- | --- |
| `routes/` | 三栏装配、栏宽与让步、导航项与路由的对应、由谁读哪个 store | 只装配，不写业务；三栏布局不属于任何业务域 |
| `components/base/` | 包装无头库的原子件 | 与上游部件同名；第 3 个使用者才建 |
| `components/<名>/` | 界面结构件：导航栏、内容区、标签浏览器、独占窗口、悬浮入口、弹窗 | 由基础件拼成，不认识业务，收 props 与插槽，不发请求 |
| `features/<域>/` | 业务功能：收件箱、应用、看板、工作空间、电脑、设置 | 页面、组件、状态与测试都在域内 |
| `stores/` | 跨功能的事实 | 说不清归哪个功能 |
| `platform/` | 宿主能力：本机进程、窗口动作 | 经平台层暴露，不散落环境判断 |

导航栏的六项（新任务、应用、收件箱、看板、工作空间与电脑）是路由信息的投影，在 `routes/` 里装配，`components/nav/` 只负责绘制。二级导航的内容与各页面由对应的业务域以插槽交给 `components/nav/`。

组件与功能域私有的 hook 收在各自的 `hooks/` 目录，取数钩子集中在 `data/hooks/`，槽位见 `03-boundaries.md` §3。上提阈值见 `03-boundaries.md` §3，看板的两栏容器只有一处使用，留在 `features/board/` 内。弹窗沿用 `components/base/dialog/` 与 `components/modal/`，不新建组件。
