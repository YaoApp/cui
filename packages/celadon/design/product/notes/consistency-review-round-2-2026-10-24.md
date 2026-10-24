# 产品与 Notes 一致性评审（第二轮）

> 评审日期：2026-10-24
> 状态：已完成 · 2026-10-24
> 范围：`design/product` 的产品原型、`00-overview.md` 与 `notes/`
> 前置：[第一轮评审](consistency-review-2026-10-24.md) 已完成

## 1. 第二轮结论

第一轮的 P0、P1 与 P2 已关闭。第二轮继续检查 App 与 Workspace 的边界、平台管理权限、Chatbox 的 Workspace 选择与 Computer 成员角色。P0、P1 与 P2 全部处理完毕，问题已关闭。

## 2. P0

### R2-P0-1 `service.md` 仍保留 App 直接使用 Builder Workspace 的旧模型（已解决）

[`notes/service.md`](../notes/service.md) 内部存在两套模型。

第一套在开篇与发布记录中：

- App 只暴露端口，平台不向 App 挂载 Workspace。
- App 自己管理数据、数据库、文件与用户隔离。
- 发布时只写部署记录，包含 `workspace_id`、`pid` 与 `daemon`。
- 部署记录只用于定位，不授予 App 读取 Workspace 文件的权限。

第二套在第 3、4、5 节：

- App API 的 Workspace 属于 Builder 用户。
- App 可以通过 Workspace API 新建或复用 Workspace，读写这个 Workspace，并决定它分配给哪个用户。
- 同一个 Workspace 可以服务一个或多个 App。
- Yao Secret 被写成代表 Builder 用户，Workspace 也属于 Builder 用户。

这与 [`notes/apps.md`](../notes/apps.md)、[`notes/vault.md`](../notes/vault.md)、[`notes/workspace.md`](../notes/workspace.md) 与 [`notes/permissions.md`](../notes/permissions.md) 的现行规则冲突。现行规则是 App 独立运行、自己管理数据，Workspace 只保存部署索引，App 不因部署记录获得 Workspace 文件访问权。

需要确定 `service.md` 的第 3、4、5 节是否描述旧版接口。如果保留，应标为历史接口并明确与现行 App 模型分离；如果仍服务 Bot API，应改写 Workspace 归属、Secret 身份与授权关系，不能继续写 App 直接读写 Builder Workspace。

2026-10-24 决策：统一到独立 daemon 模型。App 的 Yao Secret 只代表 App 身份，不拥有 Workspace；App 不调用 Workspace API，不传 Workspace ID，也不读取 Bot Workspace 文件。App 调用 Bot 时，平台按 Bot 的 runtime ensure、调用入口与接收者创建或复用 Session 与 Workspace。`service.md` 第 1、2、3、4、5、6、8 节已按此模型改写，旧的 Builder Workspace 归属与 App 自行分配 Workspace 的描述已删除。

### R2-P0-2 平台管理员查看 Bot Workspace 的边界互相矛盾（已解决）

[`notes/service.md`](../notes/service.md) 第 3 节写：

- 分享 Bot 的发布者按普通用户权限不能读取或接管接收者数据，平台管理员视图除外。
- 管理员可以通过平台管理视图查看。

[`notes/permissions.md`](../notes/permissions.md) 第 3 节写：

- 平台管理员不因平台身份自动获得用户内容访问权。
- 平台侧运维与审计使用独立的管理权限与审计流程。
- 平台管理员的应急访问需要单独的审计与双人确认流程。

两份文档对同一个安全边界给出了不同答案。需要明确平台管理员是否有权查看 Bot 的 Workspace 内容、在什么条件下查看、谁批准、是否留审计记录，以及该权限是否覆盖分享 Bot 的接收者数据。当前描述不能直接进入实现。

2026-10-24 决策：平台管理员没有 Workspace 内容访问权，不能查看文件、目录、会话消息、运行输出、凭据或成员名单。平台管理员只能查看 Workspace 名称、标识、作用域、归属、状态、容量与时间等元数据；每次查看都写入只追加的审计记录，记录操作者、字段、原因、请求标识与时间。平台管理员没有应急内容访问通道，`service.md` 与 `permissions.md` 已同步此规则。

## 3. P1

### R2-P1-1 Workspace 角色表遗漏 Admin，和权限模型及原型不一致（已解决）

[`notes/permissions.md`](../notes/permissions.md) 定义 Workspace 角色为 Owner、Admin、Editor、Viewer，其中 Admin 可以读、写、管理成员与作用域，但不能删除。

