import JSZip from 'jszip'
import { PptxDocument, PptxSlide, PptxElement, PptxStyle, PptxParserOptions, PptxSlideSize } from './types'
import {
	pptxToPx,
	parseColor,
	parseFontSize,
	cleanText,
	getXmlAttr,
	getXmlText,
	parseBoolAttr,
	parseRotation,
	parseImageRef,
	parseTextAlign,
	calculateScale,
	scaleCoordinate
} from './utils'

export default class PptxParser {
	private zip: JSZip | null = null
	private options: PptxParserOptions
	private imageCache: Map<string, string> = new Map()
	private slideSize: PptxSlideSize | undefined = undefined

	constructor(options: PptxParserOptions = {}) {
		this.options = {
			extractImages: false,
			preserveFormatting: true,
			convertToHtml: true,
			...options
		}
	}

	private getTargetDisplaySize(): { width: number; height: number } {
		if (this.slideSize) {
			return {
				width: this.slideSize.width,
				height: this.slideSize.height
			}
		}
		return { width: 960, height: 720 }
	}

	private transformCoordinate(
		x: number,
		y: number,
		width: number,
		height: number
	): { x: number; y: number; width: number; height: number } {
		return { x, y, width, height }
	}

	async parse(buffer: ArrayBuffer): Promise<PptxDocument> {
		this.zip = new JSZip()
		await this.zip.loadAsync(buffer)

		await this.parseSlideSize()
		const slides = await this.parseSlides()

		return {
			slides,
			slideSize: this.slideSize
		}
	}

	private async parseSlideSize(): Promise<void> {
		try {
			const presentationXml = await this.zip?.file('ppt/presentation.xml')?.async('text')
			if (!presentationXml) return

			const parser = new DOMParser()
			const doc = parser.parseFromString(presentationXml, 'text/xml')

			const sldSz = doc.querySelector('p\\:sldSz, sldSz')
			if (sldSz) {
				const cx = parseInt(getXmlAttr(sldSz, 'cx', '9144000'))
				const cy = parseInt(getXmlAttr(sldSz, 'cy', '6858000'))

				this.slideSize = {
					width: pptxToPx(cx),
					height: pptxToPx(cy),
					cx,
					cy
				}
			}
		} catch (error) {
			this.slideSize = { width: 960, height: 720, cx: 9144000, cy: 6858000 }
		}
	}

