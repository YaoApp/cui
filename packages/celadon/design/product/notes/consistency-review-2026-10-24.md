# 产品与 Notes 一致性评审

> 评审日期：2026-10-24
> 状态：已完成 · 2026-10-24
> 范围：`design/product` 的产品原型、`00-overview.md` 与 `notes/`
> 结论：主干链路已经成形，App 与 Bot 的资源边界、Computer 与 Workspace 的权限模型已经确定
> 更新：2026-10-24 已处理 P0-1、P0-2、P0-3、P1-1、P1-2、P1-3、P1-4、P1-5、P1-6、P1-7、P2-1、P2-2 与 P2-3；本文按解决进度更新状态

## 1. 评审边界

本轮对照以下对象的归属、权限、生命周期与入口：

- Workspace 与 Computer
- Bot 与 Session
- App 与 Bot
- Board 与任务
- Browser 与 Workspace 文件
- Vault 与密钥授权

初稿只记录问题；已解决条目保留原冲突描述，并补充决策与同步范围。本文中的建议是决策方向，不代表尚未实施的设计。

## 2. 一致的主干

以下链路在 Notes 与原型中基本一致：

- Workspace 绑定一台 Computer，Computer 与 Workspace 的 Private / Team / Specified members 作用域、角色与实时校验方向一致。
- Bots 首页不显示 Workspace 选择，系统分配专属 Workspace 与 Computer，右上角的「工作空间」入口在 Browser 面板打开。
- Session 详情与 Board 的任务详情都使用右侧 Browser，不跳转到 Workspace 页面。
- 单文件通过带有效期的分享链接交付，不共享整个 Workspace。
- Board 的列表示工作域，卡片对应 Session，运行状态独立表达，这个方向已经建立。

## 3. 阻塞级问题

### P0-1 App 的数据边界存在两套互斥模型（已解决）

同一个 App 对象在不同文档中有两种定义（解决前）：

- [`notes/service.md`](../notes/service.md) 第 1、2、5 节：App 是独立 daemon，只暴露端口；平台不向 App 挂载 Workspace；App 的数据、数据库、文件和用户隔离由 App 自己负责。
- [`notes/sharing.md`](../notes/sharing.md) 第 1、2 节：App 绑定 Workspace 与 Computer，Workspace 是 App 的数据与文件来源，发布时指定 App 域，后端通过文件系统隔离。
- [`notes/workspace.md`](../notes/workspace.md) 第 3、4 节：App 发布时绑定 Workspace 与 Computer，只挂载 App 域。
- [`notes/apps.md`](../notes/apps.md) 第 1 节把 Workspace 列为 App 的资源。
- [`notes/vault.md`](../notes/vault.md) 第 5 节又写 App 跟随绑定的 Workspace 使用 Vault，并由平台在运行时注入密钥。
- [`00-overview.md`](../00-overview.md) 第 2 节沿用了「App 发布时绑定 Workspace 与 Computer，只暴露 App 域」的描述。

冲突结果：无法确定 App 的数据究竟由 App 自己管理，还是由平台 Workspace 承载。这个问题会同时影响 Apps 列表、发布流程、分享、Vault、审计与数据迁移。

2026-10-24 决策：采用独立 App 模型。App 自己管理数据、数据库、文件与鉴权。Yao 发布 Tools 在 Workspace 写入一条部署记录，记录至少包含 `workspace_id`、`pid` 与 `daemon`；记录与真实运行实例分离，Workspace 只承担部署索引，不挂载为 App 数据目录，也不构成 App 域。

文档已同步到 [`notes/service.md`](../notes/service.md)、[`notes/sharing.md`](../notes/sharing.md)、[`notes/workspace.md`](../notes/workspace.md)、[`notes/computers.md`](../notes/computers.md)、[`notes/apps.md`](../notes/apps.md)、[`notes/vault.md`](../notes/vault.md) 与 [`00-overview.md`](../00-overview.md)。Apps 列表原型已移除 Workspace 字段。

### P0-2 分享 Bot 的运行位置与数据隔离（已解决）

- [`notes/sharing.md`](../notes/sharing.md) 第 1 节：Bot 入口为每个接收者创建独立 Session 与 Workspace，发布者不读取或接管接收者的数据。
- [`notes/bots.md`](../notes/bots.md) 第 3.3 节：分享 Bot 的每个外部用户创建自己的 Session，平台为该用户创建独立 Workspace；同一接收者再次进入时复用，不写回 Builder Workspace。
- [`notes/service.md`](../notes/service.md) 第 5 节：分享 Bot 与标准界面一样按接收者创建 Workspace；发布者按普通用户权限不能读取或接管。

