/* 违规例：上层直接 import 宿主机制（要问能力就走 client/，要读地址走 service/）。 */
import { hasHost } from '@/platform/bridge'

export const desktop = () => hasHost()
