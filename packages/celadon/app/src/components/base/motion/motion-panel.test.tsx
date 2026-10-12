import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MotionPanel } from './motion-panel'
import { PANEL_SPRING, panelTiming } from './panel-motion'

describe('MotionPanel', () => {
	it('renders its children and keeps the requested tag', () => {
		render(
			<MotionPanel as='aside' data-testid='panel'>
				<span>条目</span>
			</MotionPanel>,
		)
		expect(screen.getByTestId('panel').tagName).toBe('ASIDE')
		expect(screen.getByText('条目')).toBeVisible()
	})

	it('renders a position element for text rows', () => {
		render(
			<MotionPanel position data-testid='row'>
				文字
			</MotionPanel>,
		)
		expect(screen.getByTestId('row')).toBeVisible()
	})

	it('offers a spring and a duration timing', () => {
		expect(PANEL_SPRING.type).toBe('spring')
		expect(panelTiming(true)).toEqual({ duration: 0 })
	})
})
