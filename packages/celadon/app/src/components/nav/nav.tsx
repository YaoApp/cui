import './nav.less'
import type { ReactNode } from 'react'
import type { I18nKey } from '@/platform/i18n/i18n-types'
import type { IconId } from '@/platform/icons'
import { useTranslation } from '@/platform/i18n'
import { NavFooter } from './parts/footer'
import { NavHeader } from './parts/header'
import { NavMain } from './parts/main'
import { NavScene } from './parts/scene'
import type { NavItem } from './nav.types'

export type NavProps = {
  items: NavItem[]
  /** 底部一行右侧的快捷图标：与主导航里的工作空间、电脑是同一份内容 */
  shortcuts: NavItem[]
  /** 当前场景名字在语言包里的键；没有场景时用 `shell.navigation.scene.none` */
  scene: I18nKey
  /** 当前场景的图标 */
  sceneIcon: IconId
  accountName: string
  /** 整列收起（视口驱动的那一档由样式按视口给，这里是用户偏好） */
  collapsed: boolean
  onToggle: () => void
  /** 主导航那一段折叠 */
  mainFolded: boolean
  onToggleMain: () => void
  /** 「当前」区里的二级导航，由业务域以插槽给（没有也要把那一行画出来） */
  children?: ReactNode
  onSelect: (item: NavItem) => void
}

/* 导航列：四段（头部内块 · 上区主导航 · 下区当前 · 底部一行），两处收起分开 ——
   头部键收整列，上区自己的键只折主导航（见 design/main-shell.md §三）。
   组件不认识业务：条目、「当前」区的内容、账号名与两处收起都由装配层给。 */
export function Nav({
  items,
  shortcuts,
  scene,
  sceneIcon,
  accountName,
  collapsed,
  onToggle,
  mainFolded,
  onToggleMain,
  children,
  onSelect,
}: NavProps) {
  const { t } = useTranslation()

  const select = (item: NavItem) => {
    onSelect(item)
  }
  const currentLabel = t(scene)

  return (
    <nav
      className={collapsed ? 'nav nav--collapsed' : 'nav'}
      aria-label={t('shell.navigation.label')}
    >
      <NavHeader collapsed={collapsed} onToggle={onToggle} />
      <NavMain
        items={items}
        compact={collapsed}
        folded={mainFolded}
        onToggleFold={onToggleMain}
        onSelect={select}
      />
      <NavScene
        items={items}
        currentLabel={currentLabel}
        sceneIcon={sceneIcon}
        folded={mainFolded}
        onSelect={select}
        onUnfold={onToggleMain}
      >
        {children}
      </NavScene>
      <NavFooter name={accountName} shortcuts={shortcuts} onSelect={select} />
    </nav>
  )
}
