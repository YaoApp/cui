import { observer } from 'mobx-react-lite'
import { getLocale } from '@umijs/max'
import { useGlobal } from '@/context/app'
import { getDefaultLogoUrl } from '@/services/wellknown'
import Settings from '@/pages/auth/components/Settings'
import Icon from '@/widgets/Icon'
import StepIndicator from './StepIndicator'
import styles from '../index.less'

interface StepItem {
	label: string
}

interface SetupLayoutProps {
	children: React.ReactNode
	showBack?: boolean
	onBack?: () => void
	steps?: StepItem[]
	currentStep?: number
}

const SetupLayout = observer(({ children, showBack, onBack, steps, currentStep }: SetupLayoutProps) => {
	const global = useGlobal()
	const is_cn = getLocale() === 'zh-CN'
	const logo = global.app_info?.logo || getDefaultLogoUrl()
	const appName = global.app_info?.name || 'Yao Agents'

	const handleThemeChange = (theme: 'light' | 'dark') => {
		global.setTheme(theme)
	}

	return (
		<div className={styles.setupLayout}>
			<div className={styles.setupHeader}>
				<div className={styles.setupLogo}>
					<img src={logo} alt='Logo' />
					<span>{appName}</span>
				</div>
				<div className={styles.setupHeaderRight}>
					<Settings theme={global.theme} onThemeChange={handleThemeChange} />
				</div>
			</div>

			{(showBack || steps) && (
				<div className={styles.setupNav}>
					{showBack ? (
						<button className={styles.backButton} type='button' onClick={onBack}>
							<Icon name='material-arrow_back' size={16} />
							<span>{is_cn ? '返回' : 'Back'}</span>
						</button>
					) : (
						<div />
					)}
					{steps && currentStep !== undefined && (
						<StepIndicator steps={steps} current={currentStep} />
					)}
				</div>
			)}

			<div className={styles.setupBody}>
				<div className={styles.setupContent}>{children}</div>
			</div>
		</div>
	)
})

export default SetupLayout
