# 03 · 桥命令清单（全部要做的命令）

- **版本**：v0.2
- **最后修改**：2026-10-03 18:40
- **说明**：全部命令逐条列出（参数 · 返回 · 来源 · 状态）· 命名规则 · 实现顺序

> 规则在 `YaoApp/cui` 的 `packages/celadon/architecture/15-platform.md` §6（域与职责）与 §5（客户端）。
> 本文只回答：**要写哪些命令、叫什么、收什么、回什么、从哪来、做到哪了**。

## 1. 命名规则

- 一律 `celadon_<域>_<动词>`；域取 `15 §6.1` 的七类：`credential` · `local` · `tai` · `engine` · `env` · `tunnel` · `system`；另有 **`ping`**（宿主自述，不属任何域）
- 动词统一：`get` · `set` · `list` · `read` · `write` · `remove` · `start` · `stop` · `restart` · `status` · `probe` · `open` · `pick` · `reveal` · `apply` · `check` · `import`
- **命令名与前端一字不差**：前端 `platform/bridge/<域>.ts` 里的常量名 = Rust 的 `pub fn` 名
- **失败一律 `Result<_, String>`**（可读原因），**不 panic**；凭据类**秘密不回前端**

## 2. 命令清单（共 56 条）

**状态**：`已实现` / `待实现`。

### 宿主 · 1 条

| 命令 | 参数 | 返回 | 来源 | 状态 |
| --- | --- | --- | --- | --- |
| `celadon_ping` | — | `HostStatus{available, version, commands}` | 新增（验证函数）| **已实现** |

### 凭据 `credential` · 4 条

| 命令 | 参数 | 返回 | 来源 | 状态 |
| --- | --- | --- | --- | --- |
| `celadon_credential_list` | — | `CredentialMeta[]{service, account}`（**不含秘密**）| 新增 | **已实现** |
| `celadon_credential_read` | `service` | `String`（秘密；只在交给服务端时用）| 新增 | **已实现** |
| `celadon_credential_write` | `service, secret, account` | `bool` | 新增 | **已实现** |
| `celadon_credential_remove` | `service` | `bool`（本来不存在回 `false`）| `clear_cookies` · `set_preference_cookies`（旧）| **已实现** |

### 本地服务 `local` · 6 条

| 命令 | 参数 | 返回 | 来源 | 状态 |
| --- | --- | --- | --- | --- |
| `celadon_local_start` | — | `()` | `start_yao_server` | 待实现 |
| `celadon_local_stop` | — | `()` | `stop_yao_server` | 待实现 |
| `celadon_local_restart` | — | `()` | `restart_yao_server` | 待实现 |
| `celadon_local_status` | — | `LocalStatus{running, pid, port, version}` | `get_yao_server_status` | 待实现 |
| `celadon_local_shell_open` | — | `()` | `open_yao_run_shell` | 待实现 |
| `celadon_local_log_tail` | `lines` | `String` | 新增（旧壳有日志但无此命令）| 待实现 |

### tai · 6 条

| 命令 | 参数 | 返回 | 来源 | 状态 |
| --- | --- | --- | --- | --- |
| `celadon_tai_path` | — | `Option<String>` | `get_tai_path` | 待实现 |
| `celadon_tai_version` | — | `String` | 新增（旧有版本读取逻辑）| 待实现 |
| `celadon_tai_status` | — | `TaiStatus{reachable, version, latency_ms}` | 新增 | 待实现 |
| `celadon_tai_data_dir` | — | `Option<String>` | 新增 | 待实现 |
| `celadon_tai_update_check` | — | `UpdateInfo{current, latest, available}` | 旧更新流程 | 待实现 |
| `celadon_tai_update_apply` | — | `()` | 旧更新流程 | 待实现 |

### 引擎与包 `engine` · 9 条

| 命令 | 参数 | 返回 | 来源 | 状态 |
| --- | --- | --- | --- | --- |
| `celadon_engine_version` | — | `String` | `get_yao_version` | 待实现 |
| `celadon_engine_inspect` | — | `String`（JSON）| `get_yao_inspect` | 待实现 |
| `celadon_engine_update_check` | — | `UpdateInfo` | 旧更新流程 | 待实现 |
| `celadon_engine_update_apply` | — | `()` | 旧更新流程 | 待实现 |
| `celadon_bundle_manifest` | — | `BundleManifest` | `get_bundle_manifest` | 待实现 |
| `celadon_bundle_settings_schema` | — | `SettingsEntry[]` | `load_settings_schema` | 待实现 |
| `celadon_bundle_settings_get` | — | `String`（JSON）| `get_settings_config` | 待实现 |
| `celadon_bundle_settings_save` | `values` | `()` | `save_settings_config` | 待实现 |
| `celadon_bundle_settings_apply` | `values` | `ApplyReport{applied, skipped, conflicts}` | `apply_setting` · `apply_all_settings` | 待实现 |

### 环境 `env` · 6 条

| 命令 | 参数 | 返回 | 来源 | 状态 |
| --- | --- | --- | --- | --- |
| `celadon_env_root_get` | — | `Option<String>` | `get_app_root` | 待实现 |
| `celadon_env_root_default` | — | `String` | `get_default_app_root` | 待实现 |
| `celadon_env_root_set` | `path` | `()` | `set_app_root` | 待实现 |
| `celadon_env_values_get` | `keys` | `HashMap<String,String>` | `get_env_values` | 待实现 |
| `celadon_env_values_set` | `values` | `()` | `set_env_values` | 待实现 |
| `celadon_env_values_import` | `path` | `usize`（导入条数）| 新增（§6.1「导入 `.env` 文件」）| 待实现 |

