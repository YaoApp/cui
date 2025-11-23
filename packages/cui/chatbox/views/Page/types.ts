import type { IPropsNeo } from '../../../layouts/types'

/**
 * Header display mode
 * - 'tabs': Multiple conversations switching (Default)
 * - 'single': Single conversation title
 * - 'custom': Custom header content
 */
export type HeaderMode = 'tabs' | 'single' | 'custom'

/**
 * Component properties definition for Page mode
 * Inherits from Neo's base properties and extends with page-specific configurations
 */
export interface IProps extends IPropsNeo {
	/**
	 * Page title
	 * Used as the main title in 'single' mode or fallback for tabs
	 */
	title?: string

	/**
	 * Header display configuration
	 * @default 'tabs'
	 */
	headerMode?: HeaderMode

	/**
	 * Custom header component
	 * Only active when headerMode is 'custom'
	 */
	customHeader?: React.ReactNode

	/**
	 * Custom CSS class name
	 */
	className?: string

	/**
	 * Custom CSS style object
	 */
	style?: React.CSSProperties

	/**
	 * Content padding configuration (px)
	 * If a single number is provided, it applies to horizontal padding in standard mode
	 * @default 32
	 */
	padding?: number | { x?: number; y?: number }
}
