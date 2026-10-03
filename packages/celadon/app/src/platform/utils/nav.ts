/* 应用级导航项 —— **跨层共享的常量与纯函数**，所以住 platform/utils（见 architecture/00-principles.md）。
   `routes/` 与各 feature 都能用它；type 也在这里，组件只 import type（方向向下）。 */
import type { I18nKey } from '@/platform/i18n'
import type { IconId } from '@/platform/icons'

export type NavItem = {
  /** 显示文字；应用级导航这里是**语言包 key**（`nav.hello`），由页面用 `t()` 翻成当前语言 */
  label: string
  href: string
  /** 图标（`i-<域>-<名>`）；有就渲染在文字前。类型钉死，写错名字 `tsc` 就红 */
  icon?: IconId
  active?: boolean
}

/** 应用级导航项：label 是语言包 key，类型上钉死（拼错 key 在 `tsc` 就红）。 */
export type AppNavItem = NavItem & { label: I18nKey }

export const APP_NAV: AppNavItem[] = [
  { label: 'nav.hello', href: '/hello', icon: 'i-spark' },
  { label: 'nav.world', href: '/world', icon: 'i-ws' },
]

/** 按当前路径标出选中项 —— 比较只写这一处，别让每个页面各写一遍。
    泛型保留传入项的 label 类型：应用级导航是 I18nKey，feature 内的子导航是数据里的名字。
    默认值是 APP_NAV；断言只是为了让"泛型默认参数"这一处过类型（T 缺省时就是 AppNavItem）。 */
export function navWithActive<T extends NavItem = AppNavItem>(
  pathname: string,
  items: readonly T[] = APP_NAV as unknown as readonly T[],
): (T & { active: boolean })[] {
  return items.map((item) => ({
    ...item,
    active: pathname === item.href || pathname.startsWith(`${item.href}/`),
  }))
}
