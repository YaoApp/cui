import { Collection, Item } from './types'

// Mock 集合数据
export const mockCollections: Collection[] = [
	{
		id: 'user_management',
		icon: 'material-people',
		name: '用户管理',
		description: '用户系统相关的数据模型，包括用户信息、角色权限等'
	},
	{
		id: 'content_management',
		icon: 'material-article',
		name: '内容管理',
		description: '内容相关的数据模型，包括文章、分类、标签等'
	},
	{
		id: 'ecommerce',
		icon: 'material-shopping_cart',
		name: '电商系统',
		description: '电商相关的数据模型，包括商品、订单、库存等'
	},
	{
		id: 'analytics',
		icon: 'material-analytics',
		name: '数据分析',
		description: '分析统计相关的数据模型，包括访问记录、统计指标等'
	}
]

// Mock 数据模型数据
export const mockDataModels: Record<string, Item[]> = {
	user_management: [
		{
			id: 'user',
			name: 'User',
			icon: 'material-person',
			collection: 'user_management',
			description: '用户基础信息表，存储用户的基本信息和状态',
			relations: [
				{
					id: 'user_profile_rel',
					model: 'profile',
					foreign: 'user_id',
					key: 'id',
					type: 'hasOne'
				},
				{
					id: 'user_orders_rel',
					model: 'order',
					foreign: 'user_id',
					key: 'id',
					type: 'hasMany'
				}
			],
			fields: [
				{ type: 'ID', name: 'id', label: '用户ID' },
				{ type: 'string', name: 'username', label: '用户名' },
				{ type: 'string', name: 'email', label: '邮箱' },
				{ type: 'string', name: 'phone', label: '手机号' },
				{ type: 'datetime', name: 'created_at', label: '创建时间' },
				{ type: 'datetime', name: 'updated_at', label: '更新时间' },
				{ type: 'boolean', name: 'is_active', label: '是否激活' },
				{ type: 'enum', name: 'status', label: '状态' }
			]
		},
		{
			id: 'profile',
			name: 'Profile',
			icon: 'material-badge',
			collection: 'user_management',
			description: '用户详细信息表，存储用户的扩展信息',
			relations: [
				{
					id: 'profile_user_rel',
					model: 'user',
					foreign: 'id',
					key: 'user_id',
					type: 'hasOne'
				}
			],
			fields: [
				{ type: 'ID', name: 'id', label: '档案ID' },
				{ type: 'integer', name: 'user_id', label: '用户ID' },
				{ type: 'string', name: 'first_name', label: '名' },
				{ type: 'string', name: 'last_name', label: '姓' },
				{ type: 'text', name: 'bio', label: '个人简介' },
				{ type: 'string', name: 'avatar', label: '头像' },
				{ type: 'date', name: 'birthday', label: '生日' }
			]
		},
		{
			id: 'role',
			name: 'Role',
			icon: 'material-admin_panel_settings',
			collection: 'user_management',
			description: '角色表，定义系统中的各种角色权限',
			relations: [],
			fields: [
				{ type: 'ID', name: 'id', label: '角色ID' },
				{ type: 'string', name: 'name', label: '角色名称' },
				{ type: 'string', name: 'code', label: '角色代码' },
				{ type: 'text', name: 'description', label: '角色描述' },
				{ type: 'json', name: 'permissions', label: '权限配置' }
			]
		}
	],
	content_management: [
		{
			id: 'article',
			name: 'Article',
			icon: 'material-article',
			collection: 'content_management',
			description: '文章表，存储博客文章和新闻内容',
			relations: [
				{
					id: 'article_category_rel',
					model: 'category',
					foreign: 'id',
					key: 'category_id',
					type: 'hasOne'
				},
				{
					id: 'article_tags_rel',
					model: 'tag',
					foreign: 'article_id',
					key: 'id',
					type: 'hasMany'
				}
			],
			fields: [
				{ type: 'ID', name: 'id', label: '文章ID' },
				{ type: 'string', name: 'title', label: '标题' },
				{ type: 'string', name: 'slug', label: '链接别名' },
				{ type: 'longtext', name: 'content', label: '内容' },
				{ type: 'text', name: 'excerpt', label: '摘要' },
				{ type: 'integer', name: 'category_id', label: '分类ID' },
				{ type: 'integer', name: 'author_id', label: '作者ID' },
				{ type: 'enum', name: 'status', label: '发布状态' },
				{ type: 'datetime', name: 'published_at', label: '发布时间' }
			]
		},
		{
			id: 'category',
			name: 'Category',
			icon: 'material-folder',
			collection: 'content_management',
			description: '分类表，用于文章内容的分类管理',
			relations: [
				{
					id: 'category_articles_rel',
					model: 'article',
					foreign: 'category_id',
					key: 'id',
					type: 'hasMany'
				}
			],
			fields: [
				{ type: 'ID', name: 'id', label: '分类ID' },
				{ type: 'string', name: 'name', label: '分类名称' },
				{ type: 'string', name: 'slug', label: '链接别名' },
				{ type: 'text', name: 'description', label: '分类描述' },
				{ type: 'integer', name: 'parent_id', label: '父分类ID' },
				{ type: 'integer', name: 'sort_order', label: '排序' }
			]
		}
	],
	ecommerce: [
		{
			id: 'product',
			name: 'Product',
			icon: 'material-inventory',
			collection: 'ecommerce',
			description: '商品表，存储商品的基本信息和属性',
			relations: [
				{
					id: 'product_orders_rel',
					model: 'order_item',
					foreign: 'product_id',
					key: 'id',
					type: 'hasMany'
				}
			],
			fields: [
				{ type: 'ID', name: 'id', label: '商品ID' },
				{ type: 'string', name: 'name', label: '商品名称' },
				{ type: 'string', name: 'sku', label: '商品编码' },
				{ type: 'decimal', name: 'price', label: '价格' },
				{ type: 'integer', name: 'stock', label: '库存数量' },
				{ type: 'text', name: 'description', label: '商品描述' },
				{ type: 'json', name: 'images', label: '商品图片' },
				{ type: 'boolean', name: 'is_active', label: '是否上架' }
			]
		},
		{
			id: 'order',
			name: 'Order',
			icon: 'material-receipt',
			collection: 'ecommerce',
			description: '订单表，存储用户的购买订单信息',
			relations: [
				{
					id: 'order_user_rel',
					model: 'user',
					foreign: 'id',
					key: 'user_id',
					type: 'hasOne'
				},
				{
					id: 'order_items_rel',
					model: 'order_item',
					foreign: 'order_id',
					key: 'id',
					type: 'hasMany'
				}
			],
			fields: [
				{ type: 'ID', name: 'id', label: '订单ID' },
				{ type: 'string', name: 'order_no', label: '订单号' },
				{ type: 'integer', name: 'user_id', label: '用户ID' },
				{ type: 'decimal', name: 'total_amount', label: '订单总额' },
				{ type: 'enum', name: 'status', label: '订单状态' },
				{ type: 'datetime', name: 'created_at', label: '下单时间' },
				{ type: 'datetime', name: 'paid_at', label: '支付时间' }
			]
		}
	],
	analytics: [
		{
			id: 'page_view',
			name: 'PageView',
			icon: 'material-visibility',
			collection: 'analytics',
			description: '页面访问记录表，记录用户的页面访问行为',
			relations: [],
			fields: [
				{ type: 'ID', name: 'id', label: '记录ID' },
				{ type: 'string', name: 'url', label: '访问页面' },
				{ type: 'string', name: 'user_agent', label: '用户代理' },
				{ type: 'string', name: 'ip_address', label: 'IP地址' },
				{ type: 'integer', name: 'user_id', label: '用户ID' },
				{ type: 'datetime', name: 'visited_at', label: '访问时间' },
				{ type: 'integer', name: 'duration', label: '停留时长' }
			]
		}
	]
}

// 模拟API调用
export const mockFetchCollections = (): Promise<Collection[]> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(mockCollections)
		}, 300)
	})
}

export const mockFetchDataModels = (collectionId: string): Promise<Item[]> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(mockDataModels[collectionId] || [])
		}, 300)
	})
}
