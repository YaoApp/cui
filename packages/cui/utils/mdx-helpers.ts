import { visit } from 'unist-util-visit'

/**
 * Single-pass escape for MDX safety. Handles two problems simultaneously:
 * 1. Currency $5/$25 being misinterpreted as inline math by remark-math
 * 2. Bare {YYYY} being treated as JSX expressions causing ReferenceError
 *
 * Protected regions (math, code blocks, inline code) are left unchanged.
 */
export const escapeCurlyBraces = (text: string): string => {
	const segments: string[] = []
	let i = 0
	const len = text.length

	while (i < len) {
		// --- Protected regions: pass through unchanged ---

		// Fenced code block ```...```
		if (text[i] === '`' && text[i + 1] === '`' && text[i + 2] === '`') {
			const end = text.indexOf('```', i + 3)
			if (end !== -1) {
				segments.push(text.slice(i, end + 3))
				i = end + 3
			} else {
				// Unclosed during streaming: just emit ``` and keep escaping the rest
				segments.push('```')
				i += 3
			}
			continue
		}

		// Inline code `...`
		if (text[i] === '`') {
			const end = text.indexOf('`', i + 1)
			if (end !== -1) {
				segments.push(text.slice(i, end + 1))
				i = end + 1
			} else {
				// Unclosed during streaming: just emit ` and keep escaping the rest
				segments.push('`')
				i++
			}
			continue
		}

		// Block math $$...$$
		if (text[i] === '$' && text[i + 1] === '$') {
			const end = text.indexOf('$$', i + 2)
			if (end !== -1) {
				segments.push(text.slice(i, end + 2))
				i = end + 2
			} else {
				// Unclosed during streaming: just emit $$ and keep escaping the rest
				segments.push('$$')
				i += 2
			}
			continue
		}

		// Dollar sign handling (not preceded by \)
		if (text[i] === '$' && (i === 0 || text[i - 1] !== '\\')) {
			// $ followed by digit → currency, escape to prevent remark-math match
			if (i + 1 < len && text[i + 1] >= '0' && text[i + 1] <= '9') {
				segments.push('\\$')
				i++
				continue
			}
			// Try to find matching closing $ for inline math
			let j = i + 1
			let found = -1
			while (j < len) {
				if (text[j] === '$' && text[j - 1] !== '\\' && (j + 1 >= len || text[j + 1] !== '$')) {
					found = j
					break
				}
				if (text[j] === '\n' && j + 1 < len && text[j + 1] === '\n') break
				j++
			}
			if (found > i + 1) {
				segments.push(text.slice(i, found + 1))
				i = found + 1
				continue
			}
			// Lone $ with no match — pass through as-is
			segments.push(text[i])
			i++
			continue
		}

		// --- Normal text region ---

		// Already-escaped sequences \{ \} → pass through (don't double-escape)
		if (text[i] === '\\' && i + 1 < len && (text[i + 1] === '{' || text[i + 1] === '}')) {
			segments.push(text[i], text[i + 1])
			i += 2
			continue
		}

		// Escape unescaped { and }
		if (text[i] === '{') {
			segments.push('\\{')
			i++
			continue
		}
		if (text[i] === '}') {
			segments.push('\\}')
			i++
			continue
		}

		segments.push(text[i])
		i++
	}

	return segments.join('')
}

/**
 * Reverse escaping: \{ → {, \} → }, \$ → $
 */
export const unescapeCurlyBraces = (text?: string): string | undefined => {
	return text?.replace(/\\{/g, '{').replace(/\\}/g, '}').replace(/\\\$/g, '$')
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
