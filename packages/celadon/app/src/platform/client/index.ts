/* `client/` 的公共面（15-platform.md §5）：**客户端类型 · 能力开关 · 宿主版本 · 客户端信息 · 出站上下文**。
 * 只有它读构建清单与 UA；其它层要判宿主或要用能力，一律问这里。 */

export { buildManifest, clientKind, targetOs, type ArtifactKind, type BuildInfo, type ClientKind, type Manifest, type TargetOs } from './manifest'
export { capabilities, type Capabilities } from './capabilities'
export { clientInfo, clientSignature, type ClientInfo } from './info'
export { clientId, primeClientId, newClientId, randomId } from './client-id'
export { parseUserAgent, uaInfo, type BrowserInfo, type UaInfo } from './ua'
export { currentOutbound, outboundContext, type OutboundContext, type OutboundInputs } from './context'

/* "这台客户端有没有宿主" 也是一条**客户端事实**（§5 让调用方先问 `client/`）。
   实现留在 `bridge/`（**只有它能碰宿主**），这里只是把它按客户端的面孔转出去。 */
export { hasHost } from '../bridge/invoke'