	private async parseSlides(): Promise<PptxSlide[]> {
		const slides: PptxSlide[] = []

		const slideFiles = Object.keys(this.zip?.files || {})
			.filter((filename) => filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml'))
			.sort((a, b) => {
				const numA = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0')
				const numB = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0')
				return numA - numB
			})

		for (const filename of slideFiles) {
			try {
				const slideXml = await this.zip?.file(filename)?.async('text')
				if (!slideXml) continue

				const slide = await this.parseSlide(slideXml, filename)
				slides.push(slide)
			} catch (error) {
				console.warn(`Failed to parse slide ${filename}:`, error)
			}
		}

		return slides
	}

	private async parseSlide(xmlContent: string, filename: string): Promise<PptxSlide> {
		const parser = new DOMParser()
		const doc = parser.parseFromString(xmlContent, 'text/xml')
		const slideId = filename.replace(/.*slide(\d+)\.xml$/, '$1')

		const relationships = await this.parseSlideRelationships(slideId)

		let background = await this.parseSlideBackground(doc, relationships)

		if (!background) {
			background = await this.parseSlideMasterBackground(slideId)
		}

		const elements = await this.parseSlideElements(doc, relationships, slideId)

		return {
			id: slideId,
			content: elements,
			background: background || undefined
		}
	}

	private async parseSlideElements(
		doc: Document,
		relationships: Map<string, string>,
		slideId?: string
	): Promise<PptxElement[]> {
		const elements: PptxElement[] = []

		const shapes = doc.querySelectorAll('p\\:sp, sp')
		for (let i = 0; i < shapes.length; i++) {
			const shape = shapes[i]
			try {
				const element = await this.parseShape(shape, relationships, slideId)
				if (element !== null) {
					elements.push(element)
				}
			} catch (error) {
				console.warn(`Failed to parse shape ${i + 1}:`, error)
			}
		}

		const pictures = doc.querySelectorAll('p\\:pic, pic')

		for (const pic of Array.from(pictures)) {
			try {
				const element = await this.parsePicture(pic, relationships)
				if (element !== null) {
					const isBackground =
						element.width > 600 &&
						element.height > 400 &&
						Math.abs(element.x) < 50 &&
						Math.abs(element.y) < 50

					if (!isBackground) {
						elements.push(element)
					}
				}
			} catch (error) {
				console.warn('Failed to parse picture:', error)
			}
		}

		elements.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
		return elements
	}

	private async parseShape(
		shapeElement: Element,
		relationships: Map<string, string>,
		slideId?: string
	): Promise<PptxElement | null> {
		const spPr = shapeElement.querySelector('p\\:spPr, spPr')
		const xfrm = spPr?.querySelector('a\\:xfrm, xfrm')
		let off = xfrm?.querySelector('a\\:off, off')
		let ext = xfrm?.querySelector('a\\:ext, ext')

		// 如果没有找到位置信息，尝试从占位符信息中获取
		if (!off || !ext) {
			const placeholderInfo = await this.getPlaceholderPosition(shapeElement, slideId)
			if (placeholderInfo) {
				const textBody = shapeElement.querySelector('p\\:txBody, txBody')
				if (textBody) {
					const textContent = await this.parseTextContent(textBody)
					if (textContent && textContent.trim()) {
						const style = await this.parseTextStyle(textBody)
						return {
							type: 'text',
							x: placeholderInfo.x,
							y: placeholderInfo.y,
							width: placeholderInfo.width,
							height: placeholderInfo.height,
							content: textContent,
							style,
							zIndex: 1
						}
					}
				}
			}

			// 最后的默认处理
			const textBody = shapeElement.querySelector('p\\:txBody, txBody')
			if (textBody) {
				const textContent = await this.parseTextContent(textBody)
				if (textContent && textContent.trim()) {
					const style = await this.parseTextStyle(textBody)
					return {
						type: 'text',
						x: 0,
						y: 0,
						width: 400,
						height: 100,
						content: textContent,
						style,
						zIndex: 1
					}
				}
			}
			return null
		}

		const x = pptxToPx(getXmlAttr(off, 'x', '0'))
		const y = pptxToPx(getXmlAttr(off, 'y', '0'))
		const width = pptxToPx(getXmlAttr(ext, 'cx', '0'))
		const height = pptxToPx(getXmlAttr(ext, 'cy', '0'))

		const transformed = this.transformCoordinate(x, y, width, height)

		const textBody = shapeElement.querySelector('p\\:txBody, txBody')
		if (textBody) {
			const textContent = await this.parseTextContent(textBody)
			const style = await this.parseTextStyle(textBody)

			return {
				type: 'text',
				x: transformed.x,
				y: transformed.y,
				width: transformed.width,
				height: transformed.height,
				content: textContent,
				style,
				zIndex: 1
			}
		}

		return {
			type: 'shape',
			x: transformed.x,
			y: transformed.y,
			width: transformed.width,
			height: transformed.height,
			content: '',
			zIndex: 0
		}
	}

	/**
	 * 获取占位符的位置信息
	 */
	private async getPlaceholderPosition(
		shapeElement: Element,
		slideId?: string
	): Promise<{ x: number; y: number; width: number; height: number } | null> {
		try {
			// 获取占位符信息
			const nvPr = shapeElement.querySelector('p\\:nvSpPr p\\:nvPr, nvSpPr nvPr')
			const ph = nvPr?.querySelector('p\\:ph, ph')

			if (!ph) return null

			const phType = getXmlAttr(ph, 'type') || 'body'
			const phIdx = getXmlAttr(ph, 'idx') || '0'

			// 根据占位符类型返回默认位置
			switch (phType) {
				case 'title':
					return {
						x: pptxToPx(914400), // 1 inch
						y: pptxToPx(457200), // 0.5 inch
						width: pptxToPx(7315200), // 8 inches
						height: pptxToPx(1371600) // 1.5 inches
					}
				case 'body':
					return {
						x: pptxToPx(914400), // 1 inch
						y: pptxToPx(2057400), // 2.25 inches
						width: pptxToPx(7315200), // 8 inches
						height: pptxToPx(4114800) // 4.5 inches
					}
				case 'ctrTitle':
					return {
						x: pptxToPx(1828800), // 2 inches
						y: pptxToPx(1371600), // 1.5 inches
						width: pptxToPx(5486400), // 6 inches
						height: pptxToPx(1371600) // 1.5 inches
					}
				case 'subTitle':
					return {
						x: pptxToPx(1828800), // 2 inches
						y: pptxToPx(3428400), // 3.75 inches
						width: pptxToPx(5486400), // 6 inches
						height: pptxToPx(914400) // 1 inch
					}
				default:
					return {
						x: pptxToPx(914400), // 1 inch
						y: pptxToPx(914400), // 1 inch
						width: pptxToPx(7315200), // 8 inches
						height: pptxToPx(914400) // 1 inch
					}
			}
		} catch (error) {
			return null
		}
	}

	private async parseTextContent(textBody: Element): Promise<string> {
		const paragraphs = textBody.querySelectorAll('a\\:p, p')
		const textParts: string[] = []

		for (let i = 0; i < paragraphs.length; i++) {
			const para = paragraphs[i]
			const runs = para.querySelectorAll('a\\:r, r')
			const paraParts: string[] = []

			// 检查段落属性以确定是否为列表项
			const pPr = para.querySelector('a\\:pPr, pPr')
			const isListItem =
				pPr &&
				(pPr.querySelector('a\\:buChar, buChar') ||
					pPr.querySelector('a\\:buAutoNum, buAutoNum') ||
					getXmlAttr(pPr, 'lvl'))

			for (const run of Array.from(runs)) {
				const textElement = run.querySelector('a\\:t, t')
				if (textElement) {
					const text = getXmlText(textElement)
					paraParts.push(text)
				}
			}

			if (paraParts.length === 0) {
				const allTextNodes = para.querySelectorAll('a\\:t, t')
				for (const textNode of Array.from(allTextNodes)) {
					const text = getXmlText(textNode)
					paraParts.push(text)
				}

				if (paraParts.length === 0) {
					const paraText = getXmlText(para).trim()
					if (paraText) {
						paraParts.push(paraText)
					}
				}
			}

			let paraResult = paraParts.join('').trim()
			if (paraResult) {
				// 为列表项添加项目符号（这里只是作为文本内容的一部分）
				if (isListItem) {
					const lvl = getXmlAttr(pPr, 'lvl')
					const level = lvl ? parseInt(lvl) : 0
					const indent = '  '.repeat(level) // 缩进
					paraResult = `${indent}• ${paraResult}`
				}
				textParts.push(paraResult)
			}
		}

		return cleanText(textParts.join('\n'))
	}

	private async parseTextStyle(textBody: Element): Promise<PptxStyle> {
		const style: PptxStyle = {}

		const firstParagraph = textBody.querySelector('a\\:p, p')
		if (firstParagraph) {
			const pPr = firstParagraph.querySelector('a\\:pPr, pPr')
			if (pPr) {
				const lvl = getXmlAttr(pPr, 'lvl')
				if (lvl !== null) {
					style.textAlign = 'left'
					// 检查是否有项目符号
					const buChar = pPr.querySelector('a\\:buChar, buChar')
					const buAutoNum = pPr.querySelector('a\\:buAutoNum, buAutoNum')
					if (buChar || buAutoNum || parseInt(lvl) > 0) {
						style.hasBullet = true
						style.bulletLevel = parseInt(lvl) || 0
					}
				}

				const alignValue = parseTextAlign(getXmlAttr(pPr, 'algn'))
				if (alignValue) {
					style.textAlign = alignValue as 'center' | 'left' | 'right' | 'justify'
				}
			}

			const firstRun = firstParagraph.querySelector('a\\:r, r')
			if (firstRun) {
				const rPr = firstRun.querySelector('a\\:rPr, rPr')
				if (rPr) {
					const fontSize = parseFontSize(getXmlAttr(rPr, 'sz'))
					if (fontSize) {
						style.fontSize = fontSize
					}

					const fontFamily = getXmlAttr(rPr, 'typeface')
					if (fontFamily) {
						style.fontFamily = fontFamily
					}

					const solidFill = rPr.querySelector('a\\:solidFill, solidFill')
					if (solidFill) {
						const schemeClr = solidFill.querySelector('a\\:schemeClr, schemeClr')
						const srgbClr = solidFill.querySelector('a\\:srgbClr, srgbClr')
						if (schemeClr) {
							const colorVal = getXmlAttr(schemeClr, 'val')
							if (colorVal) {
								style.color = parseColor(colorVal)
							}
						} else if (srgbClr) {
							const colorVal = getXmlAttr(srgbClr, 'val')
							if (colorVal) {
								style.color = '#' + colorVal
							}
						}
					}

					const boldAttr = getXmlAttr(rPr, 'b')
					const italicAttr = getXmlAttr(rPr, 'i')
					const underlineAttr = getXmlAttr(rPr, 'u')

					if (boldAttr) style.bold = parseBoolAttr(boldAttr)
					if (italicAttr) style.italic = parseBoolAttr(italicAttr)
					if (underlineAttr) style.underline = parseBoolAttr(underlineAttr)
				}
			}
		}

		return style
	}

	private async parsePicture(picElement: Element, relationships: Map<string, string>): Promise<PptxElement | null> {
		const spPr = picElement.querySelector('p\\:spPr, spPr')
		const xfrm = spPr?.querySelector('a\\:xfrm, xfrm')
		const off = xfrm?.querySelector('a\\:off, off')
		const ext = xfrm?.querySelector('a\\:ext, ext')

		if (!off || !ext) {
			return null
		}

		const x = pptxToPx(getXmlAttr(off, 'x', '0'))
		const y = pptxToPx(getXmlAttr(off, 'y', '0'))
		const width = pptxToPx(getXmlAttr(ext, 'cx', '0'))
		const height = pptxToPx(getXmlAttr(ext, 'cy', '0'))

		const transformed = this.transformCoordinate(x, y, width, height)

		const blipFill = picElement.querySelector('p\\:blipFill, blipFill')
		if (!blipFill) return null

		const blip = blipFill.querySelector('a\\:blip, blip')
		if (!blip) return null

		const rId = getXmlAttr(blip, 'r:embed')
		if (!rId) return null

		const imagePath = relationships.get(rId)
		if (!imagePath) return null

		const imageData = await this.extractImage(imagePath)
		if (!imageData) return null

		return {
			type: 'image',
			x: transformed.x,
			y: transformed.y,
			width: transformed.width,
			height: transformed.height,
			src: imageData,
			zIndex: 1
		}
	}

	private async parseSlideRelationships(slideId: string): Promise<Map<string, string>> {
		const relationships = new Map<string, string>()

		try {
			const relsPath = `ppt/slides/_rels/slide${slideId}.xml.rels`
			const relsXml = await this.zip?.file(relsPath)?.async('text')

			if (relsXml) {
				const parser = new DOMParser()
				const doc = parser.parseFromString(relsXml, 'text/xml')

				const rels = doc.querySelectorAll('Relationship')
				for (const rel of Array.from(rels)) {
					const id = getXmlAttr(rel, 'Id')
					const target = getXmlAttr(rel, 'Target')
					if (id && target) {
						const fullPath = target.startsWith('../')
							? target.substring(3)
							: `ppt/slides/${target}`
						relationships.set(id, fullPath)
					}
				}
			}
		} catch (error) {
			console.warn(`Failed to parse relationships for slide ${slideId}:`, error)
		}

		return relationships
	}

	private parseBackgroundOpacity(blipFill: Element): number {
		// 查找透明度相关的元素
		const alpha = blipFill.querySelector('a\\:alpha, alpha')
		if (alpha) {
			const val = getXmlAttr(alpha, 'val')
			if (val) {
				// OOXML 中 alpha 值是百分比，100000 = 100%，0 = 0%
				return parseInt(val) / 100000
			}
		}

		const alphaModFix = blipFill.querySelector('a\\:alphaModFix, alphaModFix')
		if (alphaModFix) {
			const amt = getXmlAttr(alphaModFix, 'amt')
			if (amt) {
				// alphaModFix 的 amt 值也是百分比
				return parseInt(amt) / 100000
			}
		}

		// 查找 shade 或 tint 效果
		const shade = blipFill.querySelector('a\\:shade, shade')
		if (shade) {
			const val = getXmlAttr(shade, 'val')
			if (val) {
				// shade 值表示阴影程度，85000 表示 85% 不透明度
				return parseInt(val) / 100000
			}
		}

		// 默认不透明度
		return 0.9
	}

	private async parseSlideBackground(
		doc: Document,
		relationships: Map<string, string>
	): Promise<PptxElement | null> {
		const cSld = doc.querySelector('p\\:cSld, cSld')
		const bg = cSld?.querySelector('p\\:bg, bg')

		if (!bg) return null

		const bgPr = bg.querySelector('p\\:bgPr, bgPr')
		if (!bgPr) return null

		const blipFill = bgPr.querySelector('a\\:blipFill, blipFill')
		if (!blipFill) return null

		const blip = blipFill.querySelector('a\\:blip, blip')
		if (!blip) return null

		const rId = getXmlAttr(blip, 'r:embed')
		if (!rId) return null

		const imagePath = relationships.get(rId)
		if (!imagePath) return null

		const imageData = await this.extractImage(imagePath)
		if (!imageData) return null

		// 解析透明度
		const opacity = this.parseBackgroundOpacity(blipFill)

		return {
			type: 'background',
			x: 0,
			y: 0,
			width: this.getTargetDisplaySize().width,
			height: this.getTargetDisplaySize().height,
			src: imageData,
			opacity: opacity,
			zIndex: -1
		}
	}

	private async parseSlideMasterBackground(slideId: string): Promise<PptxElement | null> {
		try {
			const allFiles = Object.keys(this.zip?.files || {})
			const masterFiles = allFiles.filter(
				(f) => f.includes('slideMasters/slideMaster') && f.endsWith('.xml')
			)

			for (const masterPath of masterFiles) {
				try {
					const masterXml = await this.zip?.file(masterPath)?.async('text')
					if (!masterXml) continue

					const parser = new DOMParser()
					const masterDoc = parser.parseFromString(masterXml, 'text/xml')

					const masterIdMatch = masterPath.match(/slideMaster(\d+)\.xml$/)
					if (!masterIdMatch) continue

					const masterId = masterIdMatch[1]
					const masterRelsPath = `ppt/slideMasters/_rels/slideMaster${masterId}.xml.rels`
					const masterRelationships = new Map<string, string>()

					try {
						const masterRelsXml = await this.zip?.file(masterRelsPath)?.async('text')
						if (masterRelsXml) {
							const relsDoc = parser.parseFromString(masterRelsXml, 'text/xml')
							const rels = relsDoc.querySelectorAll('Relationship')
							for (const rel of Array.from(rels)) {
								const id = getXmlAttr(rel, 'Id')
								const target = getXmlAttr(rel, 'Target')
								if (id && target) {
									const fullPath = target.startsWith('../')
										? target.substring(3)
										: `ppt/slideMasters/${target}`
									masterRelationships.set(id, fullPath)
								}
							}
						}
					} catch (error) {
						// 忽略关系文件错误
					}

					const bgPrs = masterDoc.querySelectorAll('p\\:bgPr, bgPr')
					for (const bgPr of Array.from(bgPrs)) {
						const blipFill = bgPr.querySelector('a\\:blipFill, blipFill')
						if (blipFill) {
							const blip = blipFill.querySelector('a\\:blip, blip')
							if (blip) {
								const rId = getXmlAttr(blip, 'r:embed')
								if (rId) {
									const imagePath = masterRelationships.get(rId)
									if (imagePath) {
										const imageData = await this.extractImage(imagePath)
										if (imageData) {
											// 解析透明度
											const opacity = this.parseBackgroundOpacity(blipFill)

											return {
												type: 'background',
												x: 0,
												y: 0,
												width: this.getTargetDisplaySize().width,
												height: this.getTargetDisplaySize().height,
												src: imageData,
												opacity: opacity,
												zIndex: -1
											}
										}
									}
								}
							}
						}
					}

					const pics = masterDoc.querySelectorAll('p\\:pic, pic')
					for (let i = 0; i < pics.length; i++) {
						const pic = pics[i]
						const spPr = pic.querySelector('p\\:spPr, spPr')
						const xfrm = spPr?.querySelector('a\\:xfrm, xfrm')
						const ext = xfrm?.querySelector('a\\:ext, ext')

						if (ext) {
							const width = pptxToPx(getXmlAttr(ext, 'cx', '0'))
							const height = pptxToPx(getXmlAttr(ext, 'cy', '0'))

							if (width > 600 && height > 400) {
								const blipFill = pic.querySelector('p\\:blipFill, blipFill')
								if (blipFill) {
									const blip = blipFill.querySelector('a\\:blip, blip')
									if (blip) {
										const rId = getXmlAttr(blip, 'r:embed')
										if (rId) {
											const imagePath = masterRelationships.get(rId)
											if (imagePath) {
												const imageData = await this.extractImage(
													imagePath
												)
												if (imageData) {
													return {
														type: 'background',
														x: 0,
														y: 0,
														width: this.getTargetDisplaySize()
															.width,
														height: this.getTargetDisplaySize()
															.height,
														src: imageData,
														zIndex: -1
													}
												}
											}
										}
									}
								}
							}
						}
					}
				} catch (error) {
					continue
				}
			}
		} catch (error) {
			// 忽略错误
		}

		return null
	}

	private async extractImage(imagePath: string): Promise<string | null> {
		if (this.imageCache.has(imagePath)) {
			return this.imageCache.get(imagePath) || null
		}

		try {
			const imageFile = this.zip?.file(imagePath)

			if (!imageFile) {
				// 尝试添加 ppt/ 前缀
				const altPath = `ppt/${imagePath}`
				const altImageFile = this.zip?.file(altPath)

				if (!altImageFile) {
					return null
				}

				const imageData = await altImageFile.async('base64')
				const mimeType = this.getMimeType(imagePath)
				const dataUrl = `data:${mimeType};base64,${imageData}`

				this.imageCache.set(imagePath, dataUrl)
				return dataUrl
			}

			const imageData = await imageFile.async('base64')
			const mimeType = this.getMimeType(imagePath)
			const dataUrl = `data:${mimeType};base64,${imageData}`

			this.imageCache.set(imagePath, dataUrl)
			return dataUrl
		} catch (error) {
			console.warn(`Failed to extract image ${imagePath}:`, error)
			return null
		}
	}

	private getMimeType(filename: string): string {
		const ext = filename.toLowerCase().split('.').pop()
		switch (ext) {
			case 'png':
				return 'image/png'
			case 'jpg':
			case 'jpeg':
				return 'image/jpeg'
			case 'gif':
				return 'image/gif'
			case 'bmp':
				return 'image/bmp'
			case 'svg':
				return 'image/svg+xml'
			default:
				return 'image/png'
		}
	}

	static toHtml(document: PptxDocument): string {
		const slides = document.slides.map((slide, index) => {
			return PptxParser.slideToHtml(slide, document.slideSize)
		})

		return `<div class="pptx-document">${slides.join('')}</div>`
	}

	static slideToHtml(slide: PptxSlide, slideSize?: PptxSlideSize): string {
		const backgroundHtml = slide.background ? PptxParser.elementToHtml(slide.background) : ''
		const elements = slide.content.map((element, index) => {
			return PptxParser.elementToHtml(element)
		})

		const width = slideSize?.width || 960
		const height = slideSize?.height || 720

		return `
			<div class="pptx-slide" style="position: relative; width: ${width}px; height: ${height}px; margin: 20px auto; display: block; border: 1px solid #ddd; background: white; overflow: hidden;">
				${backgroundHtml}
				${elements.join('')}
			</div>
		`
	}

	static elementToHtml(element: PptxElement): string {
		const position = `position: absolute; left: ${element.x}px; top: ${element.y}px; width: ${element.width}px; height: ${element.height}px;`
		const style = element.style
			? Object.entries(element.style)
					.map(([key, value]) => {
						if (value === undefined || value === null) return ''
						const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
						return `${cssKey}: ${value};`
					})
					.filter(Boolean)
					.join(' ')
			: ''

		function getTextAlignClass(align?: string): string {
			switch (align) {
				case 'center':
					return 'text-center'
				case 'right':
					return 'text-right'
				case 'justify':
					return 'text-justify'
				default:
					return 'text-left'
			}
		}

		switch (element.type) {
			case 'text':
				const alignClass = getTextAlignClass(element.style?.textAlign)

				// 构建文字样式
				const textStyleParts = [
					position,
					style,
					'box-sizing: border-box',
					'overflow: visible',
					'word-wrap: break-word',
					'z-index: 10',
					'line-height: 1.2'
				]

				// 使用解析出的颜色，如果没有则默认为黑色
				if (element.style?.color) {
					textStyleParts.push(`color: ${element.style.color}`)
				} else {
					textStyleParts.push('color: black')
				}

				// 使用解析出的字体大小，如果没有则默认为18px
				if (element.style?.fontSize) {
					textStyleParts.push(`font-size: ${element.style.fontSize}px`)
				} else {
					textStyleParts.push('font-size: 18px')
				}

				// 使用解析出的字体
				if (element.style?.fontFamily) {
					textStyleParts.push(`font-family: "${element.style.fontFamily}", sans-serif`)
				}

				// 文字粗细
				if (element.style?.bold) {
					textStyleParts.push('font-weight: bold')
				}

				// 文字倾斜
				if (element.style?.italic) {
					textStyleParts.push('font-style: italic')
				}

				// 文字下划线
				if (element.style?.underline) {
					textStyleParts.push('text-decoration: underline')
				}

				// 文字对齐
				const textAlign = element.style?.textAlign || 'left'
				textStyleParts.push(`text-align: ${textAlign}`)

				// 项目符号样式
				if (element.style?.hasBullet) {
					const indent = (element.style.bulletLevel || 0) * 20
					textStyleParts.push(`padding-left: ${20 + indent}px`)
					textStyleParts.push('position: relative')
				} else {
					textStyleParts.push('padding: 4px')
				}

				const textStyle = textStyleParts.join('; ')

				// 处理内容
				let displayContent = element.content?.replace(/\n/g, '<br/>') || '[EMPTY TEXT]'

				// 添加项目符号
				if (element.style?.hasBullet && element.content) {
					const bulletSymbol = '•' // 可以根据级别使用不同符号
					const bulletStyle = `position: absolute; left: ${
						4 + (element.style.bulletLevel || 0) * 20
					}px; top: 4px;`
					displayContent = `<span style="${bulletStyle}">${bulletSymbol}</span>${displayContent}`
				}

				return `<div class="pptx-text-element ${alignClass}" style="${textStyle}">${displayContent}</div>`

			case 'image':
				return `<img class="pptx-image-element" src="${element.src}" style="${position}; ${style}" alt="" />`

			case 'background':
				return `<div class="pptx-background-element" style="${position}; background-image: url('${
					element.src
				}'); background-size: cover; background-position: center; background-repeat: no-repeat; opacity: ${
					element.opacity || 0.9
				}; z-index: -1; ${style}"></div>`

			case 'shape':
				return `<div class="pptx-shape-element" style="${position}; ${style}">${
					element.content || ''
				}</div>`

			default:
				return `<div class="pptx-element" style="${position}; ${style}">${element.content || ''}</div>`
		}
	}

	dispose(): void {
		this.zip = null
		this.imageCache.clear()
		this.slideSize = undefined
	}
}