2026-10-24 决策：分享 Bot 为每个接收者创建独立 Session 与 Workspace。发布者不读取、不写回、不接管接收者的数据；分享出去的是 Bot 能力与服务定义，不是发布者的默认空间。

### P0-3 Vault 与 App 的注入方式冲突（已解决）

- [`notes/vault.md`](../notes/vault.md) 第 5 节（解决前）：App 跟随绑定 Workspace 使用一个 Vault，平台在运行时注入密钥引用。
- [`notes/service.md`](../notes/service.md) 第 2、5 节：平台不挂载 Workspace，App 有自己的鉴权，平台不向 App 注入终端用户身份；App 通过 Yao Secret 或 API 使用平台能力。
- [`notes/sharing.md`](../notes/sharing.md) 第 5 节：共享 App 不传递所有者的密钥。

冲突结果：平台是否能把密钥直接注入 App，和 App 是否是独立 daemon、是否自己管理鉴权，不能同时成立。Vault 的 App 级授权、审计和故障提示都依赖这个答案。

2026-10-24 决策：Yao 提供 Vault API。App 使用自己的 Yao Secret 调用，平台不向 App 挂载或注入 Workspace，也不注入密钥。在 Vault 授权上，App 发布时只需要一个稳定的 App ID；授权、审计与撤销都按 App ID 记录，不按 Workspace ID 绑定。密钥值不进入 App 代码、环境变量、Workspace 文件或发布记录。

文档已同步到 [`notes/vault.md`](../notes/vault.md)、[`notes/service.md`](../notes/service.md) 与 [`00-overview.md`](../00-overview.md)。

## 4. 重要级问题

### P1-1 Board 的默认列违背「列是工作域」（已解决）

- [`notes/boards.md`](../notes/boards.md) 第 1 节与第 6 节：列表示工作域，不把运行状态写进列名。
- 同文档第 6 节：新建看板默认包含「待办、进行中、已完成」三列。
- 原型 [`src/pages/boards/index.tsx`](../src/pages/boards/index.tsx) 的新建看板逻辑也生成这三列。

这三列正好是运行状态，不是工作域。用户创建第一张看板时会学到错误的列模型。

2026-10-24 已实现：新建看板提供市场调研、内容运营、客户交付三个场景模板，列为行业研究、竞品分析、用户访谈、数据洞察等内容，不提供状态列模板。原型的模板预览、创建逻辑与 `notes/boards.md` 已同步。

### P1-2 Board 的 Browser 行为在文档内部仍有冲突（已解决）

- [`notes/boards.md`](../notes/boards.md) 第 1 节与第 5 节：任务详情是右侧 Browser 的 tab item，不覆盖看板。
- 同文档第 6 节仍写「看板只承载任务与会话，不展开分支树、浏览器或完整运行日志」。
- [`00-overview.md`](../00-overview.md) 第 4 节仍写「点击卡片从右侧打开任务详情」，没有说明 Browser。

实现已经改为 Browser，文档后半段仍是旧表述。建议把「不展开浏览器」改成「不把 Browser 嵌进任务卡，Browser 是右侧独立栏」，并同步 overview。

2026-10-24 已处理：`notes/boards.md` 第 6 节改为任务详情在右侧 Browser 的 tab 中打开，`00-overview.md` 第 4 节同步 Browser 与 tab item。

### P1-3 Board 的状态枚举与接口枚举没有对齐（已解决）

- [`00-overview.md`](../00-overview.md) 第 4 节列出的 `run_status` 是 `pending`、`queued`、`running`、`completed`、`failed`、`stopped`、`cancelled`。
- [`notes/boards.md`](../notes/boards.md) 第 3、4 节使用「待开始、运行中、等待中、已完成、失败」。
- 原型 [`src/pages/boards/data.ts`](../src/pages/boards/data.ts) 的 `BoardStatus` 是 `pending`、`running`、`waiting`、`completed`、`failed`。
- 原型筛选写「等待中」，状态元数据写「等待输入」。

缺少 `queued`、`stopped`、`cancelled` 的显示规则，同时新增了接口未声明的 `waiting`。需要明确 `waiting` 是接口状态，还是由运行事件推导出的展示状态。

