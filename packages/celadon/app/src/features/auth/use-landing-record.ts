import { useEffect } from 'react'
import { rememberLanding, validLanding } from './landing-record'

/**
 * **记一次落点**：产品外壳在每次导航后把当前地址记下来（含查询串），入口判定在
 * 「已登录且没有明确地址」时用它。两级守卫之外的东西不记：入口页自己（`/`）不记，
 * 流程页不在外壳里、因此天然不记（见 `plan/06-login.md` §5）。
 */
export function useLandingRecord(pathname: string, search: string): void {
  useEffect(() => {
    const target = `${pathname}${search}`
    if (pathname === '/' || !validLanding(target)) return
    rememberLanding(target)
  }, [pathname, search])
}
