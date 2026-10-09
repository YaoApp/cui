/* 落点记录：产品外壳把当前地址记下来；入口根地址不记（`plan/06-login.md` §5）。 */
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/service', () => ({ serviceBase: vi.fn(() => '') }))

import { readLanding } from './landing-record'
import { useLandingRecord } from './use-landing-record'

function Probe({ pathname, search }: { pathname: string; search: string }) {
  useLandingRecord(pathname, search)
  return <p>记录中</p>
}

describe('the landing record hook', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
  })

  it('records the address with its query string', () => {
    render(<Probe pathname="/scaffold/base" search="?q=alpha" />)
    expect(readLanding()).toBe('/scaffold/base?q=alpha')
  })

  it('does not record the entry root', () => {
    render(<Probe pathname="/" search="" />)
    expect(readLanding()).toBeUndefined()
  })

  it('does not record anything that is not an in-app path', () => {
    render(<Probe pathname="//evil.example" search="" />)
    expect(readLanding()).toBeUndefined()
  })
})
