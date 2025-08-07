// PPTX 相关类型定义

export interface PptxSlide {
	id: string
	title?: string
	content: PptxElement[]
	background?: PptxElement // 幻灯片背景
}

export interface PptxElement {
	type: 'text' | 'image' | 'shape' | 'table' | 'background'
	x: number
	y: number
	width: number
	height: number
	content?: string
	style?: PptxStyle
	children?: PptxElement[]
	src?: string // 图片源地址
	rotation?: number // 旋转角度
	zIndex?: number // 层级
	opacity?: number // 透明度 (0-1)
}

export interface PptxStyle {
	fontSize?: number
	fontFamily?: string
	color?: string
	backgroundColor?: string
	bold?: boolean
	italic?: boolean
	underline?: boolean
	textAlign?: 'left' | 'center' | 'right' | 'justify'
	hasBullet?: boolean // 是否有项目符号
	bulletLevel?: number // 项目符号级别（缩进层级）
}

export interface PptxDocument {
	slides: PptxSlide[]
	theme?: PptxTheme
	slideSize?: PptxSlideSize
}

export interface PptxSlideSize {
	width: number // 幻灯片宽度（像素）
	height: number // 幻灯片高度（像素）
	cx: number // 原始 EMU 宽度
	cy: number // 原始 EMU 高度
}

export interface PptxTheme {
	colorScheme?: string[]
	fontScheme?: {
		majorFont?: string
		minorFont?: string
	}
}

export interface PptxParserOptions {
	extractImages?: boolean
	preserveFormatting?: boolean
	convertToHtml?: boolean
}
