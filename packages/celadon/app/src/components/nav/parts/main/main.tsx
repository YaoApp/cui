import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { ScrollArea } from '@/components/base/scroll-area'
import { Tooltip } from '@/components/base/tooltip'
import { useTranslation } from '@/platform/i18n'
import { NavList } from '../list'
import type { NavItem } from '../../nav.types'

export type NavMainProps = {
  items: NavItem[]
  /** 图标轨形态：条目只画图标 */
  compact: boolean
  /** 上区是否折叠 */
  folded: boolean
  onToggleFold: () => void
  onSelect: (item: NavItem) => void
}

/* 上区 · 主导航：内块标题与折叠键、六项列表。折叠只折这一段，不是整列
   （`design/main-shell.md` §三）；折叠后留「当前」那一行与展开键找回。 */
export function NavMain({ items, compact, folded, onToggleFold, onSelect }: NavMainProps) {
  const { t } = useTranslation()
  /* 这一颗键只做「收上区」一件事：名字固定，折叠态它被样式藏掉，
     展开由下区那一行的键负责 */
  const label = t('shell.navigation.action.fold')
  return (
    <div className={folded ? 'nav__main nav__main--folded' : 'nav__main'}>
      <div className="nav__main-body">
      <div className="nav__main-head">
        <span className="nav__section">{t('shell.navigation.main')}</span>
        {/* 收起键常驻在结构里，折叠时由样式藏掉：过渡期间头部尺寸不跳。
            折叠态的出口是下区「当前」那一行的展开键，两者互斥 */}
        <Tooltip label={label} side="bottom">
          <Button
            className="nav__fold"
            iconOnly
            variant="plain"
            size="small"
            aria-label={label}
            aria-expanded={!folded}
            onClick={onToggleFold}
          >
            <Icon name={folded ? 'i-dock' : 'i-undock'} size={16} />
          </Button>
        </Tooltip>
      </div>
      <ScrollArea className="nav__scroll" size="small">
        <NavList
          items={items}
          label={t('shell.navigation.main')}
          compact={compact}
          onSelect={onSelect}
        />
      </ScrollArea>
      </div>
    </div>
  )
}
