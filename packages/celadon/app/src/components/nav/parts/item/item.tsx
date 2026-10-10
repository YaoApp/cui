import { Icon } from '@/components/base/icon'
import { appHref } from '@/platform/router/basename'
import { useTranslation } from '@/platform/i18n'
import type { NavItem } from '../../nav.types'

export type NavItemRowProps = {
  item: NavItem
  /** 收起成图标轨时只画图标，文字留待提示 */
  compact?: boolean
  onSelect: (item: NavItem) => void
}

/* 一个导航条目：图标 + 文字（+ 未读角标）。渲染真链接（可右键、可复制、可新窗口），
   左键点击交给调用方路由 —— 带修饰键的点击一律交还浏览器（见 07-routing.md 的真链接规则）。 */
export function NavItemRow({ item, compact = false, onSelect }: NavItemRowProps) {
  const { t } = useTranslation()
  const label = t(item.labelKey)
  return (
    <a
      className={item.active ? 'nav__link nav-item is-active' : 'nav__link nav-item'}
      href={appHref(item.to)}
      aria-current={item.active ? 'page' : undefined}
      aria-label={label}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
        event.preventDefault()
        onSelect(item)
      }}
    >
      <Icon name={item.icon} size={18} />
      {compact ? null : <span className="nav__label">{label}</span>}
      {item.badge ? <span className="nav__badge">{item.badge}</span> : null}
    </a>
  )
}
