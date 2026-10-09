/* ID Token 验签的用例：密钥对在用例里现生成，签出来的令牌与真服务同形，
   因此判定的是真的签名校验，而不是打桩的布尔值。 */
import { describe, expect, it, vi } from 'vitest'
import { idTokenClaimsForDisplay, verifyIdToken } from './id-token'

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

  it('reports a malformed token when a part cannot be decoded', async () => {
    expect(await verifyIdToken('%%%%.%%%%.signature', [])).toEqual({ ok: false, reason: 'malformed' })
  })

  it('accepts a token that carries no expiry claim', async () => {
    const { token, keys } = await makeToken({ alg: 'RS256', kid: 'test-key' }, { sub: 'u1' })
    const result = await verifyIdToken(token, keys)
    expect(result.ok).toBe(true)
  })

  it('reports unsupported when the platform has no WebCrypto', async () => {
    const { token, keys } = await makeToken({ alg: 'RS256', kid: 'test-key' }, { exp: future() })
    vi.stubGlobal('crypto', { subtle: undefined })
    expect(await verifyIdToken(token, keys)).toEqual({ ok: false, reason: 'unsupported' })
    vi.unstubAllGlobals()
  })

  it('reports unsupported when the key cannot be imported', async () => {
    const { token } = await makeToken({ alg: 'RS256', kid: 'test-key' }, { exp: future() })
    const broken = [{ kty: 'RSA', kid: 'test-key' } as JsonWebKey]
    expect(await verifyIdToken(token, broken)).toEqual({ ok: false, reason: 'unsupported' })
  })

  it('reports a missing key when the caller has no keys at all', async () => {
    const { token } = await makeToken({ alg: 'RS256', kid: 'test-key' }, { exp: future() })
    expect(await verifyIdToken(token, undefined)).toEqual({ ok: false, reason: 'no_key' })
  })
})

describe('reading the claims for display', () => {
  it('reads the payload of a shaped token without verifying it', () => {
    const headerPart = base64Url(encoder.encode(JSON.stringify({ alg: 'RS256' })))
    const payloadPart = base64Url(encoder.encode(JSON.stringify({ name: 'Wren', email: 'max@example.com' })))
    expect(idTokenClaimsForDisplay(`${headerPart}.${payloadPart}.signature`)).toMatchObject({
      name: 'Wren',
      email: 'max@example.com',
    })
  })

  it('gives nothing for a missing or malformed token', () => {
    expect(idTokenClaimsForDisplay(undefined)).toBeUndefined()
    expect(idTokenClaimsForDisplay('not-a-token')).toBeUndefined()
    expect(idTokenClaimsForDisplay('header.%%%%.signature')).toBeUndefined()
  })

  it('turns down payloads that are not a group of claims', () => {
    const part = (value: unknown) => base64Url(encoder.encode(JSON.stringify(value)))
    expect(idTokenClaimsForDisplay(`header.${part(null)}.signature`)).toBeUndefined()
    expect(idTokenClaimsForDisplay(`header.${part([1, 2])}.signature`)).toBeUndefined()
    expect(idTokenClaimsForDisplay(`header.${part('text')}.signature`)).toBeUndefined()
  })
})
