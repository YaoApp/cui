import { routerBasename } from '../router/basename'

/* **服务地址的唯一来源**（见 `17-transport.md` §2）：`transport/` 只负责拼，不负责定。 */

/** 基址：构建期由 `VITE_SERVICE_BASE` 给（没有就回相对地址 —— 同源部署与开发期都够用）。 */
export function serviceBase(): string {
  const raw = (import.meta.env?.VITE_SERVICE_BASE as string | undefined) ?? ''
  return raw.replace(/\/+$/, '')
}

/** 把路径拼成完整地址（基址为空时保持相对路径）。 */
export function serviceUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`
  const base = serviceBase()
  if (base) return `${base}${suffix}`
  /* 没给宿主基址时走**同源**：路径带上应用的命名空间（开发期 dev server 在 `/app/` 下代转，
     见 `16-development.md` §1）。桌面端的地址由宿主给，那时走上面那一支。 */
  const ns = routerBasename()
  return `${ns}${suffix}`
}
