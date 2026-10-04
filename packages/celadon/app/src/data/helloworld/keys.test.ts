import { describe, expect, it } from 'vitest'
import { publicGet, publicPost } from './api'
import { helloKeys } from './keys'
import { publicGetQuery, publicPostQuery } from './queries'

describe('the helloworld key family', () => {
  it('derives every interface key from its declaration, under one family root', () => {
    expect(helloKeys.publicGet()).toEqual(['helloworld', 'public', 'GET', '/helloworld/public'])
    expect(helloKeys.publicPost()).toEqual(['helloworld', 'public', 'POST', '/helloworld/public'])
    expect(helloKeys.all).toEqual(['helloworld'])
  })

  it('pairs the key with the declaration the caller has to run', () => {
    expect(publicGetQuery()).toEqual({ key: helloKeys.publicGet(), request: publicGet })
    expect(publicPostQuery().request).toBe(publicPost)
  })
})
