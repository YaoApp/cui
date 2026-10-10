import type { ReactNode } from 'react'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { ScrollArea } from '@/components/base/scroll-area'
import { Tooltip } from '@/components/base/tooltip'
import { useTranslation } from '@/platform/i18n'
import { NavMenu } from '../menu'
import type { IconId } from '@/platform/icons'
import type { NavItem } from '../../nav.types'

export type NavSceneProps = {
  items: NavItem[]
  /** 「当前 · 场景」的完整文字，作为无障碍名 */
  currentLabel: string
  /** 当前场景的图标，折叠行只画它加一个向上的图标 */
  sceneIcon: IconId
  /** 主导航是否折叠：折叠时才画这一行与展开键，两者互斥 */
  folded: boolean
  onSelect: (item: NavItem) => void
  onUnfold: () => void
  /** 二级导航，由业务域以插槽给 */
  children?: ReactNode
}

/* 下区 · 当前：这一场景的二级导航，折叠态下多出「当前 · 场景」一行与展开键。
   这一行是找回入口：悬停、点击与键盘都能弹出主导航菜单（`design/main-shell.md` §三）；
   折叠时它落在列表下方、用户信息之上，DOM 顺序与视觉顺序一致。收起成图标轨时整段让位。 */
export function NavScene({
  items,
  currentLabel,
  sceneIcon,
  folded,
  onSelect,
  onUnfold,
  children,
}: NavSceneProps) {
  const { t } = useTranslation()
  const unfoldLabel = t('shell.navigation.action.unfold')

  return (
    <div className="nav__scene">
      <ScrollArea className="nav__scroll" size="small">{children}</ScrollArea>
      {folded ? (
        <div className="nav__scene-head">
          <NavMenu
            items={items}
            currentLabel={currentLabel}
            sceneIcon={sceneIcon}
            onSelect={onSelect}
          />
          <Tooltip label={unfoldLabel} side="bottom">
            <Button
              className="nav__unfold"
              iconOnly
              variant="plain"
              size="small"
              aria-label={unfoldLabel}
              aria-expanded={false}
              onClick={onUnfold}
            >
              <Icon name="i-dock" size={16} />
            </Button>
          </Tooltip>
        </div>
      ) : null}
    </div>
  )
}