2026-10-24 已处理：`BoardRunStatus` 与接口的 7 个 `run_status` 对齐；`waiting` 保留为 `running` 下的展示状态，不写入接口。原型补充已排队、已停止、已取消的状态元数据、筛选与计数，`waiting` 的筛选文案统一为「等待输入」。

### P1-4 Bot 定义缺少 Workspace 与 Computer 字段（已解决）

- [`notes/bots.md`](../notes/bots.md) 第 2 节的 Bot 组成为 identity、instruct、llm、runner、skills、vault access policy、publish，没有 Workspace 与 Computer。
- 同文档第 3.2 节又要求 Bots 默认会话由系统分配专属 Workspace 与 Computer。
- [`00-overview.md`](../00-overview.md) 第 2 节同样要求系统自动分配。

因此 Bot 定义无法回答三个实现问题：Workspace 在创建 Bot 时生成，还是在首次打开会话时生成；Computer 如何选择；Bot 删除或转移时 Workspace 如何处理。

建议把 Workspace 与 Computer 明确写成 Bot 的运行时绑定，不写入 Bot 定义本身；同时补上创建、删除、归档与迁移的生命周期。

2026-10-24 已处理：Bot 定义不写 Workspace 与 Computer，改为运行时 ensure。ensure 按 `bot_id`、绑定模式与接收者查询已有绑定；没有则按 Workspace、Runner、电脑池、配额与可用性检查并创建，再自动绑定。ensure 幂等，电脑不可用时不产生半个绑定；Bot 归档、删除与所有权转移不自动重建或删除默认 Workspace。`notes/bots.md` 第 2、3.0、3.2 节与 `00-overview.md` 已同步。

### P1-5 Apps 列表仍把 Workspace 当作普通用户字段（已解决）

- [`notes/apps.md`](../notes/apps.md) 第 1 节把 Workspace 列入列表资源字段。
- [`00-overview.md`](../00-overview.md) 第 3 节要求 Apps 列表展示 Workspace。
- Bots 已经按「个人 Agent，上手即用」隐藏 Workspace，Apps 仍暴露资源绑定。

这与 Bots 与 Apps 应该同为上手即用入口的定位不一致。建议普通用户列表只显示身份、分类、界面形态、状态与更新时间；Workspace 与 Computer 放在 Manage 或发布详情中。

2026-10-24 已处理：Apps 列表、搜索与卡片标签已移除 Workspace 字段，`apps.md` 与 `00-overview.md` 已同步。

### P1-6 Computers 的角色与审批主体不明确（已解决）

- [`notes/computers.md`](../notes/computers.md) 第 1、2 节：系统管理员建池，Team Owner 才能接入云电脑。
- 同文档第 2 节：Team Owner 在管理后台审批。
- 同文档第 5 节：系统管理员负责审批与撤销，Team Owner 管理本团队池与配额。
- 同文档第 6 节：系统管理员的审批后台独立于用户版。

审批主体到底是系统管理员还是 Team Owner，池的配置权与团队配额权如何分开，目前没有唯一答案。普通用户是否能自行申请云电脑也没有明确流程。

建议拆成三层权限：系统管理员建池与分配资源；Team Owner 管理团队配额与成员申请；普通用户使用已授权电脑或申请团队配额。

2026-10-24 决策：云电脑开通的审批主体是平台管理员，即平台经营者；审批只发生在独立的系统管理后台。个人电脑共享给团队是团队内权限，由 Team Owner 审批，平台管理员不参与。Team Owner 与 Team Admin 是用户侧角色，负责团队成员配额、共享、提交申请、积分支付与撤销，不能进入平台审批后台。平台管理员负责电脑池、节点与云电脑审批；Team Owner 可以撤销团队有权撤销的电脑，也可以完成支付。

文档已同步到 [`notes/computers.md`](../notes/computers.md)、[`notes/sharing.md`](../notes/sharing.md) 与 [`00-overview.md`](../00-overview.md)。

### P1-7 Workspace 作用域变更缺少迁移规则（已解决）

- [`notes/workspace.md`](../notes/workspace.md) 的 Settings 允许把工作空间在 Private 与 Team 之间切换。
- 文档没有说明切换后成员是否保留、Team 成员是否能立即访问、文件与 App 部署记录是否变化、Viewer 的只读权限是否保留。

