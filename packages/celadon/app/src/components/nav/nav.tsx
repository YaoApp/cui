import { LocaleSwitch } from '@/components/locale-switch'
import type { NavItem } from '@/platform/utils/nav'
import './nav.less'

export type NavProps = {
  items: NavItem[]
  /** 无障碍名（"应用导航" / "世界导航"） */
  label: string
  /** 应用级导航带上语言切换；功能内的子导航不带（免得一页出现两个切换件） */
  localeSwitch?: boolean
  /** 拦截点击交给调用方 —— 组件自己不依赖路由，才能单独渲染与测试 */
  onSelect?: (item: NavItem) => void
}

/* 纯组件：收 items，渲染真链接（可右键、可复制），选中态用设计类 `nav-item is-active`。
   谁提供 items、点击后怎么走，都是调用方的事（见 architecture/07-routing.md）。 */
export function Nav({ items, label, localeSwitch, onSelect }: NavProps) {
  return (
    <nav className="nav" aria-label={label}>
      <ul className="nav__list">
        {items.map((item) => (
          <li key={item.href}>
            <a
              className={item.active ? 'nav__link nav-item is-active' : 'nav__link nav-item'}
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              onClick={(event) => {
                if (!onSelect) return
                event.preventDefault()
                onSelect(item)
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
      {localeSwitch ? <LocaleSwitch /> : null}
    </nav>
  )
}
