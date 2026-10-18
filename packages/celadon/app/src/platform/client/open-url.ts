import { system } from '../bridge'
import { client } from './facts'

/** 打开外部地址：客户端交系统默认浏览器，Web 新开一页。
    宿主只接受 http(s)，失败不打断界面；调用方只给地址。 */
export function openUrl(url: string): void {
  if (client.kind === 'desktop') {
    void system.openBrowser(url)
    return
  }
  globalThis.open?.(url, '_blank', 'noopener,noreferrer')
}
