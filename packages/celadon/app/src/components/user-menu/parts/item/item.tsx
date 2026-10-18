import { Menu as BaseMenu } from '@base-ui/react/menu'
import { Icon } from '@/components/base/icon'
import type { IconId } from '@/platform/icons'

export type UserMenuItemProps = {
  icon: IconId
  label: string
  /** 右侧的说明或动作提示：快捷键、团队名、箭头 */
  trailing?: string
  /** 右侧是否画外链箭头 */
  external?: boolean
  onSelect: () => void
}

/** 菜单里的一条普通行：图标 + 文案 + 右侧说明。 */
export function UserMenuItem({ icon, label, trailing, external, onSelect }: UserMenuItemProps) {
  return (
    <BaseMenu.Item className='user-menu__item' onClick={onSelect}>
      <Icon name={icon} size={16} />
      <span className='user-menu__label'>{label}</span>
      {trailing ? <span className='user-menu__trailing'>{trailing}</span> : null}
      {external ? <Icon className='user-menu__trailing-icon' name='i-act-external' size={14} /> : null}
    </BaseMenu.Item>
  )
}
