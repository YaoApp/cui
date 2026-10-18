import './user-menu.less'
import { Menu as BaseMenu } from '@base-ui/react/menu'
import { useState } from 'react'
import { AlertDialog } from '@/components/base/alert-dialog'
import { Avatar } from '@/components/base/avatar'
import { Button } from '@/components/base/button'
import { useTranslation } from '@/platform/i18n'
import { UserMenuIdentity } from './parts/identity/identity'
import { UserMenuItem } from './parts/item/item'
import { UserMenuSeparator } from './parts/separator/separator'
import { UserMenuUsage } from './parts/usage/usage'

export type UserMenuSection = 'profile' | 'team' | 'usage'
export type UserMenuStatus = 'loading' | 'ready' | 'unavailable' | 'signedOut'
export type UserMenuLinks = { home: string; help: string; docs: string }

export type UserMenuProps = {
  status: UserMenuStatus
  name?: string
  plan?: string
  avatar?: string
  /** 团队账号才有；菜单里用于头像徽标与团队行右侧 */
  teamName?: string
  usage?: { remaining: number | null; upgradeUrl?: string }
  /** 平台上设置的快捷键，如 `⌘,`；不传则不显示 */
  shortcut?: string
  /** 只影响触发按钮：底部一行带名字，内容列头只有头像 */
  variant?: 'footer' | 'icon'
  links: UserMenuLinks
  onOpenSettings: (section: UserMenuSection) => void
  onOpenExternal: (url: string) => void
  onSignOut: () => void
  onSignIn: () => void
  /** 资料取失败时身份段变成「重试」入口 */
  onRetry?: () => void
}

const isUrl = (value?: string): value is string => Boolean(value)

/** 账户菜单：底部一行与内容列头共用一套。
    触发按钮、弹层与确认框都在这里；资料、用量与动作由外侧给，组件不认识接口。 */
export function UserMenu({
  status,
  name = '',
  plan = '',
  avatar,
  teamName,
  usage,
  shortcut,
  variant = 'footer',
  links,
  onOpenSettings,
  onOpenExternal,
  onSignOut,
  onSignIn,
  onRetry
}: UserMenuProps) {
  const { t, i18n } = useTranslation()
  const [confirming, setConfirming] = useState(false)

  const signedOut = status === 'signedOut'
  const loading = status === 'loading'
  const team = teamName ? { name: teamName } : undefined
  const remaining =
    usage?.remaining === null || usage?.remaining === undefined
      ? null
      : `${new Intl.NumberFormat(i18n.language).format(usage.remaining)} ${t('userMenu.unit')}`

  const triggerLabel = signedOut ? t('userMenu.signIn') : t('userMenu.label')

  if (signedOut) {
    return (
      <Button
        variant='plain'
        size='small'
        className={`user-menu__trigger user-menu__trigger--${variant}`}
        aria-label={triggerLabel}
        onClick={onSignIn}
      >
        <Avatar name={name} size={32} />
        {variant === 'footer' ? <span className='user-menu__trigger-name'>{t('userMenu.signedOut')}</span> : null}
      </Button>
    )
  }

  return (
    <>
      <BaseMenu.Root>
        <BaseMenu.Trigger
          className={`user-menu__trigger user-menu__trigger--${variant}`}
          aria-label={triggerLabel}
          render={<Button variant='plain' size='small' />}
        >
          <Avatar name={name} src={avatar} team={team} size={32} loading={loading} />
          {variant === 'footer' ? (
            loading ? (
              <span className='user-menu__skeleton user-menu__skeleton--name' aria-hidden='true' />
            ) : (
              <span className='user-menu__trigger-name'>{name}</span>
            )
          ) : null}
        </BaseMenu.Trigger>
        <BaseMenu.Portal>
          <BaseMenu.Positioner
            className='user-menu__layer'
            side='top'
            align={variant === 'footer' ? 'start' : 'end'}
            sideOffset={8}
          >
            <BaseMenu.Popup className='user-menu__popup' aria-label={t('userMenu.label')}>
              {status === 'unavailable' ? (
                <>
                  <UserMenuIdentity
                    name={t('userMenu.unavailable')}
                    plan=''
                    team={team}
                    label={t('userMenu.retry')}
                    onSelect={() => onRetry?.()}
                  />
                  <UserMenuSeparator />
                  <UserMenuItem icon='i-home' label={t('userMenu.home')} external onSelect={() => onOpenExternal(links.home)} />
                  <UserMenuItem icon='i-nav-help' label={t('userMenu.help')} external onSelect={() => onOpenExternal(links.help)} />
                  <UserMenuItem icon='i-book' label={t('userMenu.docs')} external onSelect={() => onOpenExternal(links.docs)} />
                </>
              ) : (
                <>
                  <UserMenuIdentity
                    name={name}
                    plan={plan}
                    avatar={avatar}
                    team={team}
                    label={t('userMenu.profile')}
                    onSelect={() => onOpenSettings('profile')}
                  />
                  <UserMenuSeparator />
                  <UserMenuUsage
                    label={t('userMenu.usage')}
                    value={remaining}
                    loading={loading}
                    upgradeLabel={t('userMenu.upgrade')}
                    upgradeUrl={usage?.upgradeUrl}
                    onSelect={() => onOpenSettings('usage')}
                    onUpgrade={() => isUrl(usage?.upgradeUrl) && onOpenExternal(usage.upgradeUrl)}
                  />
                  <UserMenuSeparator />
                  <UserMenuItem
                    icon='i-nav-settings'
                    label={t('userMenu.settings')}
                    trailing={shortcut}
                    onSelect={() => onOpenSettings('profile')}
                  />
                  <UserMenuItem
                    icon='i-nav-team'
                    label={t('userMenu.team')}
                    trailing={teamName}
                    onSelect={() => onOpenSettings('team')}
                  />
                  <UserMenuSeparator />
                  <UserMenuItem icon='i-home' label={t('userMenu.home')} external onSelect={() => onOpenExternal(links.home)} />
                  <UserMenuItem icon='i-nav-help' label={t('userMenu.help')} external onSelect={() => onOpenExternal(links.help)} />
                  <UserMenuItem icon='i-book' label={t('userMenu.docs')} external onSelect={() => onOpenExternal(links.docs)} />
                  <UserMenuSeparator />
                  <UserMenuItem icon='i-nav-logout' label={t('userMenu.signOut')} onSelect={() => setConfirming(true)} />
                </>
              )}
            </BaseMenu.Popup>
          </BaseMenu.Positioner>
        </BaseMenu.Portal>
      </BaseMenu.Root>

      <AlertDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t('userMenu.signOutTitle')}
        description={t('userMenu.signOutDescription')}
        cancel={t('userMenu.cancel')}
        confirm={t('userMenu.signOut')}
        onConfirm={() => {
          setConfirming(false)
          onSignOut()
        }}
      />
    </>
  )
}
