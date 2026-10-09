import { useId, type ReactNode } from 'react'
import { BrandMark } from '@/components/base/brand-mark'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { LocaleSwitch } from '@/components/locale-switch'
import { ThemeToggle } from '@/components/theme-toggle'
import { useThemePreference } from '@/platform/client'
import { useTranslation } from '@/platform/i18n'
import './auth-layout.less'

/** 入口页的两种形态：独立访问（品牌区与页脚都在）与客户端内（收起品牌与页脚，控件移到卡片下方）。 */
export type AuthMode = 'standalone' | 'in-app'

export type AuthLayoutProps = {
  /** 形态。由调用方显式给（见 `useAuthMode`），外壳自己不看地址也不看宿主。 */
  mode: AuthMode
  /** 卡片标题。多行时逐行给，空行由样式收起（某些语言的标题不换行）。 */
  titleLines: string[]
  /** 卡片下方那一句（去注册或去登录）。 */
  footnote?: ReactNode
  /** 独立访问时页脚的条款与隐私地址；客户端内不显示。 */
  serviceHref?: string
  privacyHref?: string
  /** 客户端栏里的当前服务器名（见 `useServerName`）；空串不显示这一块。 */
  serverName?: string
  /** 客户端内的返回入口，指向服务器选择页。 */
  onBack?: () => void
  children: ReactNode
}

/**
 * 入口页外壳，版式与 `design/prototype/login.html` 一致。
 *
 * 顶行左边是品牌标记与产品名，产品名走品牌渐变，是体系里唯一允许渐变文字的地方；
 * 右边是语言与主题，两者之间一条 1px 分隔线。卡片在剩余空间里居中，页脚只有条款与隐私两条。
 * 客户端内形态收起品牌与页脚，返回栏与卡片同宽同区，控件移到卡片下方居中。
 */
export function AuthLayout({ mode, titleLines, footnote, serviceHref, privacyHref, serverName, onBack, children }: AuthLayoutProps) {
  const { t } = useTranslation()
  const { theme, setTheme } = useThemePreference()
  const inApp = mode === 'in-app'
  const titleId = `${useId()}-title`

  const card = (
    <main className="auth__card" aria-labelledby={titleId}>
      <h1 className="auth__title" id={titleId}>
        {titleLines.map((line) => (
          <span className="auth__title-line" key={line}>
            {line}
          </span>
        ))}
      </h1>
      {children}
      {footnote ? <p className="auth__footnote">{footnote}</p> : null}
    </main>
  )

  const controls = (
    <span className="auth__ctrl">
      <LocaleSwitch />
      <span className="auth__ctrl-sep" aria-hidden="true" />
      <ThemeToggle theme={theme} onSelect={setTheme} />
    </span>
  )

  return (
    <div className={['auth', inApp ? 'auth--in-app' : null].filter(Boolean).join(' ')}>
      <header className="auth__top">
        <span className="auth__brand">
          <BrandMark name="brand-yao-agents" size={32} />
          {/* 产品名是专有名词，不进语言包；渐变取品牌标记自身的两个取值 */}
          <span className="auth__brand-name">Yao Agents</span>
        </span>
        {inApp ? null : controls}
      </header>

      <div className="auth__stage">
        {inApp ? (
          <div className="auth__stack">
            <div className="auth__client-bar">
              <Button type="button" variant="plain" size="small" icon={<Icon name="i-left" />} onClick={onBack}>
                {t('auth.action.backToServers')}
              </Button>
              {serverName ? (
                <span className="auth__server">
                  <span className="auth__server-name">{serverName}</span>
                </span>
              ) : null}
            </div>
            {card}
          </div>
        ) : (
          card
        )}
        {inApp ? <div className="auth__ctrl-wrap">{controls}</div> : null}
      </div>

      {inApp ? null : (
        /* 页脚常驻（哪怕一条都没有）：高度恒定，卡片位置才不被配置到达影响 */
        <footer className="auth__bottom">
          {serviceHref ? (
            <a className="auth__bottom-link" href={serviceHref} target="_blank" rel="noopener noreferrer">
              {t('auth.terms.service')}
            </a>
          ) : null}
          {serviceHref && privacyHref ? <span aria-hidden="true">·</span> : null}
          {privacyHref ? (
            <a className="auth__bottom-link" href={privacyHref} target="_blank" rel="noopener noreferrer">
              {t('auth.terms.privacy')}
            </a>
          ) : null}
        </footer>
      )}
    </div>
  )
}
