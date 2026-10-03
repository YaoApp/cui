/* `client/` 的公共面（15-platform.md §5）：**客户端类型 · 能力开关 · 宿主版本 · 客户端信息 · 出站上下文**。
 * 只有它读构建清单与 UA；其它层要判宿主或要用能力，一律问这里。 */

export { buildManifest, clientKind, targetOs, type ArtifactKind, type BuildInfo, type ClientKind, type Manifest, type TargetOs } from './manifest'
export { capabilities, type Capabilities } from './capabilities'
export { clientInfo, clientSignature, type ClientInfo } from './info'
export { clientId, primeClientId, newClientId, randomId } from './client-id'
export { parseUserAgent, uaInfo, type BrowserInfo, type UaInfo } from './ua'
export { outboundContext, type OutboundContext, type OutboundInputs } from './context'
