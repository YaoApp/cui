import './base.less'
import { useState } from 'react'
import { BrandMark, Button, Icon, Input, Select } from '@/components/base'
import { LocaleSwitch } from '@/components/locale-switch'
import { ThemeToggle } from '@/components/theme-toggle'
import { useTranslation } from '@/platform/i18n'
import { useThemePreference } from '@/platform/client'
import { ScaffoldPage } from '../components/scaffold-page'

/* 基础件清单页：三层结构，组（基础件）→ 子组（类型 · 状态 · 尺寸）→ 单个示例。
   分组方式照上游 Base UI 组件页的做法：每个组件一段，段内按用途分示例。
   示例名只在样例自身没有文字时才给（图标、按钮）；输入框的标签已经是名称，不再重复。

   关于文案：**页面文案走四语语言包**（`base.*`，四份都齐）。分工是本地化文档的惯例：
   组名与子组名翻译并保留组件名（「输入 Input」），属性名与变体名作为 API 名称保留英文
   （`placeholder` · `inverse`），说明性文字翻译。切语言时页面必须跟着变。 */

const ICON_SIZES = [14, 16, 20, 24] as const

export function BasePage() {
  const { t } = useTranslation()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [theme, setTheme] = useState('light')
  /* 主题与语言用真实的偏好源，不自造局部状态（与首页同一套） */
  const { theme: activeTheme, setTheme: selectActiveTheme } = useThemePreference()

  /* 选择器的选项是调用方传入的数据，不属于页面文案，用固定取值即可。
     主题那三个标签住在各功能自己的语言包里（`bridge.themeLight` 等），组件层的文案归属另有缺口，
     这一轮不动它，记在待办里。 */
  const selectOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'Follow system' },
  ]

  return (
    <ScaffoldPage title={t('base.title')}>
      <section className="base-group">
        <h2 className="base-group__title">{t('base.group.input')}</h2>

        <h3 className="base-subgroup__title">{t('base.sub.props')}</h3>
        <div className="base-grid">
          <Input
            id="demo-placeholder"
            label="placeholder"
            placeholder="you@example.com"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          />
          <Input
            id="demo-icon"
            label="icon"
            placeholder="icon slot"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            icon={<Icon name="i-nav-user" />}
          />
          <Input
            id="demo-trailing"
            label="trailing"
            type={visible ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Icon name="i-obj-key" />}
            trailing={
              <button
                type="button"
                aria-label={visible ? 'hide password' : 'show password'}
                onClick={() => setVisible((value) => !value)}
              >
                <Icon name={visible ? 'i-act-edit' : 'i-search'} />
              </button>
            }
          />
          <Input id="demo-disabled" label="disabled" value="not editable" onChange={() => {}} disabled />
          <Input id="demo-readonly" label="readOnly" value="not editable" onChange={() => {}} readOnly />
          <Input
            id="demo-required"
            label="required"
            required
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          />
        </div>

        {/* 带消息的样例单独一组：同一行里不混有消息与没消息的字段，行高就不会参差 */}
        <h3 className="base-subgroup__title">{t('base.sub.messages')}</h3>
        <div className="base-grid">
          <Input
            id="demo-hint"
            label="hint"
            hint={t('base.message.hint')}
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          />
          <Input
            id="demo-error"
            label="error"
            error={t('base.message.error')}
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          />
        </div>

        <h3 className="base-subgroup__title">{t('base.sub.types')}</h3>
        <div className="base-grid">
          <Input id="demo-text" label="text" placeholder="text" value={account} onChange={(e) => setAccount(e.target.value)} />
          <Input
            id="demo-email"
            label="email"
            type="email"
            placeholder="you@example.com"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          />
          <Input
            id="demo-tel"
            label="tel"
            type="tel"
            placeholder="138 0000 0000"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          />
          <Input
            id="demo-number"
            label="number"
            type="number"
            placeholder="0"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          />
        </div>
      </section>

      <section className="base-group">
        <h2 className="base-group__title">{t('base.group.button')}</h2>

        <h3 className="base-subgroup__title">{t('base.sub.variants')}</h3>
        <div className="base-row">
          <Button variant="solid">solid</Button>
          <Button variant="soft">soft</Button>
          <Button variant="ghost">ghost</Button>
          <Button variant="inverse">inverse</Button>
        </div>

        <h3 className="base-subgroup__title">{t('base.sub.sizes')}</h3>
        <div className="base-row">
          <Button variant="solid" size="small">
            small
          </Button>
          <Button variant="inverse" loading>
            loading
          </Button>
          <Button variant="solid" disabled>
            disabled
          </Button>
        </div>
        <div className="base-row">
          <Button variant="inverse" block>
            {t('base.action.block')}
          </Button>
        </div>
      </section>

      <section className="base-group">
        <h2 className="base-group__title">{t('base.group.select')}</h2>

        <h3 className="base-subgroup__title">{t('base.sub.states')}</h3>
        <div className="base-row">
          <Select aria-label="theme" value={theme} onValueChange={setTheme} options={selectOptions} />
          <Select aria-label="theme disabled" value={theme} onValueChange={() => {}} options={selectOptions} disabled />
        </div>
      </section>

      <section className="base-group">
        <h2 className="base-group__title">{t('base.group.icon')}</h2>

        <h3 className="base-subgroup__title">{t('base.sub.iconSizes')}</h3>
        <div className="base-row">
          {ICON_SIZES.map((size) => (
            <span className="base-demo" key={size}>
              <span className="base-demo__name">{size}</span>
              <Icon name="i-search" size={size} />
            </span>
          ))}
        </div>

        <h3 className="base-subgroup__title">{t('base.sub.brands')}</h3>
        <div className="base-row">
          <BrandMark name="brand-yao-agents" size={24} label="Yao Agents" />
          <BrandMark name="brand-yao" size={24} label="Yao" />
        </div>
      </section>

      <section className="base-group">
        <h2 className="base-group__title">{t('base.group.theme')}</h2>

        <h3 className="base-subgroup__title">{t('base.sub.controls')}</h3>
        <div className="base-row">
          <ThemeToggle theme={activeTheme} onSelect={selectActiveTheme} />
          <LocaleSwitch />
        </div>
      </section>
    </ScaffoldPage>
  )
}
