/* basename 由平台适配器注入 —— 路由代码里不出现环境判断（见 architecture/07-routing.md）。
   现在只有一种来源：Vite 的 base（取自 CUI_BASE）。桌面与 /iframe 端以后在这里换实现。 */
export function routerBasename(): string {
  const base = import.meta.env.BASE_URL || '/'
  return base.endsWith('/') ? base.slice(0, -1) : base
}
