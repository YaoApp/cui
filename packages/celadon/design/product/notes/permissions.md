# 权限模型

> 状态：草案 · 2026-10-24
> 范围：Computer、Workspace，以及引用它们的 App、Bot 与 Session

## 1. 定位

权限模型解决两个问题：

- 谁可以看到并使用一台 Computer。
- 谁可以读取、修改与管理一个 Workspace。

Computer 与 Workspace 各自有独立的访问作用域与角色。Computer 使用权不等于 Workspace 访问权；Workspace 访问权也不自动带来 Computer 使用权。

## 2. 三个作用域

Computer 与 Workspace 都支持三档作用域：

| 作用域 | 谁可以访问 | 适用对象 |
| --- | --- | --- |
| **Private** | 只有所有者 | 个人资源，默认档 |
| **Team** | 当前团队的全部成员 | 团队共用资源 |
| **Specified members** | 只有被明确加入的成员 | 跨团队协作、临时项目、敏感资源 |

作用域决定可见范围，角色决定可以做什么。两者不能互相替代。

## 3. 角色

### 3.1 Workspace

| 角色 | 读取 | 写入 | 管理成员与作用域 | 删除 |
| --- | --- | --- | --- | --- |
| Owner | 可以 | 可以 | 可以 | 可以 |
| Admin | 可以 | 可以 | 可以 | 不可以 |
| Editor | 可以 | 可以 | 不可以 | 不可以 |
| Viewer | 可以 | 不可以 | 不可以 | 不可以 |

- Owner 是 Workspace 的所有者，可以是个人或团队。
- Team 作用域下，团队成员默认 Viewer；需要写入时提升为 Editor。
- Specified members 作用域下，每个被加入的成员单独指定 Admin、Editor 或 Viewer。
- Team Owner / Team Admin 可以管理 Team 资源的成员与作用域；对 Specified members 资源只管理授权名单，不因管理身份自动获得内容读取权。

### 3.2 Computer

| 角色 | 使用 | 管理安装、重启与授权 | 撤销共享 |
| --- | --- | --- | --- |
| Owner | 可以 | 可以 | 可以 |
| Admin | 可以 | 可以 | 可以 |
| User | 可以 | 不可以 | 不可以 |

- Team 作用域下，团队成员默认获得 User；需要管理能力时提升为 Admin。
- Specified members 作用域下，每个成员单独指定 Admin 或 User。
- 个人电脑的团队共享由 Team Owner 审批；审批通过后，被授权成员按角色使用。

### 3.3 平台管理员

平台管理员没有 Workspace 内容访问权，不因为是平台经营者而获得文件、目录、会话消息、运行输出、凭据或成员名单的读取能力。

平台管理员只能查看 Workspace 的运行元数据：

| 字段 | 说明 |
| --- | --- |
| `workspace_id` | Workspace 标识 |
| `name` | Workspace 名称 |
| `scope` | Private、Team 或 Specified members |
| `owner_type` | 个人或团队 |
| `team_id` | 所属团队，个人为否 |
| `status` | 正常、封禁、迁移中或删除中 |
| `storage_bytes` | 容量用量 |
| `created_at` / `updated_at` | 创建与更新时间 |

每次查看元数据都写入审计记录，包括操作者、Workspace 标识、查看字段、访问原因、请求标识、时间与结果。审计记录只追加，不允许修改或删除；查看文件内容不在允许范围内。

平台管理员没有应急内容访问通道。需要新增任何内容级运维能力时，必须另行定义授权、双人确认与审计规则，不能沿用本条元数据权限。

## 4. 实时校验

权限是实时状态，不是会话创建时的快照。

- 每次列表、读取、预览、上传、重命名、删除、运行与 Git 操作都重新校验当前作用域、成员关系与角色。
- 成员被移出团队、被移出指定成员名单、角色被降级或作用域被收紧后，下一次请求立即按新权限处理。
- 已经运行中的进程不因权限撤销被强制杀死，但后续读取、写入与网络访问按新权限拒绝。
- UI 通过权限变更事件刷新按钮、只读标记与可见范围；不依赖本地缓存的旧权限。
- 权限检查在服务端完成，前端隐藏按钮只用于表达状态，不能作为授权依据。

## 5. 组合规则

### 5.1 Computer 与 Workspace

- 打开 Workspace 前需要同时具备 Computer 使用权与 Workspace 访问权。
- 只有 Workspace 访问权而没有 Computer 使用权时，列表可以显示资源，但打开与运行被拒绝，并说明缺少 Computer 授权。
- 只有 Computer 使用权而没有 Workspace 访问权时，可以使用电脑，但不能读取该 Workspace 的文件。
- 撤销 Computer 使用权不删除 Workspace；恢复授权后按当时的 Workspace 权限重新校验。

### 5.2 App 与 Bot

- App 的部署记录只用于定位，不授予 Workspace 文件访问权。
- Bot 默认会话的 Workspace 与 Computer 由运行时 ensure 生成并绑定；绑定不绕过权限检查。
- 分享 Bot 为每个接收者创建独立 Session 与 Workspace；发布者不读取接收者数据。
- App、Bot 以服务身份访问资源时使用独立的服务授权，不沿用终端用户的团队身份。

## 6. 作用域变更

作用域变更只改变访问关系，不移动或复制数据。

| 变更 | 结果 |
| --- | --- |
| Private → Team | 当前团队成员按默认角色获得访问；所有者保留 Owner |
| Private → Specified members | 只有被加入的成员获得访问；其余人不可见 |
| Team → Specified members | 明确选择保留的成员；未选择的成员立即失去访问 |
| Team → Private | 除所有者外的成员与角色立即失效 |
| Specified members → Team | 当前团队成员按默认角色获得访问；原有成员角色保留 |
| 任意变更 → 同一作用域内调整角色 | 下一次请求立即按新角色处理 |

变更由 Owner、Team Owner 或 Team Admin 发起。变更前显示将失去访问的成员；变更后不删除文件、不重建 Workspace，也不回滚已经产生的审计记录。

## 7. 数据模型

```text
ResourceAccess
  resource_type      computer | workspace
  resource_id
  scope              private | team | members
  owner_id
  team_id            nullable
  grants[]
  updated_at

AccessGrant
  subject_type       user
  subject_id
  role               workspace: owner | admin | editor | viewer
                     computer: owner | admin | user
  granted_by
  granted_at
```

- `scope=private` 时只有 `owner_id` 有效，`grants` 为空。
- `scope=team` 时成员来自当前团队，`grants` 保存角色覆盖；团队成员变化后实时生效。
- `scope=members` 时只有 `grants` 中的用户有效，不按团队成员关系自动扩展。
- 每次请求由服务端计算有效角色；不把计算结果写回客户端作为长期凭据。

## 8. 引用关系

- [`workspace.md`](workspace.md) 描述 Workspace 的文件、界面与创建流程。
- [`computers.md`](computers.md) 描述 Computer 的池、申请、接入与撤销。
- [`sharing.md`](sharing.md) 描述分享入口与临时文件分享。
- [`bots.md`](bots.md) 描述 Bot 默认空间与分享服务的运行时 ensure。
- [`service.md`](service.md) 描述 App 与 Bot 的数据边界。

## 9. 边界与待定

- 指定成员是否支持团队分组，当前只支持单个用户。
- 访客与外部链接不在本模型内；单文件分享仍走临时分享池。
- 目录级、文件级权限不在本期；Workspace 是当前最小授权单位。
- 平台管理员没有内容访问权；元数据查看必须留审计记录。
- 跨 Computer 迁移 Workspace 不属于权限变更，按 Workspace 迁移规则处理。
