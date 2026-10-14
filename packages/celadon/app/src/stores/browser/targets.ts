/** 一页里装什么：两个特殊页（首页、新标签页）、外部网址、内部路由、快捷方式（内部路由带参数）。 */
export type TabTarget =
	| { kind: 'home' }
	| { kind: 'blank' }
	| { kind: 'external'; url: string }
	| { kind: 'internal'; path: string }
	| { kind: 'shortcut'; name: string; path: string; param?: string }

/** 快捷方式：名字映射到内部路由，允许带一个参数（`workspace:yao` 落到 `/workspace/yao`）。 */
export const SHORTCUTS: Record<string, string> = {
	home: '/',
	new: '/new',
	apps: '/apps',
	inbox: '/inbox',
	board: '/board',
	workspace: '/workspace',
	computer: '/computer',
	help: '/help'
}

/** 两个目标是不是同一页：同一页已在标签条上时复用它，不并列开第二个。 */
export function sameTarget(a: TabTarget, b: TabTarget): boolean {
	if (a.kind !== b.kind) return false
	if (a.kind === 'external' && b.kind === 'external') return a.url === b.url
	if (a.kind === 'internal' && b.kind === 'internal') return a.path === b.path
	if (a.kind === 'shortcut' && b.kind === 'shortcut') return a.name === b.name && a.param === b.param
	return true
}

/** 把输入解析成一页：空串是新标签页，`/` 开头是内部路由，已知名字是快捷方式，其余按外部网址。 */
export function parseTarget(input: string): TabTarget {
	const value = input.trim()
	if (!value) return { kind: 'blank' }
	if (value.startsWith('/')) return { kind: 'internal', path: value }
	const [head, ...rest] = value.split(':')
	const name = head.trim().toLowerCase()
	const path = SHORTCUTS[name]
	if (path !== undefined) {
		const param = rest.join(':').trim()
		const full = param ? `${path === '/' ? '' : path}/${param}` : path
		return { kind: 'shortcut', name, path: full, param: param || undefined }
	}
	return { kind: 'external', url: value }
}

/** 标签上的名字与图形按目标推：外部网址用地址，内部路由与快捷方式用路径，两个特殊页由调用方给。 */
export function targetLabel(target: TabTarget): string {
	switch (target.kind) {
		case 'external':
			return target.url
		case 'internal':
			return target.path
		case 'shortcut':
			return target.path
		default:
			return ''
	}
}
