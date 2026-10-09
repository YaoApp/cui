import { useTranslation } from '@/platform/i18n'
import { serviceBase, serviceInfo } from '@/platform/service'
import { findServer } from './server-history'

/** 地址去掉协议与尾斜杠，只用于显示。 */
function bare(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/+$/, '')
}

/**
 * 客户端栏里的当前服务器名。
 *
 * 客户端内取本机记录里与服务地址同址的那一条：有显示名就用它（云服务器条目），没有名字说明它是自建
 * 那一格，用「自建」；本机还没记过这台服务时退回地址本身。Web 的地址由部署决定，名字取服务信息里的
 * 那一个（`/.well-known/yao` 的 `name`）。
 */
export function useServerName(): string {
  const { t } = useTranslation()
  const base = serviceBase()
  if (!base) return serviceInfo()?.name ?? ''
  const known = findServer(base)
  if (known) return known.label ?? t('auth.servers.custom')
  return bare(base)
}
