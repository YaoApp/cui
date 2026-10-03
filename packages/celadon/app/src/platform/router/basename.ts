/* basename 由平台适配器注入 —— 路由代码里不出现环境判断（见 architecture/07-routing.md）。
   现在只有一种来源：Vite 的 base（取自 CUI_BASE）。桌面端以后在这里换实现。 */
export function routerBasename(): string {
  const base = import.meta.env.BASE_URL || '/'
  return base.endsWith('/') ? base.slice(0, -1) : base
}

/* 真链接（<a href>）要带命名空间，路由内的 to / navigate 不带（react-router 会加）。
   两者分不清就会出现"点了跳两次命名空间"的地址（见 architecture/07-routing.md）。 */
export function appHref(path: string): string {
  return `${routerBasename()}${path.startsWith('/') ? path : `/${path}`}`
}
