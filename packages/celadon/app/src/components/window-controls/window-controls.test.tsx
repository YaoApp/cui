import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WindowControls } from './window-controls'

/* 窗口键归谁由 useWindowChrome 决定：自绘只在 Windows 出现，macOS 有原生交通灯、Web 没有窗口。 */
const chrome = {
	visible: true,
	controls: 'own' as 'native' | 'own' | 'none',
	maximized: false,
	toggleMaximize: vi.fn(),
	dragProps: {},
	dragHandlers: { onPointerDown: vi.fn() },
	dragState: 'idle',
	minimize: vi.fn(),
	close: vi.fn()
}

vi.mock('@/platform/client', () => ({
	useWindowChrome: () => chrome
}))

vi.mock('@/platform/i18n', () => ({
	useTranslation: () => ({ t: (key: string) => key })
}))

describe('WindowControls', () => {
	it('自绘平台画三个键，按下分别是最小化、最大化与关闭', async () => {
		chrome.controls = 'own'
		chrome.minimize = vi.fn()
		chrome.toggleMaximize = vi.fn()
		chrome.close = vi.fn()
		render(<WindowControls />)

		const keys = screen.getAllByRole('button')
		expect(keys).toHaveLength(3)

		await userEvent.click(screen.getByLabelText('shell.window.minimize'))
		await userEvent.click(screen.getByLabelText('shell.window.maximize'))
		await userEvent.click(screen.getByLabelText('shell.window.close'))
		expect(chrome.minimize).toHaveBeenCalledTimes(1)
		expect(chrome.toggleMaximize).toHaveBeenCalledTimes(1)
		expect(chrome.close).toHaveBeenCalledTimes(1)
	})

	it('已最大化时中间那个键改叫还原', () => {
		chrome.controls = 'own'
		chrome.maximized = true
		render(<WindowControls />)
		expect(screen.getByLabelText('shell.window.restore')).toBeTruthy()
	})

	it('原生与无窗口的平台什么都不画', () => {
		chrome.controls = 'native'
		const first = render(<WindowControls />)
		expect(first.container.querySelectorAll('button')).toHaveLength(0)
		first.unmount()

		chrome.controls = 'none'
		const second = render(<WindowControls />)
		expect(second.container.querySelectorAll('button')).toHaveLength(0)
	})
})
