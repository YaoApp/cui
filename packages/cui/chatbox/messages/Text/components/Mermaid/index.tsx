import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { getLocale } from '@umijs/max'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import styles from './index.less'

// Helper to get theme-aware colors from CSS variables
const getThemeColors = () => {
	const style = getComputedStyle(document.documentElement)
	return {
		// Background colors
		bgCard: style.getPropertyValue('--color_chatbox_bg_card').trim(),
		bgContent: style.getPropertyValue('--color_chatbox_bg_content').trim(),
		bgField: style.getPropertyValue('--color_chatbox_bg_field').trim(),

		// Text colors
		textPrimary: style.getPropertyValue('--color_chatbox_text_primary').trim(),
		textSecondary: style.getPropertyValue('--color_chatbox_text_secondary').trim(),
		textTertiary: style.getPropertyValue('--color_chatbox_text_tertiary').trim(),

		// Border colors
		borderCard: style.getPropertyValue('--color_chatbox_border_card').trim(),
		borderHover: style.getPropertyValue('--color_chatbox_border_hover').trim(),

		// Semantic colors
		primary: style.getPropertyValue('--color_primary').trim(),
		success: style.getPropertyValue('--color_success').trim(),
		warning: style.getPropertyValue('--color_warning').trim(),
		danger: style.getPropertyValue('--color_danger').trim(),
		info: style.getPropertyValue('--color_info').trim()
	}
}

// Initialize mermaid with dynamic theme
const initMermaid = () => {
	const colors = getThemeColors()

	mermaid.initialize({
		startOnLoad: false,
		theme: 'base',
		securityLevel: 'loose',
		fontFamily: 'system-ui, -apple-system, sans-serif',
		// Pie chart configuration
		pie: {
			textPosition: 0.65,
			useMaxWidth: true
		},
		themeVariables: {
			// Primary color (used for most nodes and shapes) - use subtle borders instead
			primaryColor: colors.bgCard,
			primaryTextColor: colors.textPrimary,
			primaryBorderColor: colors.borderCard,

			// Secondary color (used for alternate elements)
			secondaryColor: colors.bgField,
			secondaryTextColor: colors.textPrimary,
			secondaryBorderColor: colors.borderCard,

			// Tertiary color (used for additional variety)
			tertiaryColor: colors.bgContent,
			tertiaryTextColor: colors.textPrimary,
			tertiaryBorderColor: colors.borderCard,

			// Additional colors for variety in pie charts, etc.
			noteBkgColor: colors.bgField,
			noteTextColor: colors.textPrimary,
			noteBorderColor: colors.borderCard,

			// Background
			background: colors.bgCard,
			mainBkg: colors.bgCard,
			secondaryBkg: colors.bgField,
			tertiaryBkg: colors.bgContent,

			// Text
			textColor: colors.textPrimary,
			nodeTextColor: colors.textPrimary,

			// Lines and connections
			lineColor: colors.borderHover,
			edgeLabelBackground: colors.bgCard,

			// Borders - use subtle borders throughout
			border1: colors.borderCard,
			border2: colors.borderHover,

			// Cluster/group
			clusterBkg: colors.bgField,
			clusterBorder: colors.borderCard,

			// Default link
			defaultLinkColor: colors.borderHover,

			// Pie chart section colors (for variety)
			pie1: colors.primary,
			pie2: colors.success,
			pie3: colors.warning,
			pie4: colors.danger,
			pie5: colors.info,
			pie6: colors.textSecondary,
			pie7: colors.primary,
			pie8: colors.success,
			pie9: colors.warning,
			pie10: colors.danger,
			pie11: colors.info,
			pie12: colors.textSecondary,

			// Flowchart colors
			actor0: colors.primary,
			actor1: colors.info,
			actor2: colors.success,
			actor3: colors.warning,

			// Additional state/class colors
			classText: colors.textPrimary,
			fillType0: colors.primary,
			fillType1: colors.success,
			fillType2: colors.warning,
			fillType3: colors.danger,
			fillType4: colors.info,
			fillType5: colors.textSecondary,
			fillType6: colors.primary,
			fillType7: colors.success
		}
	})
}

// Initial setup
initMermaid()

interface Props {
	chart: string
	chat_id?: string
}

const Mermaid = ({ chart }: Props) => {
	const global = useGlobal()
	const elementRef = useRef<HTMLDivElement>(null)
	const [svg, setSvg] = useState<string>('')
	const [error, setError] = useState<string | null>(null)
	const [isProcessing, setIsProcessing] = useState(false)
	const [renderKey, setRenderKey] = useState(0)
	const [hasRenderedSuccessfully, setHasRenderedSuccessfully] = useState(false)
	const is_cn = getLocale() === 'zh-CN'

	// Re-initialize mermaid when theme changes
	useEffect(() => {
		initMermaid()
		// Clear SVG and force re-render by updating the render key
		setSvg('')
		setError(null)
		setHasRenderedSuccessfully(false)
		setRenderKey((prev) => prev + 1)
	}, [global.theme])

	useEffect(() => {
		let mounted = true
		const renderDiagram = async () => {
			if (!elementRef.current || !chart) return
			if (isProcessing) return

			setIsProcessing(true)
			try {
				// Clean chart content
				const cleanChart = chart.replace(/[""]/g, '"').replace(/['']/g, "'").trim()

				const id = `mermaid-${Math.random().toString(36).substring(2, 15)}`

				// Render
				const { svg } = await mermaid.render(id, cleanChart)
				if (mounted) {
					setSvg(svg)
					setError(null)
					setHasRenderedSuccessfully(true)
				}
			} catch (err: any) {
				// Only show error if we've never successfully rendered before
				// This prevents error flashing during streaming
				if (mounted && !hasRenderedSuccessfully) {
					console.error('Mermaid render error:', err)
					setError(err.message || 'Render failed')
				}
				// During streaming, keep showing the last successful render
			} finally {
				if (mounted) setIsProcessing(false)
			}
		}

		// Debounce
		const timer = setTimeout(renderDiagram, 200)
		return () => {
			clearTimeout(timer)
			mounted = false
		}
	}, [chart, renderKey])

	if (error) {
		return (
			<div className={styles._local}>
				<div className='mermaid-error'>
					<div className='error-message'>
						<span>⚠️</span>
						{is_cn ? '图表渲染失败' : 'Failed to render diagram'}
					</div>
					<div className='error-detail' style={{ color: 'var(--color_text_light)' }}>
						{error}
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className={styles._local}>
			{isProcessing && !svg ? (
				<div className='text_center pa_3 color_text_grey'>{is_cn ? '正在渲染...' : 'Rendering...'}</div>
			) : (
				<div ref={elementRef} className='mermaid-diagram' dangerouslySetInnerHTML={{ __html: svg }} />
			)}
		</div>
	)
}

export default observer(Mermaid)
