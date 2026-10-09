/* ID Token 的本地验签：只认 RS256，签名、有效期与密钥都要对上才算通过。
   验签用的公钥集来自 `GET /oauth/jwks`（声明 `oidcKeys`），由调用方取回后传进来。
   任何一步不成立都返回**具名的原因**，调用方据此决定提示与日志；不静默降级成「解开载荷就当通过」。 */

export type IdTokenResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; reason: 'malformed' | 'expired' | 'no_key' | 'bad_signature' | 'unsupported' }

const BASE64_PAD = 4

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((BASE64_PAD - (normalized.length % BASE64_PAD)) % BASE64_PAD)
  const binary = atob(padded)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function decodePart(part: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(part))) as Record<string, unknown>
}

/**
 * **只读展示**用的声明：把 ID Token 的载荷解开，不验签。
 *
 * 用于展示（欢迎页的名字、邮箱一类）；**不能**当作授权或身份判断的依据，
 * 要判断是否可信请用 `verifyIdToken`。
 */
export function idTokenClaimsForDisplay(token: string | undefined): Record<string, unknown> | undefined {
  if (!token) return undefined
  const payloadPart = token.split('.')[1]
  if (!payloadPart) return undefined
  try {
    const payload: unknown = decodePart(payloadPart)
    /* 声明必须是一组键值：数组、`null` 与标量都不算 */
    return typeof payload === 'object' && payload !== null && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : undefined
  } catch {
    return undefined
  }
}

/**
 * 验一段 ID Token。
 *
 * 判定顺序：形状（三段）、算法（只认 RS256）、有效期（`exp`，可注入当前时间便于用例）、
 * 密钥（按 `kid` 找，找不到就报 `no_key`）、签名（WebCrypto 的 RSASSA-PKCS1-v1_5 加 SHA-256）。
 * 平台没有 WebCrypto 时报 `unsupported`，由调用方决定是提示还是跳过。
 */
export async function verifyIdToken(
  token: string | undefined,
  keys: JsonWebKey[] | undefined,
  now: number = Date.now(),
): Promise<IdTokenResult> {
  if (!token) return { ok: false, reason: 'malformed' }

  const [headerPart, payloadPart, signaturePart] = token.split('.')
  if (!headerPart || !payloadPart || !signaturePart) return { ok: false, reason: 'malformed' }

  let header: Record<string, unknown>
  let payload: Record<string, unknown>
  try {
    header = decodePart(headerPart)
    payload = decodePart(payloadPart)
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  if (header.alg !== 'RS256') return { ok: false, reason: 'unsupported' }

  const expires = typeof payload.exp === 'number' ? payload.exp * 1000 : undefined
  if (expires !== undefined && expires <= now) return { ok: false, reason: 'expired' }

  const subtle = globalThis.crypto?.subtle
  if (!subtle) return { ok: false, reason: 'unsupported' }

  const kid = typeof header.kid === 'string' ? header.kid : undefined
  const jwk = (keys ?? []).find((key) => (kid ? (key as JsonWebKey & { kid?: string }).kid === kid : true))
  if (!jwk) return { ok: false, reason: 'no_key' }

  try {
    const key = await subtle.importKey(
      'jwk',
      { ...jwk, ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    )
    const signed = new TextEncoder().encode(`${headerPart}.${payloadPart}`)
    const valid = await subtle.verify('RSASSA-PKCS1-v1_5', key, base64UrlToBytes(signaturePart), signed)
    return valid ? { ok: true, payload } : { ok: false, reason: 'bad_signature' }
  } catch {
    return { ok: false, reason: 'unsupported' }
  }
}
