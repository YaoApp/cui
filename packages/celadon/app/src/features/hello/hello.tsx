import './hello.less'
import { useLocation, useNavigate } from 'react-router'
import { Header } from '@/components/header'
import { Nav } from '@/components/nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { Icon } from '@/components/base/icon'
import { BrandMark, type BrandId } from '@/components/base/brand-mark'
import { useTranslation } from '@/platform/i18n'
import { client } from '@/platform/client'
import { useThemePreference } from '@/platform/client'
import { usePageTitle } from '@/platform/router/use-page-title'
import { navWithActive } from '@/platform/utils/nav'
import { routerBasename } from '@/platform/router/basename'
import { FooBar } from './components/foo-bar'
import type { IconId } from '@/platform/icons'
import { useHelloStore } from './hello.store'

/* 演示样例：**品牌标识一行、界面图标一行**（两者永不混用，见 design/icons.md §1）。
   品牌用 manifest 里的全部自有标识；图标覆盖导航 / 动作 / 状态 / 文件 / 对象五类。 */
const BRAND_IDS = ['brand-yao-agents', 'brand-yao-agents-mono', 'brand-yao', 'brand-yao-mono'] as const
const BRAND_SAMPLE: readonly BrandId[] = BRAND_IDS
/* "别人家的"品牌：设计里分片存放，应用侧由 build-icons.mjs 选一批生成进来（看效果用）。 */
const OTHER_BRAND_SAMPLE: readonly BrandId[] = [
  'brand-claude', 'brand-openai', 'brand-gemini', 'brand-grok', 'brand-deepseek', 'brand-qwen',
  'brand-kimi', 'brand-doubao', 'brand-mistral', 'brand-midjourney', 'brand-perplexity', 'brand-cursor',
]

const ICON_SAMPLE: readonly IconId[] = [
  'i-chat', 'i-inbox', 'i-board', 'i-ws', 'i-book', 'i-nav-settings', 'i-nav-user', 'i-nav-help',
  'i-search', 'i-plus', 'i-act-edit', 'i-act-trash', 'i-act-refresh', 'i-act-download', 'i-act-filter', 'i-act-close',
  'i-check', 'i-clock', 'i-state-warning', 'i-state-error', 'i-state-info', 'i-state-loading',
  'i-file-pdf', 'i-folder', 'i-obj-model', 'i-obj-skill',
]

export function HelloPage() {
  const count = useHelloStore((state) => state.count)
  const refresh = useHelloStore((state) => state.refresh)
  // 主题住在平台层；feature 把它取出来，交给纯组件去显示与触发
  const { theme, setTheme } = useThemePreference()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useTranslation()
  // 应用级导航项在 platform/utils 里存的是 key，显示前在这里翻成当前语言
  const navItems = navWithActive(pathname).map((item) => ({ ...item, label: t(item.label) }))
  usePageTitle(t('hello.title'))
  /* 客户端信息（15-platform.md §5.2）：**两个宿主导出同一组字段**，上层不判宿主。
     宿主版本与产品版本同源（壳与应用的版本统一，见 02-platform 的实现约定）。 */
  const info = client.info
  const hostVersion = client.manifest.version
  const host = client.host
  const hostText = host.ready ? t('hello.hostReady', { version: host.version }) : t('hello.hostNone')

  return (
    <div className="hello">
      <Header title={t('hello.title')} onRefresh={refresh}>
        {/* 头部导航与 World 用的是同一个组件，只是 items 不同 */}
        <Nav items={navItems} label={t('nav.appLabel')} localeSwitch onSelect={(item) => navigate(item.href)} />
      </Header>
      <main className="hello__body">
        <FooBar name="CUI 2.0" count={count} />
        <div className="hello__actions">
          <ThemeToggle theme={theme} onSelect={setTheme} />
        </div>
        <section className="hello__row" aria-label={t('hello.client')}>
          <span className="hello__client">
            {t('hello.clientType')}：{info.client === 'desktop' ? t('hello.clientDesktop') : t('hello.clientWeb')}
          </span>
          <span className="hello__client">
            {t('hello.os')}：{info.os}
          </span>
          <span className="hello__client">
            {t('hello.browser')}：{info.ua.browser.name}{info.ua.browser.version ? ` ${info.ua.browser.version}` : ''}
          </span>
          <span className="hello__client">
            {t('hello.version')}：{hostVersion}
          </span>
          <span className="hello__client">
            {t('hello.clientId')}：{info.client_id.slice(0, 8)}
          </span>
        </section>

        <section className="hello__row" aria-label={t('hello.host')}>
          <span className="hello__client">
            {t('hello.host')}：{hostText}
          </span>
          <span className="hello__client">
            {t('hello.namespace')}：{routerBasename() || '/'}
          </span>
        </section>

        <section className="hello__row" aria-label={t('hello.brands')}>
          {BRAND_SAMPLE.map((name) => (
            <span className="hello__cell" key={name}>
              <BrandMark name={name} size={24} />
              <code>{name}</code>
            </span>
          ))}
        </section>
        <section className="hello__row" aria-label={t('hello.brandsOther')}>
          {OTHER_BRAND_SAMPLE.map((name) => (
            <span className="hello__cell" key={name}>
              <BrandMark name={name} size={24} />
              <code>{name}</code>
            </span>
          ))}
        </section>
        <section className="hello__row" aria-label={t('hello.icons')}>
          {ICON_SAMPLE.map((name) => (
            <span className="hello__cell" key={name}>
              <Icon name={name} size={20} />
              <code>{name}</code>
            </span>
          ))}
        </section>
      </main>
    </div>
  )
}