### 隧道 `tunnel` · 5 条

| 命令 | 参数 | 返回 | 来源 | 状态 |
| --- | --- | --- | --- | --- |
| `celadon_tunnel_config_get` | — | `String`（JSON）| `tunnel.rs` | 待实现 |
| `celadon_tunnel_config_set` | `config` | `()` | `tunnel.rs` | 待实现 |
| `celadon_tunnel_start` | — | `()` | `tunnel.rs` | 待实现 |
| `celadon_tunnel_stop` | — | `()` | `tunnel.rs` | 待实现 |
| `celadon_tunnel_status` | — | `TunnelStatus{running, provider, url}` | `tunnel.rs` | 待实现 |

### 系统集成 `system` · 12 条

| 命令 | 参数 | 返回 | 来源 | 状态 |
| --- | --- | --- | --- | --- |
| `celadon_system_platform` | — | `"macos" \| "windows" \| "linux"` | `get_platform` | 待实现 |
| `celadon_system_language` | — | `String` | `get_system_language` | 待实现 |
| `celadon_system_language_set` | `lang` | `()` | `set_ui_language` | 待实现 |
| `celadon_system_local_ips` | — | `String[]` | `get_local_ips` | 待实现 |
| `celadon_system_open_url` | `url` | `()` | `open_url` | 待实现 |
| `celadon_system_reveal` | `path` | `()` | `reveal_in_finder` | 待实现 |
| `celadon_system_folder_pick` | `title?` | `Option<String>` | `select_folder` | 待实现 |
| `celadon_system_file_pick` | `title?, filters?` | `Option<String>` | `select_file` | 待实现 |
| `celadon_system_app_info` | — | `AppInfo{name, version, identifier}` | `get_app_info` | 待实现 |
| `celadon_system_theme_set` | `theme: light\|dark` | `()` | `set_window_theme` | 待实现 |
| `celadon_system_navigate` | `target` | `()` | `navigate_to_servers` | 待实现 |
| `celadon_system_updater_open` | — | `()` | `open_updater_window` | 待实现 |

### 服务与传输 · 7 条

| 命令 | 参数 | 返回 | 来源 | 状态 |
| --- | --- | --- | --- | --- |
| `celadon_service_probe` | `url` | `WellKnownInfo` | `check_server` | 待实现 |
| `celadon_service_cloud_list` | `cloud_base, locale` | `CloudServerInfo[]` | `fetch_cloud_servers` | 待实现 |
| `celadon_transport_proxy_start` | `port?, token?` | `ProxyStatus` | `start_proxy` | 待实现 |
| `celadon_transport_proxy_stop` | — | `()` | `start_proxy` 的对偶 | 待实现 |
| `celadon_transport_proxy_status` | — | `ProxyStatus{running, port, requests}` | `get_proxy_status` | 待实现 |
| `celadon_transport_token_update` | `token` | `()` | `update_proxy_token` | 待实现 |
| `celadon_settings_sync` | `theme, locale` | `()` | `sync_preferences` | 待实现 |

## 3. 实现顺序（一次一个域，每域自带 `cargo test`）

| 步 | 域 | 命令数 | 为什么这个顺序 |
| --- | --- | --- | --- |
| 1 | 宿主 + 凭据 | 5 | **已完成**：验证函数 + 凭据规则（含内存落点测试）|
| 2 | **系统集成** | 12 | 纯宿主能力、无依赖；先打通"前端 → 桥 → Rust"整链（含验证页）|
| 3 | 环境 | 6 | 只读写文件与键值，无外部进程 |
| 4 | 本地服务 · tai · 引擎与包 | 19 | 要起进程 / 读包，依赖前两步 |
| 5 | 隧道 · 服务与传输 | 12 | 依赖最多（网络 · frp · 代理）|

**每域验收**：`cargo test` 通过 · 命令名与前端常量一字不差 · 失败回可读原因（不 panic）· 前端 `platform/bridge/<域>.ts` 与测试同步补齐 · 验证页能看到该域状态。

### 3.1 怎么跑"真的碰凭据库"那条测试

`celadon_credential_*` 的逻辑用**内存落点**（`SecretStore` 的内存实现）测，`cargo test` 直接跑；
只有"真的落到系统凭据库"那一条是 `#[ignore]`，因为它要求**会话有 keychain 域**：

```bash
# CI / 无 GUI 会话（keyring 自己的 CI 就是这么做的）
security create-keychain -p "" /tmp/ci.keychain
security unlock-keychain -p "" /tmp/ci.keychain
security default-keychain -s /tmp/ci.keychain
security list-keychains -s /tmp/ci.keychain
cargo test -- --ignored
```

**2026-10-03 实测**：在本工作区的会话里，连 `security default-keychain` 自己都报
`A default keychain could not be found`（而直接往**指定**钥匙串写是成功的）——
缺的是会话的 keychain 域，不是代码。GUI 里跑起来的应用不受此限。

## 4. 不做

- 旧 `app_conf.rs` / `config.rs` 的本地 JSON 配置：由 `env/` 与 `engine/` 的域命令取代，不再保留一份
- 旧 `tunnel_inject.js`（往页面注入脚本）：V2 由前端自己完成，宿主不再注入
- 旧 `navigate_to_servers` 之外的窗口管理命令：V2 的窗口由制品类型（§6.2）决定，不再由宿主切页
