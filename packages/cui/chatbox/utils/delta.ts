import type { Message } from '../../openapi'

// Message cache for merging deltas
// msgId -> Message Props
const messageCache = new Map<string, any>()

/**
 * Apply delta updates to a message state
 */
export function applyDelta(msgId: string, chunk: Message, cache = messageCache): any {
	// Get or initialize message state
	let current = cache.get(msgId)
	if (!current) {
		current = { type: chunk.type, props: { ...chunk.props } } // Copy initial props
		cache.set(msgId, current)
	}

	if (!chunk.delta) {
		// Not a delta, use as-is (or merge logic depending on API behavior)
		// Usually non-delta chunks replace the props or are standalone
		// Here we treat it as update
		current.props = { ...chunk.props }
		current.type = chunk.type
		return current
	}

	// Get target path (default to entire props)
	const path = chunk.delta_path || ''
	const action = chunk.delta_action || 'append'

	// Apply delta based on action
	switch (action) {
		case 'append':
			// Append to string or array
			if (path) {
				const target = getValueByPath(current.props, path)
				const chunkValue = getValueByPath(chunk.props, path)
				if (typeof target === 'string') {
					setValueByPath(current.props, path, target + chunkValue)
				} else if (Array.isArray(target)) {
					setValueByPath(current.props, path, [
						...target,
						...(Array.isArray(chunkValue) ? chunkValue : [chunkValue])
					])
				} else {
					// If target doesn't exist, set it
					setValueByPath(current.props, path, chunkValue)
				}
			} else {
				// Append to root level fields (e.g., content)
				const props = chunk.props
				if (props) {
					Object.keys(props).forEach((key) => {
						if (typeof current.props[key] === 'string') {
							current.props[key] = (current.props[key] || '') + props[key]
						} else if (Array.isArray(current.props[key])) {
							current.props[key].push(
								...(Array.isArray(props[key]) ? props[key] : [props[key]])
							)
						} else {
							current.props[key] = props[key]
						}
					})
				}
			}
			break

		case 'replace':
			// Replace entire value at path
			if (path) {
				setValueByPath(current.props, path, getValueByPath(chunk.props, path))
			} else {
				current.props = { ...chunk.props }
			}
			break

		case 'merge':
			// Deep merge objects
			if (path) {
				const target = getValueByPath(current.props, path)
				const source = getValueByPath(chunk.props, path)
				setValueByPath(current.props, path, deepMerge(target, source))
			} else {
				current.props = deepMerge(current.props, chunk.props)
			}
			break

		case 'set':
			// Set new field
			if (path) {
				setValueByPath(current.props, path, getValueByPath(chunk.props, path))
			} else {
				Object.assign(current.props, chunk.props)
			}
			break
	}

	// Update type if changed (and not just delta)
	if (chunk.type && chunk.type !== current.type && !chunk.type_change) {
		// Sometimes type might be provided in delta, update it if it's valid
		current.type = chunk.type
	}

	return current
}

export function clearMessageCache(msgId?: string, cache = messageCache) {
	if (msgId) {
		cache.delete(msgId)
	} else {
		cache.clear()
	}
}

// Helper functions
function getValueByPath(obj: any, path: string): any {
	if (!path) return obj
	return path.split('.').reduce((acc, part) => {
		const match = part.match(/^(\w+)(\[(\d+)\])?$/)
		if (match) {
			const [, key, , index] = match
			return index !== undefined ? acc?.[key]?.[parseInt(index)] : acc?.[key]
		}
		return acc?.[part]
	}, obj)
}

function setValueByPath(obj: any, path: string, value: any): void {
	if (!path) return
	const parts = path.split('.')
	const last = parts.pop()!
	const target = parts.reduce((acc, part) => {
		const match = part.match(/^(\w+)(\[(\d+)\])?$/)
		if (match) {
			const [, key, , index] = match
			if (index !== undefined) {
				acc[key] = acc[key] || []
				return acc[key][parseInt(index)]
			}
			acc[key] = acc[key] || {}
			return acc[key]
		}
		acc[part] = acc[part] || {}
		return acc[part]
	}, obj)

	const match = last.match(/^(\w+)(\[(\d+)\])?$/)
	if (match) {
		const [, key, , index] = match
		if (index !== undefined) {
			target[key] = target[key] || []
			target[key][parseInt(index)] = value
		} else {
			target[key] = value
		}
	} else {
		target[last] = value
	}
}

function deepMerge(target: any, source: any): any {
	if (!source) return target
	if (!target) return source
	if (typeof target !== 'object' || typeof source !== 'object') return source

	const result = Array.isArray(target) ? [...target] : { ...target }
	for (const key in source) {
		if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
			result[key] = deepMerge(result[key], source[key])
		} else {
			result[key] = source[key]
		}
	}
	return result
}
