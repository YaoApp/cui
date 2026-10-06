import './base.less'
import { useState } from 'react'
import { BrandMark, Button, Icon, Input, SegmentedControl, Select } from '@/components/base'
import type { SegmentedOption, SelectGroup } from '@/components/base'
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

/* 分段控件的示例数据：段文案属于调用方的数据，用固定取值；带图标的一档用现有图标演示图标槽。 */
const SEGMENTED_THEME: SegmentedOption[] = [
  { value: 'system', label: 'Follow system' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]
const SEGMENTED_RANGE: SegmentedOption[] = [
  { value: 'day', label: 'Day', icon: <Icon name="i-clock" /> },
  { value: 'week', label: 'Week', icon: <Icon name="i-spark" /> },
  { value: 'month', label: 'Month', icon: <Icon name="i-book" /> },
]

export function BasePage() {
  const { t } = useTranslation()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [theme, setTheme] = useState('light')
  const [segmentedTheme, setSegmentedTheme] = useState('system')
  const [segmentedRange, setSegmentedRange] = useState('week')
  /* 错误抖动的重放计数：同名动画不会自行重跑，靠 key 让节点重挂载 */
  const [shakeTick, setShakeTick] = useState(0)
  /* 主题与语言用真实的偏好源，不自造局部状态（与首页同一套） */
  const { theme: activeTheme, setTheme: selectActiveTheme } = useThemePreference()
  /* 两个多选样例各自的选中集：受控组件要真的能改，样例才有意义 */
  const [multiTheme, setMultiTheme] = useState<string[]>(['light', 'system'])
  const [multiIcon, setMultiIcon] = useState<string[]>(['reading', 'task'])

  /* 选择器的示例数据是调用方传入的数据，不属于页面文案，用固定取值即可。
     主题那三个标签住在各功能自己的语言包里（`bridge.themeLight` 等），组件层的文案归属另有缺口，
     这一轮不动它，记在待办里。真实界面里的占位与空态文案仍走四语（`base.select.*`）。 */
  const selectOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'Follow system' },
    /* 一项禁用，用来展示弹层里的禁用项（键盘不可达、选中不改值） */
    { value: 'auto', label: 'Auto（disabled）', disabled: true },
  ]
  /* 带图标的选项 */
  const iconOptions = [
    { value: 'reading', label: 'Reading', icon: <Icon name="i-book" /> },
    { value: 'recent', label: 'Recent', icon: <Icon name="i-clock" /> },
    { value: 'suggested', label: 'Suggested', icon: <Icon name="i-spark" />, disabled: true },
  ]
  /* 异形布局：两行选项（标签加说明），行高按内容长高 */
  const richOptions = [
    { value: 'reading', label: 'Reading', description: 'Narrow column, larger line spacing', icon: <Icon name="i-book" /> },
    { value: 'tool', label: 'Tool', description: 'Wide column for panels and tables', icon: <Icon name="i-board" /> },
    { value: 'task', label: 'Task', description: 'Two columns with a status rail', icon: <Icon name="i-tasks" /> },
  ]
  /* 右侧附加内容 */
  const trailingOptions = [
    { value: 'compact', label: 'Compact', trailing: '⌘1' },
    { value: 'comfortable', label: 'Comfortable', trailing: '⌘2' },
    { value: 'spacious', label: 'Spacious', trailing: '⌘3' },
  ]
  /* 分组选项：组标题与组内选项 */
  const groupedOptions: SelectGroup[] = [
    {
      label: 'Appearance',
      options: [
        { value: 'light', label: 'Light', icon: <Icon name="i-spark" /> },
        { value: 'dark', label: 'Dark', icon: <Icon name="i-spark" /> },
      ],
    },
    {
      label: 'Language',
      options: [
        /* 语言名取语言包里已有的 endonym 键，与语言切换器同一来源，不硬编码中文 */
        { value: 'zh-CN', label: t('localeSwitch.zhCN') },
        { value: 'en', label: t('localeSwitch.enUS') },
        { value: 'ja', label: t('localeSwitch.ja') },
      ],
    },
  ]
  /* 长列表：三十项，足以让弹层溢出并显示上下滚动箭头 */
  const longOptions = Array.from({ length: 30 }, (_, index) => ({
    value: `item-${index}`,
    label: `Option ${index + 1}`,
  }))
  /* 搜索示例的数据：名称用于过滤，说明与图标一起展示异形布局下的筛选结果 */
  const searchOptions = [
    { value: 'reading', label: 'Reading', description: 'Narrow column, larger line spacing', icon: <Icon name="i-book" /> },
    { value: 'tool', label: 'Tool', description: 'Wide column for panels and tables', icon: <Icon name="i-board" /> },
    { value: 'task', label: 'Task', description: 'Two columns with a status rail', icon: <Icon name="i-tasks" /> },
    { value: 'recent', label: 'Recent', description: 'Opened in the last seven days', icon: <Icon name="i-clock" /> },
    { value: 'suggested', label: 'Suggested', description: 'Picked from your recent work', icon: <Icon name="i-spark" />, disabled: true },
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

        {/* 状态齐：默认 · 悬停 · 焦点 · 禁用 · 错误 · 加载 · 空，一态一个样例。
            悬停与焦点用设计类的静态态（真实交互由伪类驱动），错误用字段自身的错误态，
            禁用用真实属性，空态只留占位符。样例值写成常量：值为空时各态的差别（文字色 ·
            指示器）在屏幕上根本看不见，清单页就失去了核对的作用。 */}
        <h3 className="base-subgroup__title">{t('base.sub.states')}</h3>
        <div className="base-grid">
          <Input
            id="demo-state-default"
            label="default"
            value="value"
            onChange={() => {}}
          />
          <Input
            id="demo-state-hover"
            label="is-hover"
            state="hover"
            value="value"
            onChange={() => {}}
          />
          <Input
            id="demo-state-focus"
            label="is-focus"
            state="focus"
            value="value"
            onChange={() => {}}
          />
          <Input
            id="demo-state-disabled"
            label="disabled"
            value="not editable"
            onChange={() => {}}
            disabled
          />
          <Input
            id="demo-state-error"
            label="is-error"
            state="error"
            value="value"
            onChange={() => {}}
          />
          <Input
            id="demo-state-loading"
            label="is-loading"
            state="loading"
            value="value"
            onChange={() => {}}
          />
          <Input
            id="demo-state-empty"
            label="empty"
            placeholder="empty"
            value=""
            onChange={() => {}}
          />
          {/* 错误抖动是**可选**的一次性反馈，默认不加。这里按真实用法演示：传的是计数器，
              因此连点重放会一次次重播，不需要页面替它复位，组件自己在播完后摘类。 */}
          <Input
            id="demo-shake"
            label="is-shake"
            state="error"
            shake={shakeTick}
            value="value"
            onChange={() => {}}
          />
          <div className="base-demo">
            <span className="base-demo__name">replay</span>
            <Button onClick={() => setShakeTick((tick) => tick + 1)}>replay</Button>
          </div>
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
          <Button variant="warn">warn</Button>
          <Button variant="success">success</Button>
          <Button variant="danger">danger</Button>
          <Button variant="inverse">inverse</Button>
        </div>
        {/* 形态：与变体同一组，第二排是全圆角胶囊，七个变体逐个对应 */}
        <div className="base-row">
          {(['solid', 'soft', 'ghost', 'warn', 'success', 'danger', 'inverse'] as const).map((variant) => (
            <Button key={variant} variant={variant} shape="pill">
              {variant} · pill
            </Button>
          ))}
        </div>

        {/* 状态齐：**每个样式一行，四组状态**（默认 · 悬停 · 按下 · 聚焦）。
            悬停、按下、聚焦用设计类的静态态（真实交互由伪类驱动）。
            禁用与加载在各样式下表现相同，单独一行共用，不逐样式重复。 */}
        <h3 className="base-subgroup__title">{t('base.sub.states')}</h3>
        {(['solid', 'soft', 'ghost', 'warn', 'success', 'danger', 'inverse'] as const).map((variant) => (
          <div className="base-row" key={variant}>
            <Button variant={variant}>{variant} · default</Button>
            <Button variant={variant} state="hover">
              {variant} · hover
            </Button>
            <Button variant={variant} state="active">
              {variant} · active
            </Button>
            <Button variant={variant} state="focus">
              {variant} · focus
            </Button>
          </div>
        ))}
        <div className="base-row">
          <Button variant="solid" disabled>
            disabled
          </Button>
          <Button variant="solid" loading>
            loading
          </Button>
        </div>

        <h3 className="base-subgroup__title">{t('base.sub.sizes')}</h3>
        {/* 尺寸与形态：每个尺寸两行，第一行常规圆角、第二行全圆角胶囊，各自列全七个变体。
            两行都必须是 .base-group 的直接子元素，才吃得到容器的统一间距；
            套一层包裹元素会把间距掐断，两行首尾相接，看上去像叠在一起。 */}
        {(
          [
            ['small', 'small 24'],
            ['medium', 'medium 32'],
            ['large', 'large 40'],
          ] as const
        ).flatMap(([size, label]) => [
          <div className="base-row" key={`${size}-rounded`}>
            {(['solid', 'soft', 'ghost', 'warn', 'success', 'danger', 'inverse'] as const).map((variant) => (
              <Button key={variant} variant={variant} size={size}>
                {label} · {variant}
              </Button>
            ))}
          </div>,
          <div className="base-row" key={`${size}-pill`}>
            {(['solid', 'soft', 'ghost', 'warn', 'success', 'danger', 'inverse'] as const).map((variant) => (
              <Button key={variant} variant={variant} size={size} shape="pill">
                pill {label} · {variant}
              </Button>
            ))}
          </div>,
        ])}
        <div className="base-row">
          <Button variant="inverse" block>
            {t('base.action.block')}
          </Button>
        </div>
      </section>

      <section className="base-group">
        <h2 className="base-group__title">{t('base.group.select')}</h2>

        <h3 className="base-subgroup__title">{t('base.sub.props')}</h3>
        <div className="base-row">
          <Select
            aria-label="select placeholder"
            value=""
            onValueChange={() => {}}
            options={selectOptions}
            placeholder={t('base.select.placeholder')}
          />
          <Select
            aria-label="select with icon"
            value={theme}
            onValueChange={setTheme}
            options={selectOptions}
            icon={<Icon name="i-search" />}
          />
          <Select aria-label="select error" value={theme} onValueChange={() => {}} options={selectOptions} error />
          <Select aria-label="select disabled" value={theme} onValueChange={() => {}} options={selectOptions} disabled />
        </div>

        <h3 className="base-subgroup__title">{t('base.sub.states')}</h3>
        <div className="base-row">
          <Select aria-label="select default" value={theme} onValueChange={setTheme} options={selectOptions} />
          <Select aria-label="select hover" value={theme} onValueChange={() => {}} options={selectOptions} state="hover" />
          <Select aria-label="select focus" value={theme} onValueChange={() => {}} options={selectOptions} state="focus" />
        </div>

        <h3 className="base-subgroup__title">{t('base.sub.sizes')}</h3>
        <div className="base-row">
          <Select aria-label="select small" value={theme} onValueChange={setTheme} options={selectOptions} size="small" />
          <Select aria-label="select medium" value={theme} onValueChange={setTheme} options={selectOptions} />
          <Select aria-label="select large" value={theme} onValueChange={setTheme} options={selectOptions} size="large" />
        </div>

        <h3 className="base-subgroup__title">{t('base.sub.options')}</h3>
        <div className="base-row">
          <Select aria-label="select plain options" value={theme} onValueChange={setTheme} options={selectOptions} />
          <Select aria-label="select icon options" value="reading" onValueChange={() => {}} options={iconOptions} />
          <Select
            aria-label="select rich options"
            value="reading"
            onValueChange={() => {}}
            options={richOptions}
            icon={<Icon name="i-book" />}
          />
          <Select aria-label="select trailing options" value="compact" onValueChange={() => {}} options={trailingOptions} />
        </div>

        <h3 className="base-subgroup__title">{t('base.sub.groups')}</h3>
        <div className="base-row">
          <Select aria-label="select groups" value="light" onValueChange={() => {}} groups={groupedOptions} />
        </div>

        <h3 className="base-subgroup__title">{t('base.sub.longList')}</h3>
        <div className="base-row">
          <Select aria-label="select long list" value="item-0" onValueChange={() => {}} options={longOptions} />
        </div>

        <h3 className="base-subgroup__title">{t('base.sub.multiple')}</h3>
        <div className="base-row">
          <Select
            multiple
            aria-label="select multiple"
            value={multiTheme}
            onValueChange={setMultiTheme}
            options={selectOptions}
          />
          <Select
            multiple
            aria-label="select multiple icons"
            value={multiIcon}
            onValueChange={setMultiIcon}
            options={iconOptions}
          />
        </div>

        <h3 className="base-subgroup__title">{t('base.sub.search')}</h3>
        <div className="base-row">
          <Select
            searchable
            aria-label="select searchable"
            searchLabel={t('base.select.search')}
            noMatchText={t('base.select.noMatch')}
            value=""
            onValueChange={() => {}}
            options={searchOptions}
            placeholder={t('base.select.placeholder')}
          />
          {/* 等行高的长列表加搜索：用来核对「最大高度对齐整行」在带筛选框时仍成立 */}
          <Select
            searchable
            aria-label="select searchable long"
            searchLabel={t('base.select.search')}
            noMatchText={t('base.select.noMatch')}
            value=""
            onValueChange={() => {}}
            options={longOptions}
            placeholder={t('base.select.placeholder')}
          />
        </div>

        <h3 className="base-subgroup__title">{t('base.sub.empty')}</h3>
        <div className="base-row">
          <Select
            aria-label="select empty"
            value=""
            onValueChange={() => {}}
            options={[]}
            placeholder={t('base.select.placeholder')}
            emptyText={t('base.select.empty')}
          />
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

        {/* 分段控件：默认档与反色档、带图标、整组禁用，以及静态的悬停与聚焦态。
            段文案是示例数据（不属于页面文案），主题切换件的真实文案在各功能自己的语言包里。 */}
        <div className="base-row">
          <SegmentedControl
            aria-label="segmented default"
            value={segmentedTheme}
            onValueChange={setSegmentedTheme}
            options={SEGMENTED_THEME}
          />
          <SegmentedControl
            inverse
            aria-label="segmented inverse"
            value={segmentedTheme}
            onValueChange={setSegmentedTheme}
            options={SEGMENTED_THEME}
          />
        </div>
        <div className="base-row">
          <SegmentedControl
            aria-label="segmented icons"
            value={segmentedRange}
            onValueChange={setSegmentedRange}
            options={SEGMENTED_RANGE}
          />
          <SegmentedControl
            aria-label="segmented disabled"
            value="week"
            onValueChange={() => {}}
            options={SEGMENTED_RANGE}
            disabled
          />
        </div>
        <div className="base-row">
          <SegmentedControl
            aria-label="segmented hover"
            value="week"
            onValueChange={() => {}}
            options={SEGMENTED_RANGE}
            state="hover"
          />
          <SegmentedControl
            aria-label="segmented focus"
            value="week"
            onValueChange={() => {}}
            options={SEGMENTED_RANGE}
            state="focus"
          />
        </div>
      </section>
    </ScaffoldPage>
  )
}
