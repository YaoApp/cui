import { useAuthStore } from './auth.store'
import { useAuthConfig } from './components/auth-provider'

/**
 * 登录域的共享状态入口：私有状态从 store 取，服务端数据从提升共享的提供者取。
 *
 * 页面只经这个钩子读写本域状态；写字段一律走 store 的动作（`architecture/06-state.md` §2.1）。
 */
export function useAuth() {
  const store = useAuthStore()
  const { config, keys } = useAuthConfig()
  return { ...store, config, keys }
}
