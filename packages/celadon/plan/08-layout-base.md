# 08 · 布局：第一阶段（骨架）

- 主文档：[08-layout-index.md](08-layout-index.md)
- 依据：`design/main-shell.md`（结构与交互）· `architecture/03-boundaries.md` §1 与 §3（落位）
- 做法：逐步细化。本阶段只搭外壳骨架与关键链路，内容与细节用占位，用到哪个组件才建哪个。
- 状态：已实现 · 待验收（2026-10-10）

## 1. 目录结构

本阶段落下的目录，标注「新」的为本次新建，其余在已有目录里补文件。

```
app/src/
  routes/
    layout.tsx                三栏装配与让步（新：由 surface-layout.tsx 改名与扩展）
    layout.less               三栏样式
  components/
    base/
      tooltip/                新：图标按钮与被截断标签的提示
      scroll-area/            新：三栏滚动与边缘阴影
    nav/                      新：左栏
      header/                 品牌与收起键
      list/                   导航列表，主导航与二级导航共用
        parts/
          item/               条目：图标、文字与角标
          menu/               折叠态弹出的主导航
      footer/                 底部一行：头像与快捷图标
    content/                  新：中栏
      content.tsx             页面容器，本阶段只有单区
    page/                     已有：页外壳（`Page` · `PageSection` · `PageRow` · `PageCell`），中栏与各页复用
    browser/                  新：右栏，标签浏览器
      tabs/                   标签条与新建入口
      home/                   首页与打开外部地址
      web/                    外部地址页
  features/
    inbox/                    新：组装页，摆出三栏与打开链路；后续迭代为真实收件箱
  stores/
    layout/
      columns.ts              新：三栏的布局事实——导航栏收起状态、标签浏览器的收起状态与所在的一侧、内容区的形态；装配层、内容区与快捷键都读，随本机记录
    browser/
      tabs.ts                 新：标签集
  platform/
    client/                   已有：补无标题栏拖动与窗口按钮
```

## 2. 范围

外壳立起来，三栏在位，栏宽与让步生效，三条链路走通：收起与展开、打开、窗口动作。收件箱作为组装页落地，其余业务页先用占位。

## 3. 要做的事

### 3.1 外壳与三栏

| # | 事 | 落点 | 算做完的样子 |
| --- | --- | --- | --- |
| 1 | 表面布局改名并扩成三栏 | `app/src/routes/layout.tsx` | 三栏按 1280 × 820 的基准排布：导航 280，内容最小 400，标签浏览器最小 300 |
| 2 | 让步顺序 | 同上 | 窗口变窄时按 `design/foundations.md` 的顺序让位，到 520 × 600 仍不出横向滚动 |

### 3.2 导航栏

| # | 事 | 落点 | 算做完的样子 |
| --- | --- | --- | --- |
| 3 | 列容器与四段 | `app/src/components/nav/` | 头部、列表与底部在位；列表先用写死的六项占位；收起状态与所在的一侧读 `stores/layout/columns.ts` |
| 4 | 整列收起与展开 | `app/src/stores/layout/columns.ts` | 头部键收起后只剩窄条；刷新后仍是收起态；F6 同效 |
| 5 | 折叠态的找回 | `app/src/components/nav/list/parts/menu/` | 「当前」行常驻；悬停、点击与键盘都能弹出菜单并选到项；`Esc` 关闭并把焦点交回 |
| 6 | 状态与四语 | 组件内 | 默认、悬停、焦点、禁用与空逐条可见；文案四语齐备 |

### 3.3 内容区

| # | 事 | 落点 | 算做完的样子 |
| --- | --- | --- | --- |
| 7 | 占位页容器 | `app/src/components/content/` | 点导航项即换页；页外壳用已有的 `app/src/components/page/`，滚动用 `scroll-area`；宽度与让位读 `stores/layout/columns.ts`；页面显示当前项的名字与占位说明 |
| 7.1 | 组装页 | `app/src/features/inbox/` | 六项导航都能打开一页；收件箱页摆出会话列表与 `@` 引用块的占位，点第二项进一页会话；这一页之后迭代为真实收件箱 |

### 3.4 标签浏览器

| # | 事 | 落点 | 算做完的样子 |
| --- | --- | --- | --- |
| 8 | 标签集 | `app/src/stores/browser/tabs.ts` | 开页、关页、激活与复用同一目标；换会话不清空 |
| 9 | 标签条与页容器 | `app/src/components/browser/` | 首页固定第一个且不可关；新建入口紧跟最后一个标签；溢出不换行；收起状态与所在的一侧读 `stores/layout/columns.ts`，收掉后内容区让位 |
| 10 | 首页与外部地址占位 | `app/src/components/browser/` | 首页有打开外部地址的输入；输入任意地址开一页，页内容占位 |

### 3.5 窗口

| # | 事 | 落点 | 算做完的样子 |
| --- | --- | --- | --- |
| 11 | 无标题栏拖动与窗口按钮 | `app/src/platform/client/` | 桌面壳里按住顶行能拖动窗口；窗口按钮按能力开关暴露，Web 下不出现 |

### 3.6 本阶段建的基础件

| # | 事 | 落点 | 算做完的样子 |
| --- | --- | --- | --- |
| 12 | `tooltip` 与 `scroll-area` | `app/src/components/base/` | 收起键与被截断的标签有提示；三栏溢出可滚动且边缘有阴影 |

### 3.7 登录后的去向

| # | 事 | 落点 | 算做完的样子 |
| --- | --- | --- | --- |
| 13 | 默认去向由欢迎页改为收件箱 | `app/src/features/auth/entry.ts` · `app/src/features/auth/use-complete-sign-in.ts` | 登录成功、以及有标记但没有落点时，都落到 `/app/inbox`；`/welcome` 仍可直接打开；`plan/06-login.md` 与测试需求同步 |

## 4. 占位与不做

- 收件箱落成组装页，内容仍是占位，不接接口；其余业务页（应用、看板、工作空间、电脑与设置）也用占位。
- 大弹窗、独占窗口与悬浮入口、本机应用进程留到后续阶段。
- `app/src/components/base/` 只建本阶段用到的两件，`tabs` 与 `avatar` 等到用到处再建。
