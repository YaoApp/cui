import { useRequest } from '@/data/hooks'
import { accountProfileQuery, accountUsageQuery } from '@/data/user'
import type { UserMenuStatus } from '@/components/user-menu'

export type AccountMenuView = {
  status: UserMenuStatus
  name?: string
  plan?: string
  avatar?: string
  teamName?: string
  usage?: { remaining: number | null; upgradeUrl?: string }
  /** 资料或用量取失败后重试 */
  retry: () => void
}

/** 账户菜单的数据：资料与用量各一条查询，合成一份 view-model。
    登录标记由装配层读好传进来，本域不依赖登录域；mock 开关在数据层判定。 */
export function useAccountMenu(signedIn: boolean): AccountMenuView {
  const profile = useRequest(accountProfileQuery())
  const usage = useRequest(accountUsageQuery())

  const retry = () => {
    profile.run()
    usage.run()
  }

  if (!signedIn) {
    return { status: 'signedOut', retry }
  }

  const profileValue = profile.state.status === 'ok' ? profile.state.value : undefined
  const usageValue = usage.state.status === 'ok' ? usage.state.value : undefined

  if (profile.state.status === 'error') {
    return {
      status: 'unavailable',
      teamName: profileValue?.team?.name,
      usage: usageValue
        ? { remaining: usageValue.remaining, upgradeUrl: usageValue.upgradeUrl }
        : undefined,
      retry
    }
  }

  if (!profileValue) {
    return { status: 'loading', retry }
  }

  return {
    status: 'ready',
    name: profileValue.name,
    plan: usageValue?.plan ?? profileValue.team?.plan ?? '',
    avatar: profileValue.avatar,
    teamName: profileValue.team?.name,
    usage: usageValue
      ? { remaining: usageValue.remaining, upgradeUrl: usageValue.upgradeUrl }
      : undefined,
    retry
  }
}
