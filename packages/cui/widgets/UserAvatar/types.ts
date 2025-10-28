/**
 * 头像尺寸类型
 * - sm: 32px
 * - md: 40px (默认)
 * - lg: 56px
 * - xl: 80px
 * - number: 自定义像素值
 */
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | number

/**
 * 头像形状类型
 * - circle: 圆形 (50% 圆角)
 * - square: 方形 (可自定义圆角)
 */
export type AvatarShape = 'circle' | 'square'

/**
 * 头像显示模式
 * - default: 仅显示头像 (默认)
 * - form: 头像 + 按钮 (用于表单编辑场景)
 */
export type AvatarMode = 'default' | 'form'

/**
 * 头像显示类型
 * - auto: 自动判断（有 team 数据则显示组合，否则只显示头像）【默认】
 * - avatar: 强制只显示头像（即使有 team 数据）
 * - combined: 强制显示组合（需要提供 team 数据）
 */
export type AvatarDisplayType = 'auto' | 'avatar' | 'combined'

/**
 * 团队信息
 */
export interface TeamInfo {
	/** 团队 ID */
	team_id: string
	/** 团队 logo URL (支持 wrapper 格式) */
	logo?: string
	/** 团队名称 */
	name?: string
}

/**
 * 头像数据结构
 *
 * 使用场景：
 * 1. 用户头像：提供 id, avatar, name
 * 2. 团队 logo：提供 id, avatar, name
 * 3. 团队+用户组合：提供 id, avatar, name, team (需配合 displayType='combined')
 */
export interface AvatarData {
	/** 用户/团队 ID */
	id: string
	/** 头像 URL (支持 wrapper 格式如 __yao.attachment://xxx) */
	avatar?: string
	/** 显示名称 */
	name?: string
	/** 邮箱 (可选，用于详情卡片显示) */
	email?: string
	/** 简介 (可选，用于详情卡片显示) */
	bio?: string
	/** 角色 ID (可选，用于详情卡片显示，如 'owner', 'admin', 'member') */
	role_id?: string
	/** 角色显示名称 (可选，用于详情卡片显示，如 '所有者', 'Owner') */
	role_name?: string
	/** 是否为 Owner (可选，用于显示 Owner 标识) */
	is_owner?: boolean
	/** 成员类型 (可选，用于区分用户和机器人，如 'user', 'robot') */
	member_type?: 'user' | 'robot'
	/** 状态 (可选，用于详情卡片显示，如 'active', 'pending', 'suspended') */
	status?: string
	/** 加入时间 (可选，用于详情卡片显示) */
	joined_at?: string
	/** 团队信息 (当 displayType='combined' 时需要) */
	team?: TeamInfo
}

/**
 * UserAvatar 组件属性
 *
 * ## 使用场景示例
 *
 * ### 1. 自动判断模式（推荐，默认）
 * ```tsx
 * // 自动根据用户数据判断：有 team 显示组合，无 team 显示单头像
 * <UserAvatar />  // 使用当前登录用户，自动判断
 * <UserAvatar data={userData} />  // 使用指定数据，自动判断
 * ```
 *
 * ### 2. 基础用户头像
 * ```tsx
 * <UserAvatar
 *   data={{ id: '123', avatar: 'url', name: 'John' }}
 * />
 * ```
 *
 * ### 3. 团队 logo (方形)
 * ```tsx
 * <UserAvatar
 *   size='xl'
 *   shape='square'
 *   borderRadius={12}
 *   displayType='avatar'  // 强制只显示头像
 *   data={{ id: 'team-123', avatar: 'url', name: 'Team Name' }}
 * />
 * ```
 *
 * ### 4. 团队+用户组合头像（自动）
 * ```tsx
 * <UserAvatar
 *   data={{
 *     id: 'user-123',
 *     avatar: 'user-avatar',
 *     name: 'John',
 *     team: { team_id: 'team-123', logo: 'team-logo', name: 'Team Name' }
 *   }}
 *   // displayType='auto' 是默认值，会自动显示组合
 * />
 * ```
 *
 * ### 4. 可编辑头像 (表单模式)
 * ```tsx
 * <UserAvatar
 *   mode='form'
 *   size='xl'
 *   uploader='__yao.attachment'
 *   avatarAgent='avatar-generator'
 *   onUploadSuccess={(fileId, fileUrl) => console.log(fileId, fileUrl)}
 *   data={{ id: '123', avatar: 'url', name: 'John' }}
 * />
 * ```
 *
 * ### 5. 带详情卡片的头像
 * ```tsx
 * <UserAvatar
 *   showCard={true}
 *   data={{
 *     id: '123',
 *     avatar: 'url',
 *     name: 'John',
 *     email: 'john@example.com',
 *     role_name: 'Admin',
 *     is_owner: true
 *   }}
 * />
 * ```
 */