这与 Workspace 是数据与权限边界的定位冲突。建议限制已存在成员的 Team Workspace 直接降为 Private，或者把作用域变更定义为显式的迁移操作。

2026-10-24 决策：新增 [`notes/permissions.md`](../notes/permissions.md) 作为 Computer 与 Workspace 的统一权限模型。两者均提供 Private、Team、Specified members 三档作用域，角色与成员关系在每次请求时实时校验。作用域变更按显式迁移处理，不移动数据；Team 转 Specified members 时未保留的成员立即失去访问，Team 转 Private 时除所有者外的授权失效。`workspace.md`、`computers.md`、`sharing.md` 与 `00-overview.md` 已引用该模型。原型中的 Workspaces 与 Computers 已同步三档作用域、成员选择与角色标识，截图见 `app/logs/2026-10-24/shots/workspaces-specified-*` 与 `computers-specified-*`。

## 5. 原型与文档漂移（已解决）

### P2-1 Bot 的默认 Workspace 名称与文件来源不一致（已解决）

- [`src/pages/bots/data.ts`](../src/pages/bots/data.ts) 给研究员映射 `research-notes`，给分析师映射 `automation-lab`，给编辑映射 `brand-launch`。
- Bot Browser 的标题使用 `Research`、`Data`、`Editorial`，文件列表却来自 `Research Notes`、`Automation Lab`、`Brand Launch`。
- [`src/pages/workspaces/data.ts`](../src/pages/workspaces/data.ts) 只有后一组真实名称。

演示时用户会看到 `Data` 空间里出现 `Automation Lab` 的文件，或者 `Editorial` 空间里出现 `Brand Launch` 的文件。当前是原型映射问题，不是产品规则，但会干扰对 Workspace 归属的理解。

建议为每个 Bot 建立独立的默认 Workspace 数据，或者 Browser 直接显示映射后的真实 Workspace 名称。

2026-10-24 修正：Bot 配置中的 Workspace 名称改为映射后的真实名称 `Research Notes`、`Automation Lab` 与 `Brand Launch`；Bot 首页按钮、Browser 标题与文件列表使用同一名称。

### P2-2 00-overview 仍落后于 Board（已解决）

- [`00-overview.md`](../00-overview.md) 的日期与 Apps 字段已经更新。
- 第 4 节仍没有说明 Board 任务详情在 Browser 打开。

建议在 P0 决策完成后统一刷新 overview，不逐条修补局部句子。

2026-10-24 修正：`00-overview.md` 第 4 节已包含 Board 任务详情在右侧 Browser 打开，任务作为 Browser tab item，含会话、信息、文件与运行四个分区；同时把 Workspace 与 Computer 的两档作用域描述更新为 Private、Team、Specified members 三档。

### P2-3 Apps 分享可见范围与共享模型不一致（已解决）

- [`notes/sharing.md`](../notes/sharing.md) 第 1 节使用 Private、Team、Link 三种可见性。
- [`notes/apps.md`](../notes/apps.md) 第 3 节只提供 Team 与 Anyone with link，没有 Private。

如果 App 默认不可分享，需要明确说明；如果 App 也支持 Private，则 Apps 分享窗缺一项。

2026-10-24 修正：`apps.md` 的分享窗补齐 Private、Team 与 Anyone with link 三档。Private 只有发布者可见；Team 对当前团队成员可见；Link 对拿到链接的人可见。分享的仍是 App 入口，不共享 App 数据、Vault 或运行记录。App 分享窗原型同步支持三档，Private 不生成对外链接。

## 6. 结论

当前主干的页面关系已经清楚，尤其是 Workspace 归属、Bots 默认空间、Session 与 Board 的 Browser 侧栏。App 数据边界、Vault 注入与分享 Bot 的数据隔离已经确定，资源边界不再有未决项。

剩余差异集中在接口接入与实现细节。

## 7. 未纳入本轮

- 各页面的视觉细节与响应式断点。
- 真实接口与权限实现。
- Realtime、Call、Outreach 的完整状态机。
- Apps 三个示例应用的内部布局。

## 8. 评审完成

第一轮 P0、P1 与 P2 项均已关闭，产品原型与 Notes 在本轮范围内一致。第二轮评审另见 [`consistency-review-round-2-2026-10-24.md`](consistency-review-round-2-2026-10-24.md)。
