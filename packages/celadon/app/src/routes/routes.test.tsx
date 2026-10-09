/* 路由装配：只断言表里有哪些路径、各自挂在哪里，不渲染。页面自己的行为在页面用例里。 */
import { describe, expect, it } from 'vitest'
import type { RouteObject } from 'react-router'
import { routes } from './routes'

/** 表里的全部路径（含子路由），顺序与定义一致。 */
function pathsOf(tables: RouteObject[]): string[] {
  const found: string[] = []
  for (const route of tables) {
    if (route.path) found.push(route.path)
    if (route.children) found.push(...pathsOf(route.children))
  }
  return found
}

describe('the route table', () => {
  it('mounts the entry pages under the provider and outside the surface layout', () => {
    const auth = routes[0]
    expect(auth.path).toBeUndefined()
    expect(pathsOf(auth.children ?? [])).toEqual([
      'login',
      'register',
      'welcome',
      'servers',
      'auth/back/:provider',
    ])
    expect(auth.element).toBeTruthy()
  })

  it('keeps the home page at the root of the namespace, with the scaffold behind it', () => {
    const surface = routes[1]
    expect(surface.path).toBe('/')
    expect(surface.children?.some((child) => child.index)).toBe(true)
    expect(pathsOf(surface.children ?? [])).toEqual([
      'scaffold',
      'scaffold/routing',
      'scaffold/routing/:worldId',
      'scaffold/bridge',
      'scaffold/requests',
      'scaffold/base',
    ])
  })

  it('sends everything else back to the home page', () => {
    const fallback = routes[2]
    expect(fallback.path).toBe('*')
    expect(fallback.element).toBeTruthy()
  })
})
