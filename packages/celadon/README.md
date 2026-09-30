# celadon — CUI 2.0

> **`cui` 的 2.0** —— 迁移完成后旧包由它取代（**包名 `@yaoapp/cui`，从 2.0.0 起**）。
> 不继承旧包的历史包袱：**用到啥复制啥，适配啥修改啥**。
> 当前阶段：**01 基础设施**（待开始）｜ 已完成：**✅ 00 设计规范**（2026-09-30）｜ 构建工具：**Vite**（已选定）

## 结构决定：v2 只有一个包

**决定日期**：2026-09-30 ｜ 结论：**`packages/celadon/` 就是 v2 的主目录**，不预拆子包。

现在内部是 `design/`（设计资产）· `plan/`（计划）· `scripts/`（工具）—— 将来应用代码进来时，
按"用到啥加啥"继续加子目录（例如 `app/`），**不必**提前拆成 `celadon-ui` / `celadon-app`。

**什么时候才拆**（满足任一再拆，且要有具体理由）：

1. 组件库要被**两个以上消费者**使用；
2. 有东西需要**独立发版**；
3. 构建产物与设计资产的**生命周期真的冲突**（比如设计资产要能独立于构建工具使用，而现在这样就够）。

## 目录

```
celadon/
  README.md       本文件：模块清单与当前阶段
  plan/           计划（11 个模块，每个一份；总览见 plan/README.md）
  design/         设计资产（可独立于构建工具使用）
    tokens.less      设计 token 唯一来源（配色/字体/尺寸/圆角/动效）
    tokens.css       自动生成（build-css.mjs）
    color-card.html  色卡：实时读 tokens.css + 对比度/配对自检
    mock.html        详细界面稿（1440×888，三列通高）
    i18n/*.json      四语文案（简/繁/英/日；ui.* 与 sample.* 分命名空间）
    logo-*.svg       官方 logo 换色版（设计交付物，未应用到生产）
    icons/           App 图标 PNG 七档（16–1024）
  MIGRATION.md    迁移台账（复制了什么、改了什么、为什么）
```

## 模块（12）

| # | 模块 | 状态 | 计划 |
| --- | --- | --- | --- |
| 00 | **设计规范** | **✅ 完成** | [plan/00-design-system.md](plan/00-design-system.md) |
| 01 | 基础设施 | ⏳ 待开始 | [plan/01-infrastructure.md](plan/01-infrastructure.md) |
| 02 | 布局 | ⏳ 待开始 | [plan/02-layout.md](plan/02-layout.md) |
| 03 | 组件 | ⏳ 待开始 | [plan/03-components.md](plan/03-components.md) |
| 04 | 登录注册 | ⏳ 待开始 | [plan/04-auth.md](plan/04-auth.md) |
| 05 | 收件箱 | ⏳ 待开始 | [plan/05-inbox.md](plan/05-inbox.md) |
| 06 | 看板 | ⏳ 待开始 | [plan/06-kanban.md](plan/06-kanban.md) |
| 07 | 聊天 | ⏳ 待开始 | [plan/07-chat.md](plan/07-chat.md) |
| 08 | 专家 | ⏳ 待开始 | [plan/08-experts.md](plan/08-experts.md) |
| 09 | 电脑 | ⏳ 待开始 | [plan/09-computer.md](plan/09-computer.md) |
| 10 | 工作空间 | ⏳ 待开始 | [plan/10-workspace.md](plan/10-workspace.md) |
| 11 | 配置 | ⏳ 待开始 | [plan/11-settings.md](plan/11-settings.md) |

> 00–01 是**地基**（设计基线 + 工程底座，不产出用户可见界面）；02 起按"用户能跑通的一条路"逐个交付页面。

## 设计资产（当前阶段产物）

```bash
node packages/celadon/scripts/build-css.mjs    # tokens.less  → tokens.css
node packages/celadon/scripts/build-i18n.mjs   # i18n/*.json  → i18n/bundle.js
```

- **配色**：中国传统色 —— 品牌「青」`#2A7B7B`（青瓷釉色）· 成功「松花绿」`#057748` · 危险「朱红」`#D93B30` · 警示「琥珀」`#8B6214`；
- **字体**：四语分栈（`--font-family-ui-hans/-hant/-japanese`，按 `:lang` 自动映射），等宽补 CJK；
- **i18n**：`ui.*` 必翻 / `sample.*` 演示数据；缺 key 回退 `zh-CN`；
- **命名**：变量与类名全称，不用缩写；状态用 `is-*`。

## 纪律

见 [plan/README.md](plan/README.md)：**台账制** · **零反向依赖**（本包不得 import 旧包）· **旧包冻结**。
