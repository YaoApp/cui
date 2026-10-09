import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/** 登录页的三步：账号、密码、邀请码。 */
export type AuthPhase = 'account' | 'password' | 'invite'

/** 判定结果：走登录还是注册。 */
export type AuthVerifyStatus = 'login' | 'register'

/** 页面级提示：文案已翻译，`tone` 决定颜色与读屏的播报方式。 */
export type AuthNotice = { tone: 'info' | 'danger'; text: string }

/** 登录成功后的用户信息：欢迎页展示用，之后按用户信息分流也以它为准。 */
export type AuthUser = {
  /** 服务端给的用户标识。 */
  userId?: string
  /** 本次登录用的账号（邮箱或手机号）；第三方登录可能没有。 */
  account?: string
  /** 显示名；来自 ID Token 的声明，没有就不展示。 */
  name?: string
  /** 邮箱；同样来自 ID Token 的声明。 */
  email?: string
}

/**
 * 登录域的私有状态（`architecture/06-state.md` §2.2：私有状态住 `features/<域>/<域>.store.ts`）。
 *
 * 只放**这个域自己的状态**：当前步骤、判定结果、临时令牌、口令标识与页面级提示。
 * 表单字段不放这里，它们是这一页的临时输入；入口配置与公钥是服务端数据，按规范不进 store，
 * 由数据层取、在 `AuthConfigProvider` 里提升共享；`complete` 这类会发请求、会跳转的收尾也不进 store，
 * 见 `use-complete-sign-in.ts`。
 */
export type AuthState = {
  /** 当前步骤：账号、密码或邀请码。 */
  phase: AuthPhase
  /** 上一次判定的结果：走登录还是注册；没判定过就是空。 */
  verifyStatus?: AuthVerifyStatus
  /** 临时令牌：只在内存里，随写请求的请求头送出，不落任何存储。 */
  tempToken: string
  /** 注册用的口令标识，服务端给，重发后更新。 */
  otpId: string
  /** 注册是否需要邮箱或手机验证码；由入口配置决定。 */
  needsCode: boolean
  /** 登录与注册之间要带上的用户名。 */
  username: string
  /** 页面级提示；没有就是空。 */
  notice?: AuthNotice
  /** 登录成功后的用户信息；没登录就是空。 */
  user?: AuthUser
  /** 动作：记下账号。 */
  setUsername: (username: string) => void
  /** 动作：设置或清掉页面级提示。 */
  setNotice: (notice?: AuthNotice) => void
  /** 动作：更新口令标识（重发验证码成功时用）。 */
  setOtpId: (otpId: string) => void
  /** 动作：记下登录成功后的用户信息。 */
  setUser: (user?: AuthUser) => void
  /** 动作：判定成功，记下临时令牌、判定结果与口令标识，并进入密码步。 */
  enterPassword: (input: { tempToken: string; status: AuthVerifyStatus; otpId?: string; needsCode: boolean }) => void
  /** 动作：进入邀请码步，并用本次响应里的临时令牌替换旧的。 */
  enterInvite: (tempToken: string) => void
  /** 动作：回到第一步并清掉判定结果与临时令牌。 */
  changeAccount: () => void
  /** 动作：整域复位（离开登录流程时用）。 */
  reset: () => void
}

const initial = {
  phase: 'account' as AuthPhase,
  verifyStatus: undefined,
  tempToken: '',
  otpId: '',
  needsCode: false,
  username: '',
  notice: undefined,
  user: undefined,
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      ...initial,
      setUsername: (username) => set({ username }, false, 'auth/setUsername'),
      setNotice: (notice) => set({ notice }, false, 'auth/setNotice'),
      setOtpId: (otpId) => set({ otpId }, false, 'auth/setOtpId'),
      setUser: (user) => set({ user }, false, 'auth/setUser'),
      enterPassword: (input) =>
        set(
          {
            tempToken: input.tempToken,
            verifyStatus: input.status,
            otpId: input.otpId ?? '',
            needsCode: input.needsCode,
            notice: undefined,
            phase: 'password',
          },
          false,
          'auth/enterPassword',
        ),
      enterInvite: (tempToken) => set({ tempToken, notice: undefined, phase: 'invite' }, false, 'auth/enterInvite'),
      changeAccount: () =>
        set({ phase: 'account', verifyStatus: undefined, tempToken: '', otpId: '', needsCode: false, notice: undefined }, false, 'auth/changeAccount'),
      reset: () => set({ ...initial }, false, 'auth/reset'),
    }),
    { name: 'auth' },
  ),
)
