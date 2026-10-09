/* 路由装配：只断言表里有哪些路径、各自挂在哪一层，不渲染。页面自己的行为在页面用例里。
   层次是设计的一部分（`plan/06-login.md` §5）：入口页与开发面在会话守卫之外，产品面在守卫之内。 */
import { isValidElement, type ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import type { RouteObject } from 'react-router'
import { routes } from './routes'

/** 表里的全部路径（含子路由），顺序与定义一致。 */
function pathsOf(tables: RouteObject[] | undefined): string[] {
  const found: string[] = []
  for (const route of tables ?? []) {
    if (route.path) found.push(route.path)
    if (route.children) found.push(...pathsOf(route.children))
  }
  return found
}

/** 重定向目标的 `to`（只对 `<Navigate>` 有意义）。 */
function redirectTo(element: unknown): unknown {
  return isValidElement(element) ? (element as ReactElement<{ to?: string }>).props.to : undefined
}

describe('the route table', () => {
  const server = routes[0]
  const expiry = server?.children?.[0]
  const auth = expiry?.children?.[0]
  const surface = expiry?.children?.[1]
  const guarded = expiry?.children?.[2]
  const fallback = guarded?.children?.[0]
  const productChildren = surface?.children?.slice(1)
  const scaffold = server?.children?.[1]
  const scaffoldPaths = [
    'scaffold/home',
    'scaffold',
    'scaffold/routing',
    'scaffold/routing/:worldId',
    'scaffold/bridge',
    'scaffold/requests',
    'scaffold/base',
  ]

  it('keeps the entry pages outside the session guard, under one provider', () => {
    expect(server?.path).toBeUndefined()
    expect(server?.element).toBeTruthy()
    expect(pathsOf(auth?.children)).toEqual([
      'login',
      'register',
      'welcome',
      'servers',
      'auth/back/:provider',
    ])
    expect(auth?.element).toBeTruthy()
  })

  it('gives the namespace root to the entry decision', () => {
    expect(surface?.path).toBe('/')
    expect(surface?.element).toBeTruthy()
    const index = surface?.children?.[0]
    expect(index?.index).toBe(true)
    expect(index?.element).toBeTruthy()
    /* 产品页还没有：这一格先空着，产品页落地时挂进来 */
    expect(pathsOf(productChildren)).toEqual([])
  })

  it('sends everything else through the session guard, then back to the namespace root', () => {
    expect(guarded?.path).toBeUndefined()
    expect(guarded?.element).toBeTruthy()
    expect(fallback?.path).toBe('*')
    expect(redirectTo(fallback?.element)).toBe('/')
  })

  it('keeps the scaffold pages out of both guards: their probes answer 401 on purpose', () => {
    expect(pathsOf(scaffold?.children)).toEqual(scaffoldPaths)
    /* 那道会话失效守卫里不该出现任何脚手架路径 */
    const insideGuard = pathsOf(guarded?.children)
    for (const path of scaffoldPaths) expect(insideGuard).not.toContain(path)
  })
})
