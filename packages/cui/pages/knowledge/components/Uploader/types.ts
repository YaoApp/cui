import type { UploadProps } from 'antd/es/upload'

export interface UploaderProps extends Omit<UploadProps, 'accept'> {
	/** 显示模式 */
	mode?: 'dragger' | 'button'
	/** 自定义类名 */
	className?: string
	/** 按钮文本（仅在 button 模式下有效） */
	buttonText?: string
	/** 按钮图标（仅在 button 模式下有效） */
	buttonIcon?: React.ReactNode
	/** 是否显示支持格式提示 */
	showFormatHint?: boolean
	/** 自定义支持格式提示文本 */
	customFormatHint?: string
}

export type UploaderMode = 'dragger' | 'button'
