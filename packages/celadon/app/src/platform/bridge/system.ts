/* **系统集成**：平台 · 语言 · 本地 IP · 打开浏览器 · 定位文件 · 选文件/目录 · 应用信息 · 系统主题（读/写）。
 * 命令名与 Rust 的 `pub fn` 一字不差（见桌面仓 `plan/01-bridge-commands.md`）。 */

import { invoke } from './invoke'

/** 命令名：与 `src-tauri/src/bridge/system.rs` 的 `pub fn` 同名。 */
export const SYSTEM_COMMANDS = {
  platform: 'celadon_system_platform',
  language: 'celadon_system_language',
  localIps: 'celadon_system_local_ips',
  openBrowser: 'celadon_system_open_browser',
  reveal: 'celadon_system_reveal',
  folderPick: 'celadon_system_folder_pick',
  filePick: 'celadon_system_file_pick',
  appInfo: 'celadon_system_app_info',
  theme: 'celadon_system_theme',
  machineId: 'celadon_system_machine_id',
  themeSet: 'celadon_system_theme_set',
} as const

/** 应用信息（宿主自述，非敏感）。 */
export type AppInfo = {
  name: string
  version: string
  identifier: string
}

export const system = {
  /** 目标平台：`macos` | `windows`（其它平台命令会回 `platform.unsupported`） */
  platform: () => invoke<string>(SYSTEM_COMMANDS.platform),

  /** 系统语言：**原始标签**（如 `zh-Hans-CN`）；拿不到是 `null`。归一由应用的 i18n 定。 */
  language: () => invoke<string | null>(SYSTEM_COMMANDS.language),

  /** 本地 IP（去重排序） */
  localIps: () => invoke<string[]>(SYSTEM_COMMANDS.localIps),

  /** 在系统默认浏览器里打开（只允许 http(s)，由宿主强制） */
  openBrowser: (url: string) => invoke<void>(SYSTEM_COMMANDS.openBrowser, { url }),

  /** 在文件管理器中定位（路径必须存在） */
  reveal: (path: string) => invoke<void>(SYSTEM_COMMANDS.reveal, { path }),

  /** 选目录；取消回 `null` */
  folderPick: (title?: string) => invoke<string | null>(SYSTEM_COMMANDS.folderPick, { title: title ?? null }),

  /** 选文件；取消回 `null` */
  filePick: (title?: string) => invoke<string | null>(SYSTEM_COMMANDS.filePick, { title: title ?? null }),

  /** 应用信息（名字 · 版本 · 标识）。版本与 cui 同源。 */
  appInfo: () => invoke<AppInfo>(SYSTEM_COMMANDS.appInfo),

  /** 读系统主题（窗口实际用的那一份）：`light` | `dark` | `system` */
  theme: () => invoke<string>(SYSTEM_COMMANDS.theme),

  /** **真机器码**：宿主问操作系统要（macOS `IOPlatformUUID` / Windows `MachineGuid`）。
   *  用来把 `client_id` 从随机换成"同一台机器稳定"（见 `client/client-id.ts`）。 */
  machineId: () => invoke<string>(SYSTEM_COMMANDS.machineId),

  /** 设窗口主题；回实际设成的值 */
  themeSet: (theme: 'light' | 'dark') => invoke<string>(SYSTEM_COMMANDS.themeSet, { theme }),
}

/* **还没做的**：`celadon_system_open_window`（应用内开新窗口）。
   它要拿到"应用自己的地址"（开发期是 dev server，打包后是资产协议）才能建窗口 —— 与打包口径绑定，
   等打包定案一起做（见桌面仓 `plan/01-bridge-commands.md` 的「本轮不实现」）。 */
