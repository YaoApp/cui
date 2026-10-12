/* 自绘的窗口键：最小化 · 最大化与还原 · 关闭。只在窗口键归我们自己的平台（Windows）出现，
   macOS 有原生交通灯、Web 没有窗口可管，两者都不画（见内部文档「桌面客户端壳」第二节的规格）。
   三个键等距、细线字形、无底色，关闭键平时也是普通灰，悬停才用危险色。 */
import { useTranslation } from '@/platform/i18n'
import { useWindowChrome } from '@/platform/client'
import { Button, Icon } from '@/components/base'
import './window-controls.less'

export function WindowControls() {
	const { t } = useTranslation()
	const chrome = useWindowChrome()
	if (chrome.controls !== 'own') return null
	return (
		<span className='window-controls' data-no-drag>
			<Button
				className='window-controls__key'
				iconOnly
				variant='plain'
				size='small'
				aria-label={t('shell.window.minimize')}
				onClick={chrome.minimize}
			>
				<Icon name='i-minus' size={14} />
			</Button>
			<Button
				className='window-controls__key'
				iconOnly
				variant='plain'
				size='small'
				aria-label={chrome.maximized ? t('shell.window.restore') : t('shell.window.maximize')}
				onClick={chrome.toggleMaximize}
			>
				{/* 与关闭、最小化同一套图标：同一精灵图、同一线宽与字号，最大化与还原各一枚 */}
				<Icon name={chrome.maximized ? 'i-win-restore' : 'i-win-max'} size={14} />
			</Button>
			<Button
				className='window-controls__key window-controls__key--close'
				iconOnly
				variant='plain'
				size='small'
				aria-label={t('shell.window.close')}
				onClick={chrome.close}
			>
				<Icon name='i-act-close' size={14} />
			</Button>
		</span>
	)
}
