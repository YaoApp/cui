import { visit } from 'unist-util-visit'

/**
 * Escape curly braces in text segments (outside fenced code blocks, inline code, and math).
 * MDX treats { } as JSX expressions; unescaped braces around arbitrary words
 * (e.g. {timestamp}) cause ReferenceError at runtime.
 */
export const escapeCurlyBraces = (text: string): string => {
	const segments: string[] = []
	let i = 0
	const len = text.length

	while (i < len) {
		// Fenced code block ``` ... ```
		if (text[i] === '`' && text[i + 1] === '`' && text[i + 2] === '`') {
			const end = text.indexOf('```', i + 3)
			if (end !== -1) {
				segments.push(text.slice(i, end + 3))
				i = end + 3
			} else {
				segments.push(text.slice(i))
				i = len
			}
			continue
		}

		// Inline code ` ... `
		if (text[i] === '`') {
			const end = text.indexOf('`', i + 1)
			if (end !== -1) {
				segments.push(text.slice(i, end + 1))
				i = end + 1
			} else {
				segments.push(text.slice(i))
				i = len
			}
			continue
		}

		// Block math $$ ... $$
		if (text[i] === '$' && text[i + 1] === '$') {
			const end = text.indexOf('$$', i + 2)
			if (end !== -1) {
				segments.push(text.slice(i, end + 2))
				i = end + 2
			} else {
				segments.push(text.slice(i))
				i = len
			}
			continue
		}

		// Inline math $ ... $ (single $, not preceded by \)
		if (text[i] === '$' && (i === 0 || text[i - 1] !== '\\')) {
			const end = text.indexOf('$', i + 1)
			if (end !== -1 && end > i + 1) {
				segments.push(text.slice(i, end + 1))
				i = end + 1
				continue
			}
		}

		// Regular character – escape { and }
		if (text[i] === '{') {
			segments.push('\\{')
		} else if (text[i] === '}') {
			segments.push('\\}')
		} else {
			segments.push(text[i])
		}
		i++
	}

	return segments.join('')
}

/**
 * Reverse the escaping done by escapeCurlyBraces: \{ → { and \} → }
 */
export const unescapeCurlyBraces = (text?: string): string | undefined => {
	return text?.replace(/\\{/g, '{').replace(/\\}/g, '}')
}

/**
 * Rehype plugin that restores escaped curly braces in text nodes.
 * Must be used together with escapeCurlyBraces() pre-processing.
 * Skips text inside <code> and <pre> elements (those are handled separately).
 */
export const rehypeUnescapeBraces = () => (tree: any) => {
	visit(tree, (node: any, _index: any, parent: any) => {
		if (node?.type === 'text') {
			if (parent?.type === 'element' && ['code', 'pre'].includes(parent.tagName)) {
				return
			}
			node.value = unescapeCurlyBraces(node.value)
		}
	})
}

/**
 * Rehype plugin that restores escaped curly braces in code block raw values.
 * Must run before syntax highlighting so raw content is correct.
 */
export const rehypeUnescapeCodeBlocks = () => (tree: any) => {
	visit(tree, (node: any) => {
		if (node?.type === 'element' && node?.tagName === 'pre') {
			const [codeEl] = node.children || []
			if (codeEl?.tagName === 'code' && codeEl.children?.[0]?.type === 'text') {
				const rawValue = codeEl.children[0].value
				node.raw = unescapeCurlyBraces(rawValue)
			}
		}
	})
}
