/* ID Token 验签的用例：密钥对在用例里现生成，签出来的令牌与真服务同形，
   因此判定的是真的签名校验，而不是打桩的布尔值。 */
import { describe, expect, it } from 'vitest'
import { verifyIdToken } from './id-token'

const encoder = new TextEncoder()

function base64Url(input: Uint8Array | ArrayBuffer): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function makeKey() {
  return crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )
}

async function makeToken(header: Record<string, unknown>, payload: Record<string, unknown>, sign = true) {
  const pair = await makeKey()
  const headerPart = base64Url(encoder.encode(JSON.stringify(header)))
  const payloadPart = base64Url(encoder.encode(JSON.stringify(payload)))
  const signature = sign
    ? new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, encoder.encode(`${headerPart}.${payloadPart}`)))
    : new Uint8Array([0, 1, 2, 3])
  const jwk = (await crypto.subtle.exportKey('jwk', pair.publicKey)) as JsonWebKey
  return { token: `${headerPart}.${payloadPart}.${base64Url(signature)}`, keys: [{ ...jwk, kid: 'test-key' } as JsonWebKey] }
}

const future = () => Math.floor(Date.now() / 1000) + 600

describe('id token verification', () => {
  it('accepts a token signed by the matching key', async () => {
    const { token, keys } = await makeToken({ alg: 'RS256', kid: 'test-key' }, { sub: 'u1', exp: future() })
    const result = await verifyIdToken(token, keys)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.payload.sub).toBe('u1')
  })

  it('rejects a token whose signature does not match', async () => {
    const { token, keys } = await makeToken({ alg: 'RS256', kid: 'test-key' }, { sub: 'u1', exp: future() }, false)
    expect(await verifyIdToken(token, keys)).toEqual({ ok: false, reason: 'bad_signature' })
  })

  it('rejects an expired token', async () => {
    const { token, keys } = await makeToken({ alg: 'RS256', kid: 'test-key' }, { exp: 1 })
    expect(await verifyIdToken(token, keys)).toEqual({ ok: false, reason: 'expired' })
  })

  it('rejects an algorithm other than RS256', async () => {
    const { token, keys } = await makeToken({ alg: 'HS256', kid: 'test-key' }, { exp: future() })
    expect(await verifyIdToken(token, keys)).toEqual({ ok: false, reason: 'unsupported' })
  })

  it('reports a missing key when no key matches the header', async () => {
    const { token, keys } = await makeToken({ alg: 'RS256', kid: 'other-key' }, { exp: future() })
    expect(await verifyIdToken(token, keys)).toEqual({ ok: false, reason: 'no_key' })
  })

  it('reports a malformed token for missing parts and for an empty value', async () => {
    expect(await verifyIdToken(undefined, [])).toEqual({ ok: false, reason: 'malformed' })
    expect(await verifyIdToken('not-a-token', [])).toEqual({ ok: false, reason: 'malformed' })
  })
})
