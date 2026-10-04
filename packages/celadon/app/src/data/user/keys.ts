import { keyOf } from '../request/invalidate'
import { logout } from './api'

/** `user` 域的 key（订阅与失效共用同一算法，见 `request/invalidate.ts`）。 */
export const userKeys = {
  all: ['user'] as const,
  logout: () => keyOf(logout, [...userKeys.all, 'logout']),
}
