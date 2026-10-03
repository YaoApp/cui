/* **凭据**：只经宿主落进系统凭据库（对应 Rust `src/bridge/credential.rs`，见 15 §4.5）。
 *
 * · **秘密只在写入时经过前端一次**；读取只给需要把它交给服务端的地方用
 * · **`list` 只回元信息**（不含秘密）
 * · 命令名与 Rust 的 `pub fn` 一字不差 */

import { invoke } from './invoke'

/** 命令名：与 `src-tauri/src/bridge/credential.rs` 的 `pub fn` 同名。 */
export const CREDENTIAL_COMMANDS = {
  list: 'celadon_credential_list',
  read: 'celadon_credential_read',
  write: 'celadon_credential_write',
  remove: 'celadon_credential_remove',
} as const

/** 一条凭据的元信息（**不含秘密**） */
export type CredentialMeta = {
  service: string
  account: string
}

export const credential = {
  /** 列出已存的凭据（**只给元信息**） */
  list: () => invoke<CredentialMeta[]>(CREDENTIAL_COMMANDS.list),

  /** 读一条。**只在需要把它交给服务端时用**，不要拿去显示。 */
  read: (service: string) => invoke<string>(CREDENTIAL_COMMANDS.read, { service }),

  /** 写一条：**写进系统凭据库**，没有明文回退。 */
  write: (service: string, secret: string, account = '') =>
    invoke<boolean>(CREDENTIAL_COMMANDS.write, { service, secret, account }),

  /** 删一条；本来不存在回 `false`（不是错误）。 */
  remove: (service: string) => invoke<boolean>(CREDENTIAL_COMMANDS.remove, { service }),
}
