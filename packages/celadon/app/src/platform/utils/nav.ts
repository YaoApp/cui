/* 应用级导航项 —— **跨层共享的常量与纯函数**，所以住 platform/utils（见 architecture/00-principles.md）。
   `routes/` 与各 feature 都能用它；type 也在这里，组件只 import type（方向向下）。 */

export type NavItem = {
  label: string
  href: string
  active?: boolean
}

export const APP_NAV: NavItem[] = [
  { label: 'Hello', href: '/main/hello' },
  { label: 'World', href: '/main/world' },
]

/** 按当前路径标出选中项 —— 比较只写这一处，别让每个页面各写一遍。 */
export function navWithActive(pathname: string, items: NavItem[] = APP_NAV): NavItem[] {
  return items.map((item) => ({
    ...item,
    active: pathname === item.href || pathname.startsWith(`${item.href}/`),
  }))
}
