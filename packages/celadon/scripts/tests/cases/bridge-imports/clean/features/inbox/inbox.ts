/* 正例：上层问能力与事实，走 client/ 的公共面（不碰宿主机制）。 */
import { client } from '@/platform/client'
import { readServiceAddress } from '@/platform/service'

export const capability = () => client.capabilities.serviceAddress
export const address = () => readServiceAddress()

// 注释里提到桥不算（上面那句 import { invoke } from '@/platform/bridge/invoke' 只是说明）
/* 也包含 import('@/platform/bridge/invoke') 这种动态写法 */
export const noted = 'bridge stays in the platform layer'
