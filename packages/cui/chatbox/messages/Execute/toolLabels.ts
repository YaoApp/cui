const TOOL_LABELS: Record<string, { cn: string; en: string }> = {
	// Shell / 命令执行
	bash: { cn: '执行命令', en: 'Execute' },
	pwsh: { cn: '执行命令', en: 'Execute' },
	execute: { cn: '执行命令', en: 'Execute' },
	shell: { cn: '执行命令', en: 'Execute' },
	cmd: { cn: '执行命令', en: 'Execute' },

	// 文件操作
	read: { cn: '读取文件', en: 'Read File' },
	write: { cn: '写入文件', en: 'Write File' },
	create: { cn: '写入文件', en: 'Write File' },
	edit: { cn: '编辑文件', en: 'Edit File' },
	str_replace_editor: { cn: '编辑文件', en: 'Edit File' },

	// 文件搜索
	glob: { cn: '搜索文件', en: 'Search Files' },
	grep: { cn: '搜索内容', en: 'Search Content' },
	list_dir: { cn: '列出目录', en: 'List Directory' },

	// 技能 / 网络
	skill: { cn: '调用技能', en: 'Run Skill' },
	search: { cn: '网页搜索', en: 'Web Search' },
	fetch: { cn: '获取网页', en: 'Fetch Page' }
}

export function resolveToolLabel(rawName: string, isCN: boolean): string {
	const entry = TOOL_LABELS[rawName] || TOOL_LABELS[rawName.toLowerCase()]
	if (entry) return isCN ? entry.cn : entry.en
	return rawName || '...'
}
