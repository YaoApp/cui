import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { signOut } from '@/platform/credential'
import { onUnauthorized } from '@/platform/transport/unauthorized'
import { withNext } from '@/features/auth/next'
import { signedIn } from '@/features/auth/session-marker'
import { clearLocalSession } from '@/features/auth/sign-out'
import { useAuthMode, withMode } from '@/features/auth/use-auth-mode'

/**
 * **会话失效守卫**：订出口发来的 401 事件，清掉这次会话在本机留下的东西，把人送回登录页，
 * 并把当前地址带进 `next`（登录完回得来）。
 *
 * 订阅回调里**只改状态**，跳转写成渲染里的 `<Navigate>`：URL 不在 effect 里写
 * （`architecture/07-routing.md` §3 · `check-effect-url-write`）。闩锁保证一次请求风暴只处置一次，
 * 地址一变就把闩锁与目标都清掉，落地后下一次失效照常处置。
 */
export function SessionExpiryGuard() {
  const mode = useAuthMode()
  const location = useLocation()
  const [target, setTarget] = useState<string>()
  /* 闩锁：同一波 401 只清一次、只跳一次 */
  const tripped = useRef(false)

  /* 换地址就解锁：跳转落地后不再重复跳 */
  useEffect(() => {
    tripped.current = false
    setTarget(undefined)
  }, [location.key])

  useEffect(
    () =>
      onUnauthorized(() => {
        if (tripped.current) return
        tripped.current = true
        void signOut()
        clearLocalSession()
        /* 已经在登录页就没有去处可跳，只把状态清干净 */
        if (location.pathname === '/login') return
        const here = `${location.pathname}${location.search}`
        setTarget(withMode(withNext('/login', here), mode))
      }),
    [location.pathname, location.search, mode],
  )

  if (target) return <Navigate to={target} replace />
  return <Outlet />
}

/**
 * **会话守卫**：产品页面挂在这一层之下。没有本机登录标记就带 `next` 去登录页，
 * 登录完回得来（见 `plan/06-login.md` §5）。
 *
 * 标记不是授权依据，只是一个本机记忆：真正过期的会话由 401 裁决，因此放行不会漏掉失效。
 */
export function RequireSession() {
  const mode = useAuthMode()
  const location = useLocation()

  if (!signedIn()) {
    const here = `${location.pathname}${location.search}`
    return <Navigate to={withMode(withNext('/login', here), mode)} replace />
  }
  return <Outlet />
}
