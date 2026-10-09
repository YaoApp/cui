import { Navigate, Outlet, useLocation } from 'react-router'
import { needsServerChoice } from '@/platform/service'
import { resolveEntry } from '@/features/auth/entry'
import { readLanding } from '@/features/auth/landing-record'
import { signedIn } from '@/features/auth/session-marker'
import { useAuthMode } from '@/features/auth/use-auth-mode'

/**
 * 入口判定：根地址（与未知路径）按 `plan/06-login.md` §5 的表决定去哪。
 * 判定只看本机信号，渲染里同步完成，因此不产生接口请求，也没有加载态可看。
 */
export function EntryGate() {
  const mode = useAuthMode()
  const target = resolveEntry({
    needsServer: needsServerChoice(),
    mode,
    signedIn: signedIn(),
    landing: readLanding(),
    ready: true,
  })
  return <Navigate to={target} replace />
}

/**
 * 桌面上还没选过服务器时，任何地址都先去选服务器页（不是报错）。
 * Web 没有这一步：`needsServerChoice()` 恒为假。
 */
export function ServerGuard() {
  const { pathname } = useLocation()
  if (needsServerChoice() && pathname !== '/servers') return <Navigate to="/servers" replace />
  return <Outlet />
}
