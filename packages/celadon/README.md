# celadon — CUI 2.0

> **与 `cui` 平级的新应用包**。不继承旧包的历史包袱：**用到啥复制啥，适配啥修改啥**。
> 当前阶段：**🚧 00 设计规范** ｜ 构建工具：**待定**（不预设框架）

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

## 模块（11）

| # | 模块 | 状态 | 计划 |
| --- | --- | --- | --- |
| 00 | **设计规范** | **🚧 进行中** | [plan/00-design-system.md](plan/00-design-system.md) |
| 01 | 布局 | ⏳ 待开始 | [plan/01-layout.md](plan/01-layout.md) |
| 02 | 组件 | ⏳ 待开始 | [plan/02-components.md](plan/02-components.md) |
| 03 | 登录注册 | ⏳ 待开始 | [plan/03-auth.md](plan/03-auth.md) |
| 04 | 收件箱 | ⏳ 待开始 | [plan/04-inbox.md](plan/04-inbox.md) |
| 05 | 看板 | ⏳ 待开始 | [plan/05-kanban.md](plan/05-kanban.md) |
| 06 | 聊天 | ⏳ 待开始 | [plan/06-chat.md](plan/06-chat.md) |
| 07 | 专家 | ⏳ 待开始 | [plan/07-experts.md](plan/07-experts.md) |
| 08 | 电脑 | ⏳ 待开始 | [plan/08-computer.md](plan/08-computer.md) |
| 09 | 工作空间 | ⏳ 待开始 | [plan/09-workspace.md](plan/09-workspace.md) |
| 10 | 配置 | ⏳ 待开始 | [plan/10-settings.md](plan/10-settings.md) |

## 设计资产（当前阶段产物）

```bash
node packages/celadon/design/build-css.mjs    # tokens.less  → tokens.css
node packages/celadon/design/build-i18n.mjs   # i18n/*.json  → i18n/bundle.js
```

- **配色**：中国传统色 —— 品牌「青」`#2A7B7B`（青瓷釉色）· 成功「松花绿」`#057748` · 危险「朱红」`#D93B30` · 警示「琥珀」`#8B6214`；
- **字体**：四语分栈（`--font-family-ui-hans/-hant/-japanese`，按 `:lang` 自动映射），等宽补 CJK；
- **i18n**：`ui.*` 必翻 / `sample.*` 演示数据；缺 key 回退 `zh-CN`；
- **命名**：变量与类名全称，不用缩写；状态用 `is-*`。

## 纪律

见 [plan/README.md](plan/README.md)：**台账制** · **零反向依赖**（本包不得 import 旧包）· **旧包冻结**。
