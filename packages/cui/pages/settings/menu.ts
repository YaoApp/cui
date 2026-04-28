import type { MenuGroup } from './types'

export const settingMenuGroups: MenuGroup[] = [
	{
		key: 'profile',
		name: { 'zh-CN': '账户设置', 'en-US': 'Account' },
		order: 1,
		items: [
			{
				id: '1',
				key: 'profile',
				name: { 'zh-CN': '个人资料', 'en-US': 'Profile' },
				icon: 'material-person',
				path: '/settings/profile'
			},
			{
				id: '2a',
				key: 'team',
				name: { 'zh-CN': '团队管理', 'en-US': 'Team' },
				icon: 'material-group',
				path: '/settings/team'
			}
		]
	},
	{
		key: 'system',
		name: { 'zh-CN': '系统配置', 'en-US': 'System' },
		order: 2,
		items: [
			{
				id: 'sys-1',
				key: 'system',
				name: { 'zh-CN': '系统信息', 'en-US': 'System Info' },
				icon: 'material-info',
				path: '/settings/system'
			},
			{
				id: 'sys-2',
				key: 'cloud',
				name: { 'zh-CN': '云服务', 'en-US': 'Cloud Service' },
				icon: 'material-cloud',
				path: '/settings/cloud'
			},
			{
				id: 'sys-3',
				key: 'models',
				name: { 'zh-CN': '模型配置', 'en-US': 'Models' },
				icon: 'material-psychology',
				path: '/settings/models'
			},
			{
				id: 'sys-4',
				key: 'search',
				name: { 'zh-CN': '搜索与抓取', 'en-US': 'Search & Scrape' },
				icon: 'material-travel_explore',
				path: '/settings/search'
			},
			{
			id: 'sys-5',
			key: 'sandbox',
			name: { 'zh-CN': '沙箱配置', 'en-US': 'Sandbox' },
			icon: 'material-desktop_mac',
				path: '/settings/sandbox'
			},
			{
				id: 'sys-6',
				key: 'smtp',
				name: { 'zh-CN': '邮箱配置', 'en-US': 'Email' },
				icon: 'material-mail',
				path: '/settings/smtp'
			},
			{
				id: 'sys-7',
				key: 'mcp',
				name: { 'zh-CN': 'MCP 服务', 'en-US': 'MCP Services' },
				icon: 'material-hub',
				path: '/settings/mcp'
			}
		]
	},
	{
		key: 'support',
		name: { 'zh-CN': '帮助支持', 'en-US': 'Support' },
		order: 6,
		items: [
			{
				id: '15',
				key: 'docs',
				name: { 'zh-CN': '文档', 'en-US': 'Documentation' },
				icon: 'material-description',
				path: {
					'zh-CN': 'https://yaoagents.com/docs/zh-cn/getting-started/what-is-yao-agents',
					'en-US': 'https://yaoagents.com/docs/en-us/getting-started/what-is-yao-agents'
				}
			},
			{
				id: '16',
				key: 'discord',
				name: { 'zh-CN': '加入 Discord', 'en-US': 'Join Discord' },
				icon: 'material-forum',
				path: 'https://discord.gg/BkMR2NUsjU'
			},
			{
				id: '17',
				key: 'twitter',
				name: { 'zh-CN': '关注 X', 'en-US': 'Follow on X' },
				icon: 'material-tag',
				path: 'https://x.com/YaoApp'
			},
			{
				id: '18',
				key: 'feedback',
				name: { 'zh-CN': '意见反馈', 'en-US': 'Feedback' },
				icon: 'material-feedback',
				path: '/settings/feedback'
			}
		]
	}
]

export function getMenuGroups(): Promise<MenuGroup[]> {
	return Promise.resolve(settingMenuGroups)
}
