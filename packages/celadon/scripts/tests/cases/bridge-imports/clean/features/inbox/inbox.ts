/* 正例：上层问能力与事实，走 client/ 的公共面（不碰宿主机制）。 */
import { client } from '@/platform/client'
import { readServiceAddress } from '@/platform/service'

export const capability = () => client.capabilities.serviceAddress
export const address = () => readServiceAddress()
