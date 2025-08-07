// PPTX 解析工具函数

/**
 * 将 EMU (English Metric Units) 转换为像素
 * 1 EMU = 1/914400 英寸, 1 英寸 = 96 像素
 */
export function emuToPixels(emu: number): number {
	return Math.round((emu / 914400) * 96)
}

/**
 * 将 PPTX 坐标转换为 CSS 像素
 */
export function pptxToPx(value: string | number): number {
	if (typeof value === 'number') return emuToPixels(value)

	// 移除单位并转换
	const numValue = parseInt(value.toString().replace(/[^\d-]/g, ''))
	return emuToPixels(numValue)
}

/**
 * 计算缩放比例，用于将PPTX坐标转换为目标显示尺寸
 */
export function calculateScale(
	originalWidth: number,
	originalHeight: number,
	targetWidth: number,
	targetHeight: number
): { scaleX: number; scaleY: number } {
	return {
		scaleX: targetWidth / originalWidth,
		scaleY: targetHeight / originalHeight
	}
}

/**
 * 应用缩放比例转换坐标
 */
export function scaleCoordinate(value: number, scale: number): number {
	return Math.round(value * scale)
}

/**
 * 解析颜色值
 */
export function parseColor(colorStr: string): string {
	if (!colorStr) return '#000000'

	// 处理各种颜色格式
	if (colorStr.startsWith('#')) return colorStr
	if (colorStr.length === 6) return `#${colorStr}`
	if (colorStr.length === 8) return `#${colorStr.substring(2)}` // 去掉 alpha

	return '#000000'
}

/**
 * 解析字体大小 (以百分点为单位)
 */
export function parseFontSize(size: string | number): number {
	if (typeof size === 'number') return size / 100

	const numSize = parseInt(size.toString())
	return numSize ? numSize / 100 : 14
}

/**
 * 清理和规范化文本内容
 */
export function cleanText(text: string): string {
	if (!text) return ''

	return text
		.replace(/\s+/g, ' ') // 合并多个空格
		.replace(/\n\s*\n/g, '\n') // 合并多个换行
		.trim()
}

/**
 * 解析 XML 属性值
 */
export function getXmlAttr(element: Element, attrName: string, defaultValue: string = ''): string {
	return element.getAttribute(attrName) || defaultValue
}

/**
 * 获取 XML 元素的文本内容
 */
export function getXmlText(element: Element | null): string {
	if (!element) return ''
	return element.textContent || ''
}

/**
 * 解析布尔属性
 */
export function parseBoolAttr(value: string): boolean {
	return value === '1' || value === 'true' || value === 'on'
}

/**
 * 解析旋转角度（以度为单位）
 */
export function parseRotation(rot: string): number {
	if (!rot) return 0

	// PPTX 中旋转角度以 60000 为单位表示度数
	const angle = parseInt(rot) / 60000
	return angle
}

/**
 * 从关系文件中解析图片引用
 */
export function parseImageRef(rId: string, relationships: Map<string, string>): string | null {
	return relationships.get(rId) || null
}

/**
 * 解析文本对齐方式
 */
export function parseTextAlign(algn: string): string {
	switch (algn) {
		case 'l':
			return 'left'
		case 'ctr':
			return 'center'
		case 'r':
			return 'right'
		case 'just':
			return 'justify'
		default:
			return 'left'
	}
}