[`notes/workspace.md`](../notes/workspace.md) 第 2.2 节却写“成员分两档”，表格只有 Viewer 与 Editor；同一文档第 5.2 节与第 5.5 节的成员列表又出现 Owner / Admin / Editor / Viewer，原型数据也包含 `admin` 角色。

结果是 Admin 是否存在、是否能管理成员、是否能删除，在三处说法不同。需要统一 Workspace 角色表，并区分「Workspace Admin」与「Team Admin」两个不同层级的身份。

2026-10-24 决策：`workspace.md` 第 2.2 节改为 Owner、Admin、Editor、Viewer 四档角色表；Owner 可删除，Admin 可管理成员与作用域但不可删除；Team Owner / Team Admin 是团队角色，Workspace Owner / Admin 是资源角色。`permissions.md` 与原型角色数据保持一致。

### R2-P1-2 Chatbox 的 Workspace 选择器仍只有 Private 与 Team（已解决）

[`notes/chatbox.md`](../notes/chatbox.md) 第 44 行要求每个 Workspace 选项显示 Private、Team 或 Specified members 作用域。

[`src/pages/new-session/index.tsx`](../src/pages/new-session/index.tsx) 的 Workspace 模拟数据仍只有：

- `Research`，作用域 `Private`
- `Team handbook`，作用域 `Team`
- `Sandbox`，作用域 `Private`
- `Lab notes`，作用域 `Team`

没有 Specified members，也没有与 Workspaces 模块的 `Research Notes`、`Client Brief` 等真实条目对应。新会话无法选择指定成员空间，名称也与 Workspace 数据源不一致。

2026-10-24 修正：`new-session` 的 Workspace 分组改为从 `workspaceSeed` 派生，显示 `Research Notes`、`Brand Launch`、`Client Brief`、`Design System` 与 `Automation Lab`，覆盖 Private、Team、Specified members 三档作用域，Computer 名称与 Workspaces 数据源一致。

## 4. P2

### R2-P2-1 Computer 的指定成员没有表达 Admin 与 User 角色（已解决）

[`notes/computers.md`](../notes/computers.md) 与 [`notes/permissions.md`](../notes/permissions.md) 都规定 Computer 的 Specified members 要逐个指定 Admin 或 User。

[`src/pages/computers/index.tsx`](../src/pages/computers/index.tsx) 只提供成员多选，选中的成员没有角色控件，数据也只保存 `memberIds`。原型可以表达“指定成员”这一档，但不能表达成员权限差异。

2026-10-24 修正：Computer 的指定成员选择增加 User / Admin 角色选择，节点数据保存 `memberRoles`，详情显示成员与角色；`notes/computers.md` 与 `permissions.md` 的 Admin / User 规则保持一致。

### R2-P2-2 `00-overview` 把云电脑的团队审批写成 Team Owner 审批（已解决）

[`00-overview.md`](../00-overview.md) 第 36 行在云电脑段落写“团队可用与指定成员需 Team Owner 审批”。

[`notes/computers.md`](../notes/computers.md) 的规则是云电脑开通由平台管理员在独立后台审批；Team Owner 负责提交、支付与团队内共享，个人电脑共享才由 Team Owner 审批。当前句子把云电脑开通审批与个人电脑共享审批混在一起，容易让实现者把平台审批错误地交给 Team Owner。

建议拆成两句：云电脑开通由平台管理员审批；个人电脑共享给团队或指定成员由 Team Owner 审批。

2026-10-24 修正：`00-overview.md` 第 36 行已拆开两个审批主体：云电脑开通由平台管理员审批，团队内共享由 Team Owner 配置；个人电脑共享给团队或指定成员由 Team Owner 审批。

## 5. 已核对且未发现冲突的部分

- App 独立 daemon、部署记录只做索引、App 不挂载 Workspace，在 `apps.md`、`vault.md`、`workspace.md` 与 `permissions.md` 中方向一致，问题集中在 `service.md` 的旧接口章节。
- Workspace 与 Computer 的 Private、Team、Specified members 三档作用域在 `permissions.md`、`workspace.md`、`computers.md` 与 `sharing.md` 中方向一致。
- Board 的任务详情在 Browser 打开、列是工作域、`run_status` 七种 API 状态与 `waiting` 展示状态，在 `boards.md` 与原型中一致。
- Bot 默认 Workspace 的名称、Browser 标题与文件列表已经对齐；App 分享窗的 Private、Team、Link 三档已经对齐。

## 6. 未纳入本轮

- 真实权限接口与实时校验实现。
- 平台管理后台的审计流程与双人确认机制。
- Chatbox 的完整成员选择交互。
- Computer 的审批中间态与完整角色变更流程。
- 视觉细节、响应式断点与四语实测。
