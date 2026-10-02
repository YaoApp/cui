# architecture/ — CUI 2.0 架构规范

> **本目录回答**：代码怎么组织、依赖往哪个方向走、边界在哪、什么不许写。
> **与邻居的分工**：
> - [`../design/`](../design/) 管**长什么样**（token · 排版 · 图标 · 组件外观）—— 视觉唯一来源；
> - **`architecture/`（本目录）** 管**代码怎么摆**（分层 · 依赖方向 · 数据流 · 宿主边界 · 工程门禁）；
> - [`../plan/`](../plan/) 管**做到哪了**（阶段 · 状态 · 验收 · 依据）—— 过程与决定，不是规则。
>
> **三者不重叠**：视觉规则不在本目录复述，计划状态不在本目录记录。

## 写法

**读者是 Agent**：只写**会改变行为**的规则。
- 动机、历史、取舍过程 → `.agent/worklogs/`，不写在这里。
- 一条规则只在一处写全，别处给编号引用。
- 用表格与短句；示例只留能照抄的形状。

## 怎么读

**开工前读 `00-principles.md` 一份就够**；碰到具体问题时按下表查对应分册。

| # | 分册 | 一句话 |
| --- | --- | --- |
| 00 | [principles](00-principles.md) | **八条铁律 + 结构总纲（分层 · 落位 · 依赖 · 命名 · 测试 · 公共态）+ 一个组件一个目录** |
| 01 | [package-and-repo](01-package-and-repo.md) | 包 · 仓库形态 · 版本与发布 · 旧包处置 |
| 02 | [toolchain](02-toolchain.md) | 构建工具 · 框架 · 语言 · 包管理器 · 脚本入口 |
| 03 | [boundaries](03-boundaries.md) | 目录结构 · 分层职责 · **同层方向** · 谁能 import 谁 · 边界怎么强制 |
| 04 | [host-integration](04-host-integration.md) | 宿主挂载 · 保留前缀 · 代理 · SSE / WebSocket |
| 05 | [data-and-api](05-data-and-api.md) | 传输 · 鉴权 · 后端 SDK · 取数钩子 · 流式 |
| 06 | [state](06-state.md) | **私有跟 feature 走 · 公共放 `stores/`**（判据：有没有自然所有者）· 要不要进地址栏是另一个问题 · 改 store 留动作名 |
| 07 | [routing](07-routing.md) | 地址语法（对象在路径 · 表面在首段 · 面板在具名 query）· 谁说了算 · `routes/` 的结构 · 文档标题 |
| 08 | [i18n](08-i18n.md) | 语言包结构 · 新增语言 · 类型与格式化归属 |
| 09 | [theme](09-theme.md) | token 单一来源 · 主题映射 · 运行期对比度 |
| 10 | [icons](10-icons.md) | 图标工程落点（规格见 design） |
| 11 | [formatting-and-lists](11-formatting-and-lists.md) | 日期/数字/时区 · 长列表与表格 |
| 12 | [motion](12-motion.md) | 动效归属（规格见 design） |
| 13 | [quality-gates](13-quality-gates.md) | 扫描期与构建期门禁 · 检查器清单 |
| 14 | [testing](14-testing.md) | 测试分层（规则见 plan/20） |

> **状态含义**：✅ 已定 = 来自 `plan/01` 已拍板的结论，改动要先改 `plan/01`；
> 🔄 待讨论 = 本目录**新提出**的草案，需要讨论定案后回写 `plan/01`。

## 一条铁律

**视觉规则只在 `design/` 定，工程规则只在本目录定。** 两边都不许在代码里出现"第三份真相"。
