import './overview.less'
import { ThemeToggle } from '@/components/theme-toggle'
import { Icon } from '@/components/base/icon'
import { BrandMark, type BrandId } from '@/components/base/brand-mark'
import { useTranslation } from '@/platform/i18n'
import { client, useThemePreference } from '@/platform/client'
import { routerBasename } from '@/platform/router/basename'
import { ScaffoldPage } from '../components/scaffold-page'
import { FooBar } from './components/foo-bar'
import type { IconId } from '@/platform/icons'

/* 脚手架索引页：**品牌标识一行、界面图标一行**（两者永不混用，见 design/icons.md §1），
   外加客户端自述。品牌用 manifest 里的全部自有标识；图标覆盖导航 / 动作 / 状态 / 文件 / 对象五类。 */
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

export function OverviewPage() {
  const { theme, setTheme } = useThemePreference()
  const { t } = useTranslation()
  /* 客户端信息（15-platform.md §5.2）：**两个宿主导出同一组字段**，上层不判宿主。
     宿主版本与产品版本同源（壳与应用的版本统一，见 02-platform 的实现约定）。 */
  const info = client.info
  const hostVersion = client.manifest.version
  const host = client.host
  const hostText = host.ready ? t('overview.hostReady', { version: host.version }) : t('overview.hostNone')

  return (
    <div className="overview">
      <ScaffoldPage title={t('overview.title')}>
      <FooBar name="CUI 2.0" />
      <div className="overview__actions">
        <ThemeToggle theme={theme} onSelect={setTheme} />
      </div>
      <section className="overview__row" aria-label={t('overview.client')}>
        <span className="overview__client">
          {t('overview.clientType')}：{info.client === 'desktop' ? t('overview.clientDesktop') : t('overview.clientWeb')}
        </span>
        <span className="overview__client">
          {t('overview.os')}：{info.os}
        </span>
        <span className="overview__client">
          {t('overview.browser')}：{info.ua.browser.name}{info.ua.browser.version ? ` ${info.ua.browser.version}` : ''}
        </span>
        <span className="overview__client">
          {t('overview.version')}：{hostVersion}
        </span>
        <span className="overview__client">
          {t('overview.clientId')}：{info.client_id.slice(0, 8)}
        </span>
      </section>

      <section className="overview__row" aria-label={t('overview.host')}>
        <span className="overview__client">
          {t('overview.host')}：{hostText}
        </span>
        <span className="overview__client">
          {t('overview.namespace')}：{routerBasename() || '/'}
        </span>
      </section>

      <section className="overview__row" aria-label={t('overview.brands')}>
        {BRAND_SAMPLE.map((name) => (
          <span className="overview__cell" key={name}>
            <BrandMark name={name} size={24} />
            <code>{name}</code>
          </span>
        ))}
      </section>
      <section className="overview__row" aria-label={t('overview.brandsOther')}>
        {OTHER_BRAND_SAMPLE.map((name) => (
          <span className="overview__cell" key={name}>
            <BrandMark name={name} size={24} />
            <code>{name}</code>
          </span>
        ))}
      </section>
      <section className="overview__row" aria-label={t('overview.icons')}>
        {ICON_SAMPLE.map((name) => (
          <span className="overview__cell" key={name}>
            <Icon name={name} size={20} />
            <code>{name}</code>
          </span>
        ))}
      </section>
      </ScaffoldPage>
    </div>
  )
}
