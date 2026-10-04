/* **脚手架的导航**（`plan/05-scaffold.md`）：类型 · 纯函数 · 这一组导航项，都住脚手架里。
   产品页还没有，所以它们不是"应用级导航" —— 真导航等真页面来了再设计（见 architecture/07-routing.md）。 */
import type { I18nKey } from '@/platform/i18n'
import type { IconId } from '@/platform/icons'

export type NavItem = {
  /** 显示文字；脚手架这里是**语言包 key**（`nav.overview`），由页壳用 `t()` 翻成当前语言 */
  label: string
  href: string
  /** 图标（`i-<域>-<名>`）；有就渲染在文字前。类型钉死，写错名字 `tsc` 就红 */
  icon?: IconId
  active?: boolean
}

export type ScaffoldNavItem = NavItem & { label: I18nKey }

/** 脚手架导航项：首页（出脚手架）+ 四个页面。 */
export const SCAFFOLD_NAV: ScaffoldNavItem[] = [
  { label: 'nav.home', href: '/', icon: 'i-spark' },
  { label: 'nav.overview', href: '/scaffold', icon: 'i-book' },
  { label: 'nav.routing', href: '/scaffold/routing', icon: 'i-ws' },
  { label: 'nav.bridge', href: '/scaffold/bridge', icon: 'i-check' },
  { label: 'nav.requests', href: '/scaffold/requests', icon: 'i-file-code' },
]

/** 按当前路径标出选中项：**最长前缀胜出** —— 否则 `/scaffold/routing` 会把 `/scaffold` 也点亮。
    泛型保留传入项的 label 类型（脚手架是 I18nKey，页内子导航是数据里的名字）。 */
export function navWithActive<T extends NavItem = ScaffoldNavItem>(
  pathname: string,
  items: readonly T[] = SCAFFOLD_NAV as unknown as readonly T[],
): (T & { active: boolean })[] {
  const matches = items.filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
  const best = matches.reduce<string | undefined>(
    (winner, item) => (winner === undefined || item.href.length > winner.length ? item.href : winner),
    undefined,
  )
  return items.map((item) => ({ ...item, active: item.href === best }))
}
