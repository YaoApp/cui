import { MotionPanel } from '@/components/base/motion'
import { NavItemRow } from '../item'
import type { NavItem } from '../../nav.types'

export type NavListProps = {
  items: NavItem[]
  /** 无障碍名（"主导航" / "当前场景"） */
  label: string
  onSelect: (item: NavItem) => void
}

/* 导航列表：收条目、逐项画。谁给条目、点了去哪由调用方决定（见 architecture/07-routing.md）。 */
export function NavList({ items, label, onSelect }: NavListProps) {
  return (
    <ul className="nav__list" aria-label={label}>
      {items.map((item) => (
        /* 行容器只做平移：不给尺寸变化的投影留缩放文字的机会（plan/08-layout-motion.md §2 硬约束一） */
        <MotionPanel as="li" position key={item.key}>
          <NavItemRow item={item} onSelect={onSelect} />
        </MotionPanel>
      ))}
    </ul>
  )
}
