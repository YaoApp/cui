# Workspace

> 状态：草案 · 2026-10-24 · 用户版原型

## 1. 模型

Workspace 是文件与数据的容器，属于一台 Computer。Workspaces 模块跨设备统一管理，汇总当前用户可访问的所有 Computer 上的 Workspace，不是单机列表。

```text
User
  ├─ Computer A
  │    ├─ Workspace A1
  │    └─ Workspace A2
  └─ Computer B
       └─ Workspace B1
```

一台电脑可以有 N 个 Workspace。Workspace 创建时绑定一台电脑，文件存在这台电脑上；换电脑不是移动，而是复制或重新创建。

Workspace 有两个作用域：

- **Private**：只有所有者可见。
- **Team**：当前团队成员可见，按读写权限控制。

没有 Workspace 分享、公开链接或按文件授权。单文件对外传递走临时分享池。

### 1.1 会话中的 Workspace

- 会话开始时确定 Workspace，主线确定后固定，不能在会话中切换。
- 需要另一套文件时新建会话，不复用当前会话的上下文。
- 会话详情右上角显示当前 Workspace；点击在 Browser 打开工作区文件。
- 支线默认继承所在会话的 Workspace；自动支线是否允许使用其他 Workspace 由会话 Settings 设置。
- Chatbox 不提供 Workspace 选择或切换。

## 2. 权限

### 2.1 Private

只有所有者可以读、写、管理。团队管理员也看不到内容。

### 2.2 Team

Team Workspace 由 **Team Owner / Team Admin** 管理。成员分两档：

| 角色 | 读 | 写 | 管理成员与删除 |
| --- | --- | --- | --- |
| Viewer | 可以 | 不可以 | 不可以 |
| Editor | 可以 | 可以 | 不可以 |

- Team Owner / Team Admin 自动拥有管理权。
- 团队成员默认是 Viewer；需要写入时由 Owner / Admin 提升为 Editor。
- 创建者如果不是管理员，默认是 Editor。
- 读写控制覆盖文件列表、读取、预览、上传、重命名、删除与 Git 写操作。
- 只读用户看到的写操作按钮为禁用态，并显示原因。

## 3. 与 Computer 的关系

- Workspace 绑定一台 Computer，Computer 提供存储与运行位置。
- 一台 Computer 可以有多个 Workspace，彼此目录隔离。
- Computer 的使用权不等于 Workspace 的访问权。用户先要有 Computer 使用权，才能挂载自己可访问的 Workspace。
- 失去 Computer 使用权时，Workspace 不会被删除，只是暂时不能运行；恢复授权后继续使用。
- App 只能访问发布时指定的 App 域，不能遍历整个 Workspace。

## 4. 与 App 的关系

App 发布时绑定 Workspace 与 Computer，并指定 App 域。

- Workspace 是数据来源。
- App 域是 Workspace 中的一个目录、向量库或知识库。
- App 只挂载 App 域，不挂载整个 Workspace。
- App 的读写受 Workspace 权限约束，不能越权。

## 5. 界面

### 5.1 列表

Workspaces 分两组：

- **My workspaces**：Private 与自己创建的。
- **Team workspaces**：当前团队可见的。

每行显示名称、作用域、所在 Computer 与角色；详情头部显示最近更新时间。Team 只读的 Workspace 带只读标记。

进入模块先显示概览，列出全部工作空间与数量统计。选择一条后进入详情，详情头部可返回概览；左侧导航标题也回到概览。

### 5.2 详情

- **Files**：目录列表、面包屑、上传、新建文件夹、重命名与删除。文件预览在内容区独占打开，也可在 Browser 打开；预览自带目录切换。
- **Access**：仅 Team Workspace 出现，列出成员与 Viewer / Editor 角色。
- **Apps**：使用这个 Workspace 的 App 与 App 域。
- **Settings**：名称、作用域、绑定的 Computer 与删除。Computer 只展示绑定关系，不提供直接更换。

Git 跟目录走，不在 Workspace 或文件列表上提供全局 Git 操作。带 Git 的目录在列表中显示分支图标；更细的 Git 界面后续再做。

### 5.3 新建

新建时选择：

1. 名称。
2. 所在 Computer。
3. 作用域：Private 或 Team。

Team Workspace 创建后，创建者默认是 Editor；Team Owner / Admin 可以调整成员。

### 5.4 只读状态

Viewer 看不到可用的写操作：

- 上传、新建目录、重命名与删除为禁用。
- 读取、预览、下载可用。
- Git 只按目录展示状态，不提供写入入口。
- 禁用按钮要有说明，不只变灰。

### 5.5 用户版原型

原型入口为 `/workspaces`。进入后先显示概览，统计全部工作空间、Private、Team 与绑定的 Computer，并按我的工作空间与团队工作空间列出全部条目。选择任意条目进入详情；详情头部返回概览。

左侧二级导航按我的工作空间与团队工作空间分组。每个工作空间显示名称、作用域、所在 Computer 与角色；只读成员带只读标记。左栏底部提供新建工作空间。

右侧详情包含：

- **文件**：目录列表、面包屑、上传、新建文件夹、重命名与删除。文件预览在内容区独占打开，也可在 Browser 打开；预览自带目录切换。
- **成员**：仅 Team 工作空间出现，列出成员与 Owner / Admin / Editor / Viewer 角色。Owner / Admin 可以邀请成员与调整角色。
- **应用**：使用这个工作空间的 App 与 App 域。
- **设置**：名称与作用域可修改，所在 Computer 只展示绑定关系，不提供直接更换；需要换电脑时复制或重新创建工作空间。

Git 跟目录走。带 Git 的目录在文件列表中显示分支图标与未提交变更数，不提供全局 Git 按钮；更细的 Git 界面后续再做。

新建时选择名称、Computer 与作用域；Team 工作空间创建后，创建者默认为 Editor。

文件预览提供分享链接。分享只复制当前文件，不包含目录结构、Git 历史与其他文件，有效期可选 1、7 或 30 天，创建后可复制链接。

Bots 默认工作空间在 Bot 首页右侧 Browser 面板打开，只显示该空间的文件，不跳转到 Workspace 页面，也不显示 Workspace 侧栏、其他 Workspace 或 Access / Apps / Settings 标签。

## 6. 单文件分享

Workspace 本身不分享。需要把单个文件交给别人时：

1. 选中文件，复制到临时分享池。
2. 生成带有效期的入口。
3. 到期自动清理。

分享池只存副本，不暴露目录结构、仓库历史或其他文件。分享池是内部实现概念，界面统一称「分享链接」，不向用户展示分享池。

## 7. 现有 API 的差距

- `workspace.Workspace` 只有单个 `Owner` 字段，团队上下文下直接写 TeamID。
- 列表按 `Owner` 过滤，团队内所有 Workspace 对成员可见，没有 Private / Team 作用域。
- 读写接口只检查 `Owner`，没有 Viewer / Editor 角色。
- 没有成员表、角色变更与 Team Owner / Admin 的管理入口。
- App 域还没有进入 Workspace 的权限模型。
- 一台 Computer 多个 Workspace 的目录模型已经存在，但界面没有把 Computer 作为 Workspace 的归属展示出来。

## 8. 待定

- Team Workspace 是否允许成员申请 Editor。
- Workspace 是否允许跨 Computer 迁移。
- Workspace 是否支持嵌套目录级权限。
- Team Owner 与 Team Admin 的权限边界是否完全一致。
