# 共享与隔离

> 状态：草案 · 2026-10-19

## 1. App 与 Bot

App 是一个无壳能力内核，加两套寻址面：人面与 Agent 面。人面可以是 App、小程序、H5；Agent 面是可被宿主调用的声明式面。两套面共享同一个内核。

Bot 是固定形态的 App：没有独立人面，只有 chat。把 Bot 分享出去，得到的是一个 chat 入口，而不是一份可编辑的 Bot 配置。

共享 Apps / Bots 时：

- Apps 共享的是 App 入口，接收者可以打开人面，或在支持它的宿主里调用 Agent 面。
- Bots 共享的是 chat 入口，接收者在 Inbox 里直接开始对话。
- App 入口运行在发布者部署的 daemon 上，不向接收者挂载 Workspace；发布记录里的 Workspace 只承担部署索引。
- Bot 入口为每个接收者创建独立 Session 与 Workspace；发布者不读取或接管接收者的数据。
- 接收者看不到发布者的 App 数据、Workspace 文件、凭据与运行记录。

入口可见性仍为 Private、Team、Link；Link 由 Tao 的域名与短链承载。

## 2. App 发布与托管

App 是独立 daemon，自己管理数据、数据库、文件、鉴权与用户隔离。发布时使用 Yao 提供的发布 Tools，在 Workspace 中写入一条部署记录，落到表或数据库，具体存储形式在实现时确定。

部署记录至少包含：

```text
AppDeploymentRecord
  workspace_id
  pid
  daemon
```

记录与真实运行实例分离。Workspace 只保存部署索引与定位信息，不保存 App 的业务数据，也不是 App 的文件系统挂载点。App 不因为部署记录而获得 Workspace 的文件访问权，平台不向 App 注入 Workspace 或 App 域。

如果 App daemon 处于运行状态，它可以保持持久、伺服，不自动关机。普通任务容器仍按任务生命周期回收。

分享入口由 Tao（经 Yao）提供：

- 自动签发 HTTPS 证书。
- 自动分配 hash 二级域名，例如 `39adsfa-axxx.yaoagent.cn`。
- 提供 `yao.run` 短链。
- 支持绑定自定义域名，例如 `myapp.user-name.com`。

接收人点击链接立即可用。访问可以设置账号体系：Ding 提供身份，或使用 OTP。

这适合小范围分享，例如班级学生、实验室搭档、同一个团队。不是公开应用商店。

## 3. Workspace

Workspace 属于一台 Computer，一台电脑可以有 N 个 Workspace；Workspaces 模块跨设备汇总用户可访问的所有电脑。它有三个作用域：

- **Private**：只有自己可见。
- **Team**：当前团队成员可见，按 Viewer / Editor 控制读写。
- **Specified members**：只有被明确加入的成员可见，每个成员单独指定 Admin / Editor / Viewer。

Team Workspace 由 Team Owner / Team Admin 管理；成员默认 Viewer，需要写入时提升为 Editor。Specified members 只授权名单内的成员，Team Owner / Team Admin 可以管理名单，但不在名单内时不能读取内容。没有对外的 Workspace 分享或公开链接；成员授权只用于团队内部。单文件对外传递走临时分享池。

作用域、角色与实时校验规则见 [`permissions.md`](permissions.md)。

要把单个文件交给别人，不共享整个 Workspace，而是：

1. 选中文件，复制到临时分享池。
2. 生成一个带有效期的分享入口。
3. 到期自动清理，源文件与 Workspace 权限不变。

分享池只存副本，不暴露目录结构、仓库历史或其他文件。

## 4. Computer

Computer 是算力资源，也是 App 的托管位置。

- 平台管理员把同类机器组成电脑池；Team Owner 代表团队申请，开通方式可以是自动、审批或付费；团队成员使用已开通并共享的电脑。
- 用户也可以把自己的电脑接入，一次授权后自动连接，不再重复确认；个人电脑共享给团队需 Team Owner 审批，平台管理员不参与。
- 团队电脑可以授权多个用户使用。
- 每个用户在自己的运行空间里跑，互相看不到进程、终端与临时文件。
- 有 App 的宿主机或 Box 自动持久伺服，不自动关机。
- App 之间不共享数据目录，数据隔离由 App 自己负责；平台只隔离进程、端口、临时文件与访问记录。
- 共享电脑不会让用户看到别人的 Workspace；手动挂载时仍要校验 Workspace 的 Private / Team / Specified members 作用域。
- 电脑池不开放公开链接；个人节点只属于绑定它的用户。

手动运行一条任务仍需 Computer 访问权与 Workspace 访问权；已发布 App 由部署记录中的 daemon 与 Computer 确定，部署记录不授予 Workspace 访问权。池、申请与个人节点的规则见 [`computers.md`](computers.md)。

## 5. 权限

- Apps / Bots：Use 与 Manage。Use 打开入口，Manage 修改发布记录与发布设置。
- Workspace：Private、Team、Specified members 三档作用域；Team 内 Viewer 只读、Editor 可读写，Specified members 按成员指定角色，Team Owner / Team Admin 管理授权。
- Computer：Private、Team、Specified members 三档作用域，角色为 Admin / User；Use 运行任务，Manage 安装、重启、改授权。

共享不传递：共享 App/Bot 不共享整个 Workspace，共享 Computer 不共享文件。

## 6. 普通用户的界面

普通用户侧保留四个动作：

1. **Share App / Bot**：发布入口，选择域名与 Ding / OTP，得到链接或 chat 入口。
2. **Workspace 作用域**：切换 Private / Team / Specified members；Team 内设置 Viewer / Editor，Specified members 按成员指定角色，不出现 Share。
3. **分享文件**：复制到临时分享池，设置有效期。
4. **使用电脑**：申请电脑池，或绑定自己的电脑。

App 的部署记录、daemon 状态与 Tao 隧道在发布面板里，普通使用不需要理解底层。

## 7. 现有 API 的差距

- assistant 的 `share` / `public` 只表达资源可见性，不包含 App 的部署记录、`workspace_id` / `pid` / `daemon` 生命周期与入口发布。
- Workspace 当前以 TeamID 为 owner，团队内全部可见，没有 Private / Team / Specified members 作用域、Admin / Editor / Viewer 角色、成员表与每次请求的实时校验。
- Computer 节点与 box 的 owner 都优先取 TeamID，缺少电脑池、申请审批、个人节点一次性绑定、持久伺服状态、用户级运行空间与 App 运行隔离。
- 没有面向 App 入口的域名、证书、短链与 Ding / OTP 接入层；Tao 隧道需要和 Yao 的发布流程接起来。
- Board 有团队与创建者字段，但没有共享字段。

## 8. 待定

- App 部署记录的存储形式与字段版本：表、数据库或 Workspace 文件。
- 一个 Computer 上多个 App 的端口、域名与资源配额如何分配。
- 自定义域名的验证与证书签发流程。
- Ding 与 OTP 的默认策略，以及访客是否允许匿名试看。
- App 更新后，已分享入口是实时更新还是冻结版本。
- 团队可见的 Workspace，团队成员是否默认可写，还是只读。
