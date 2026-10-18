import { Menu as BaseMenu } from '@base-ui/react/menu'
import { Avatar, type AvatarTeam } from '@/components/base/avatar'

export type UserMenuIdentityProps = {
  name: string
  plan: string
  avatar?: string
  team?: AvatarTeam
  /** 无障碍名，说明这一段打开什么 */
  label: string
  onSelect: () => void
}

/** 菜单顶部：头像、名字、套餐；整段是一个菜单项，打开个人资料。 */
export function UserMenuIdentity({ name, plan, avatar, team, label, onSelect }: UserMenuIdentityProps) {
  return (
    <BaseMenu.Item
      className='user-menu__identity'
      aria-label={`${label}, ${name}${plan ? `, ${plan}` : ''}`}
      onClick={onSelect}
    >
      <Avatar name={name} src={avatar} team={team} size={32} />
      <span className='user-menu__identity-text'>
        <span className='user-menu__name' title={name}>
          {name}
        </span>
        <span className='user-menu__plan'>{plan}</span>
      </span>
    </BaseMenu.Item>
  )
}
