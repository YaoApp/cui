/* **账户资料的开发期 mock。**
 *
 * 账户菜单的接口还在向引擎提需求（资料带团队、套餐与余量）。接口未就绪之前，
 * 打开 `VITE_ACCOUNT_MOCK=1` 时用这里的 fixture 顶替两条查询；`VITE_ACCOUNT_MOCK_ERROR=1`
 * 时返回失败，用来验加载失败与「账户不可用」。
 *
 * mock 只替换 `accountProfileQuery` 与 `accountUsageQuery` 两条，不碰 `transport/`，
 * 也不改其它接口；生产构建不打开这两个开关。
 */

import type { Result } from '../types'
import type { AccountProfile, AccountUsage } from './types'

const PROFILE: AccountProfile = {
  user_id: 'mock-user',
  name: 'Mock OAuth User',
  email: 'root@yaoagents.com',
  team: {
    team_id: 'mock-team',
    name: "Administrator's Team",
    plan: 'Team',
  },
}

const USAGE: AccountUsage = {
  plan: '体验版',
  remaining: 902467,
  upgradeUrl: 'https://yaoagents.com/pricing',
}

/* 开关直接读 `import.meta.env.VITE_*`，不要加可选链：Vite 只替换这种静态写法，
   写成 `import.meta.env?.X` 会留到运行时，开关永远不生效。
   再加 `DEV` 门：生产构建不启用 mock；fixture 仍随模块进入包，只有开发构建会用到。 */
export const accountMockEnabled = (): boolean =>
  import.meta.env.DEV && import.meta.env.VITE_ACCOUNT_MOCK === '1'

const accountMockFails = (): boolean =>
  import.meta.env.DEV && import.meta.env.VITE_ACCOUNT_MOCK_ERROR === '1'

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 200))

const failure = <T>(): Result<T> => ({
  ok: false,
  code: 'transport.network',
  params: {},
  message: 'mock account error',
  rawMessage: 'VITE_ACCOUNT_MOCK_ERROR=1',
})

export const mockAccountProfile = async (): Promise<Result<AccountProfile>> => {
  await settle()
  return accountMockFails() ? failure() : { ok: true, value: PROFILE }
}

export const mockAccountUsage = async (): Promise<Result<AccountUsage>> => {
  await settle()
  return accountMockFails() ? failure() : { ok: true, value: USAGE }
}
