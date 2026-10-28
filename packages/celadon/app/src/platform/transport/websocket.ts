import { serviceUrl } from '../service/base'

/* 浏览器原生 WebSocket 的唯一包装。业务层只说路径，基址仍由 service 层给：
   Web 走同源代理，桌面走宿主持有的服务地址。 */
export function websocketUrl(path: string): string {
  const raw = serviceUrl(path)
  const url = new URL(raw, window.location.href)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

export function openWebSocket(path: string): WebSocket {
  return new WebSocket(websocketUrl(path))
}
