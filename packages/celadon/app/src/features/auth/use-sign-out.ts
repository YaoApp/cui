import { useNavigate } from 'react-router'
import { useRequest } from '@/data'
import { logoutQuery } from '@/data/user'
import { clearLocalSession } from './sign-out'
import { useAuthMode, withMode } from './use-auth-mode'

/**
 * 退出登录（产品动作）：服务端吊销并清平台凭据（`logoutQuery`）→ 收拾本机记录 → 回登录页。
 *
 * **服务端吊销失败就本机不动**，页面据此提示（退出要真的退出，不能只清本地留下一把还在生效的凭据）。
 * 页面拿 `state` 显示进行中与失败；成功时这一步已经把标记清了，登录页不会再被判成已登录。
 */
export function useSignOut() {
  const logoutCall = useRequest(logoutQuery(), { manual: true })
  const navigate = useNavigate()
  const mode = useAuthMode()

  async function signOut(): Promise<boolean> {
    const result = await logoutCall.run()
    if (!result?.ok) return false
    clearLocalSession()
    navigate(withMode('/login', mode), { replace: true })
    return true
  }

  return { signOut, state: logoutCall.state }
}
