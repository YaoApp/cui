import { useTranslation } from '@/platform/i18n'
import { Page, PageCell, PageRow, PageSection } from '@/components/page'
import { Link } from 'react-router'
import { LocaleSwitch } from '@/components/locale-switch'
import { ThemeToggle } from '@/components/theme-toggle'
import { client, useLocalePreference, useThemePreference } from '@/platform/client'
import { usePageTitle } from '@/platform/router/use-page-title'
import { routerBasename } from '@/platform/router/basename'
import './home.less'

/* **应用首页（占位）**：只摆当前版本信息，等真首页替换它（`plan/05-scaffold.md` §3）。
   事实直接读 `client`（装填一次、永不变）；语言与主题是会变的，用偏好 hook 读。 */
/** 首页通往脚手架的四条路（索引页自己也有同一组导航）。 */
const SCAFFOLD_LINKS = [
  { key: 'nav.overview', href: '/scaffold' },
  { key: 'nav.routing', href: '/scaffold/routing' },
  { key: 'nav.bridge', href: '/scaffold/bridge' },
  { key: 'nav.requests', href: '/scaffold/requests' },
] as const

export function HomePage() {
  const { t } = useTranslation()
  const { locale } = useLocalePreference()
  const { theme, setTheme } = useThemePreference()
  usePageTitle(t('home.title'))

  const info = client.info
  const host = client.host
  const hostText = host.ready ? t('home.hostReady', { version: host.version }) : t('home.hostNone')
  const rows: [string, string][] = [
    [t('home.version'), client.manifest.version],
    [t('home.client'), info.client === 'desktop' ? t('home.clientDesktop') : t('home.clientWeb')],
    [t('home.os'), info.os],
    [t('home.host'), hostText],
    [t('home.namespace'), routerBasename() || '/'],
    [t('home.language'), locale],
    [t('home.theme'), theme === 'dark' ? t('home.themeDark') : t('home.themeLight')],
  ]

  return (
    <div className="home">
      <Page>
        {/* 语言与主题是平台机制，任何页面都要能改 —— 首页放在**第一行**，左对齐 */}
        <PageSection>
          <div className="home__controls">
            <LocaleSwitch />
            <ThemeToggle theme={theme} onSelect={setTheme} />
          </div>
        </PageSection>
        <PageSection heading={t('home.title')}>
          <PageRow>
            {rows.map(([label, value]) => (
              <PageCell key={label}>
                {label}：{value}
              </PageCell>
            ))}
          </PageRow>
        </PageSection>
        {/* 脚手架的入口：导航住在脚手架页里，而桌面端没有地址栏 —— 首页必须留一条路过去。
            真首页来了以后，这一行挪进开发菜单（`plan/05-scaffold.md` §3）。 */}
        <PageSection heading={t('home.scaffold')}>
          <PageRow>
            {SCAFFOLD_LINKS.map(({ key, href }) => (
              <PageCell key={href}>
                <Link className="link" to={href}>
                  {t(key)}
                </Link>
              </PageCell>
            ))}
          </PageRow>
        </PageSection>
      </Page>
    </div>
  )
}
