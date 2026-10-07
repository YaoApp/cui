/* 登录域的私有状态：三步之间的流转与临时令牌的收发。
   纯状态，直接对 store 的动作断言，不经 React。 */
import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from './auth.store'

const store = () => useAuthStore.getState()

describe('the auth store', () => {
  beforeEach(() => store().reset())

  it('starts on the account step with nothing carried over', () => {
    expect(store().phase).toBe('account')
    expect(store().tempToken).toBe('')
    expect(store().verifyStatus).toBeUndefined()
    expect(store().username).toBe('')
  })

  it('carries the temporary token, the verdict and the code id into the password step', () => {
    store().enterPassword({ tempToken: 'temp-1', status: 'register', otpId: 'otp-9', needsCode: true })
    expect(store().phase).toBe('password')
    expect(store().tempToken).toBe('temp-1')
    expect(store().verifyStatus).toBe('register')
    expect(store().otpId).toBe('otp-9')
    expect(store().needsCode).toBe(true)
  })

  it('replaces the temporary token when the invitation step starts', () => {
    store().enterPassword({ tempToken: 'temp-1', status: 'login', needsCode: false })
    store().enterInvite('temp-2')
    expect(store().phase).toBe('invite')
    expect(store().tempToken).toBe('temp-2')
  })

  it('clears the verdict and the token when going back to the account step', () => {
    store().enterPassword({ tempToken: 'temp-1', status: 'login', needsCode: false })
    store().changeAccount()
    expect(store().phase).toBe('account')
    expect(store().tempToken).toBe('')
    expect(store().verifyStatus).toBeUndefined()
  })

  it('keeps the account between steps and gives it up on reset', () => {
    store().setUsername('max@example.com')
    store().enterPassword({ tempToken: 'temp-1', status: 'login', needsCode: false })
    expect(store().username).toBe('max@example.com')

    store().reset()
    expect(store().username).toBe('')
    expect(store().phase).toBe('account')
  })
})
