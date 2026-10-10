import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Menu as BaseMenu } from '@base-ui/react/menu'
import { Icon } from '@/components/base/icon'
import { ScrollArea } from '@/components/base/scroll-area'
import { useTranslation } from '@/platform/i18n'
import type { IconId } from '@/platform/icons'
import type { NavItem } from '../../nav.types'

export type NavMenuProps = {
  items: NavItem[]
  /** 「当前 · 场景」的完整文字，作为触发元素的无障碍名 */
  currentLabel: string
  /** 当前场景的图标 */
  sceneIcon: IconId
  onSelect: (item: NavItem) => void
}

/* 折叠态的找回：一整块封装在这里 —— 触发元素（场景图标 + 场景名 + 向上的箭头）、
   悬停进出的延时、菜单面板与条目状态，都在这一件里。指针进入触发元素或菜单才算"在里面"，
   移开 200 毫秒后收起；键盘与 `Esc` 交给上游 Menu。菜单弹在触发元素的上方、对齐它的左边，
   宽度不超过导航列本身（design/main-shell.md §三）。 */
export function NavMenu({ items, currentLabel, sceneIcon, onSelect }: NavMenuProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<number | null>(null)

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = window.setTimeout(() => setOpen(false), 200)
  }
  useEffect(() => cancelClose, [])

  const trigger: ReactNode = (
    <>
      <Icon name={sceneIcon} size={16} />
      <span className="nav__label">{currentLabel}</span>
      <Icon name="i-up" size={16} />
    </>
  )

  return (
    <BaseMenu.Root open={open} onOpenChange={setOpen}>
      <BaseMenu.Trigger
        nativeButton={false}
        render={<span className="nav__current" />}
        aria-label={currentLabel}
        onPointerEnter={() => {
          cancelClose()
          setOpen(true)
        }}
        onPointerLeave={scheduleClose}
        onClick={() => setOpen(!open)}
      >
        {trigger}
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner
          side="top"
          align="start"
          alignOffset={-12}
          sideOffset={4}
          className="nav__menu-positioner"
        >
          <BaseMenu.Popup
            className="nav__menu"
            aria-label={t('shell.navigation.main')}
            onPointerEnter={cancelClose}
            onPointerLeave={scheduleClose}
          >
            <ScrollArea size="small" className="nav__menu-scroll">
              {items.map((item) => (
                <BaseMenu.Item
                  key={item.key}
                  className="nav__menu-item nav-item"
                  aria-current={item.active ? 'page' : undefined}
                  onClick={() => onSelect(item)}
                >
                  <Icon name={item.icon} size={18} />
                  <span className="nav__label">{t(item.labelKey)}</span>
                  {item.badge ? <span className="nav__badge">{item.badge}</span> : null}
                </BaseMenu.Item>
              ))}
            </ScrollArea>
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  )
}
