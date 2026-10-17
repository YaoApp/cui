/* Windows 的自绘标题栏：单独一行，位于整个应用之上，看起来就是一条系统标题栏。
   最左侧只有一个收起键（导航列），右端是自绘的三个窗口键；下方内容与 Web 完全一致，
   不做任何 Windows 专属的内容布局。
   macOS 不画这一行：那里的原生交通灯与内容顶行在同一行里；Web 没有窗口。 */
import { Button, Icon, Tooltip } from '@/components/base'
import { WindowControls } from '@/components/window-controls'
import { useTranslation } from '@/platform/i18n'
import { useWindowChrome } from '@/platform/client'
import './title-bar.less'

export type TitleBarProps = {
	/** 导航列是否收起 */
	navCollapsed: boolean
	onToggleNav: () => void
}

export function TitleBar({ navCollapsed, onToggleNav }: TitleBarProps) {
	const { t } = useTranslation()
	const chrome = useWindowChrome()
	if (chrome.controls !== 'own') return null

	const navLabel = navCollapsed ? t('shell.navigation.action.expand') : t('shell.navigation.action.collapse')

	return (
		<header className='title-bar'>
			<Tooltip label={navLabel} side='bottom'>
				<Button
					className='title-bar__key'
					iconOnly
					variant='plain'
					size='small'
					aria-label={navLabel}
					aria-expanded={!navCollapsed}
					onClick={onToggleNav}
				>
					<Icon name='i-panel-left' size={14} />
				</Button>
			</Tooltip>
			<WindowControls />
		</header>
	)
}