export interface UserAvatarProps {
	// ========== 样式相关 ==========

	/**
	 * 头像尺寸
	 * @default 'md'
	 */
	size?: AvatarSize

	/**
	 * 头像形状
	 * - circle: 圆形 (50% 圆角)
	 * - square: 方形 (可自定义圆角)
	 * @default 'circle'
	 */
	shape?: AvatarShape

	/**
	 * 边框圆角 (仅当 shape='square' 时有效)
	 * - 不设置：根据尺寸自动计算 (约 15% 的尺寸，最大 12px)
	 * - 设置数值：自定义圆角像素值 (如 12, 8, 6)
	 * - shape='circle' 时此参数无效，始终为 50%
	 */
	borderRadius?: number

	/** 自定义 class 名称 */
	className?: string

	/** 自定义内联样式 */
	style?: React.CSSProperties

	// ========== 显示相关 ==========

	/**
	 * 显示类型
	 * - 'auto': 自动判断 (有 team 数据显示组合，否则只显示头像)【推荐】
	 * - 'avatar': 强制只显示头像 (即使有 team 数据)
	 * - 'combined': 强制显示组合 (需要提供 data.team)
	 * @default 'auto'
	 */
	displayType?: AvatarDisplayType

	/**
	 * 显示模式
	 * - 'default': 仅显示头像
	 * - 'form': 头像 + 更换按钮 (用于表单编辑场景)
	 * @default 'default'
	 */
	mode?: AvatarMode

	/**
	 * 是否在 hover 时显示详情卡片
	 * 卡片会显示 name, email, role, bio 等信息
	 * @default false
	 */
	showCard?: boolean

	// ========== 数据相关 ==========

	/**
	 * 头像数据
	 * 不提供时会自动使用当前登录用户信息
	 */
	data?: AvatarData

	// ========== 交互相关 ==========

	/**
	 * 点击事件
	 * 注意：当提供了 uploader 和 onUploadSuccess 时，点击会打开上传模态窗，此事件不会触发
	 */
	onClick?: () => void

	// ========== 编辑相关 ==========

	/**
	 * Uploader ID
	 * 提供后支持上传头像功能 (需配合 onUploadSuccess)
	 * @example '__yao.attachment'
	 */
	uploader?: string

	/**
	 * Avatar Agent ID
	 * 提供后支持 AI 生成头像功能
	 * @example 'avatar-generator'
	 */
	avatarAgent?: string

	/**
	 * 上传成功回调
	 * 提供后头像可点击上传/生成，必须配合 uploader 使用
	 * @param fileId - 文件 ID
	 * @param fileUrl - 文件完整 URL (wrapper 格式，如 __yao.attachment://file123)
	 */
	onUploadSuccess?: (fileId: string, fileUrl: string) => void

	/**
	 * 表单模式下的按钮文字
	 * @default '更换头像' / 'Change Avatar'
	 */
	buttonText?: string

	/**
	 * 上传/生成模态窗标题
	 * @default '设置头像' / 'Set Avatar'
	 */
	modalTitle?: string
}
