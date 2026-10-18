import type { ReactNode } from 'react'
import { Icon } from '@/components/base/icon'
import { Tooltip } from '@/components/base/tooltip'
import { appHref } from '@/platform/router/basename'
import { useTranslation } from '@/platform/i18n'
import type { NavItem } from '../../nav.types'

export type NavFooterProps = {
  /** 左侧账户入口：由装配层给的账户菜单（触发按钮与弹层都在里面）；没有时只画右侧快捷图标 */
  menu?: ReactNode
  shortcuts: NavItem[]
  onSelect: (item: NavItem) => void
}

/* 底部一行：账户菜单在左，工作空间与电脑两个快捷图标在右（同一份内容、同一套图标）。 */
export function NavFooter({ menu, shortcuts, onSelect }: NavFooterProps) {
  const { t } = useTranslation()
  return (
    <div className="nav__footer">
      {menu ? <span className="nav__user">{menu}</span> : null}
      <span className="nav__shortcuts">
        {shortcuts.map((item) => {
          const label = t(item.labelKey)
          return (
            <Tooltip key={item.key} label={label} side="top">
              <a
                className="nav__shortcut nav-item"
                href={appHref(item.to)}
                aria-label={label}
                aria-current={item.active ? 'page' : undefined}
                onClick={(event) => {
                  if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    event.button !== 0
                  )
                    return
                  event.preventDefault()
                  onSelect(item)
                }}
              >
                <Icon name={item.icon} size={16} />
              </a>
            </Tooltip>
          )
        })}
      </span>
    </div>
  )
}
