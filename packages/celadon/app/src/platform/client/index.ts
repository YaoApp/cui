/* `client/` 的公共面（`15-platform.md` §5）：**一个 `client` 对象 + 一次装填**。
 *
 * 其它层只读 `client.x`（同步直接读），不 import 内部模块，也不自己判宿主。
 * 「有没有宿主」是内部实现：`bridge/` 自己用，不从这里出去。 */

export { client, loadClient, ClientBootError, type Client } from './facts'
export { useLocalePreference, useThemePreference } from './use-preferences'
export { useWindowChrome, type WindowChrome } from './window'
export type { ArtifactKind, BuildInfo, ClientKind, Manifest, TargetOs } from './manifest'
export type { Capabilities } from './capabilities'
export type { ClientInfo } from './info'
export type { BrowserInfo, UaInfo } from './ua'
export type { Preferences, RequestMetadata } from './context'
