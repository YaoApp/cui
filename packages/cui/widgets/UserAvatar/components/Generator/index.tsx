import React, { useState, useImperativeHandle, forwardRef } from 'react'
import { message } from 'antd'
import { getLocale } from '@umijs/max'
import { Button } from '@/components/ui'
import { TextArea } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import { CreateFileWrapper } from '@/utils/fileWrapper'
import type { GeneratorProps } from './types'
import styles from './index.less'
import commonStyles from '@/components/ui/inputs/common.less'

const Generator = forwardRef<any, GeneratorProps>(({ avatarAgent, onSuccess, onImageGenerate }, ref) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [generating, setGenerating] = useState(false)
	const [prompt, setPrompt] = useState('')
	const [previewUrl, setPreviewUrl] = useState<string>('')
	const [generatedFileId, setGeneratedFileId] = useState<string>('')

	// 模拟 AI 生成
	const handleGenerate = async () => {
		if (!prompt.trim()) {
			message.warning(is_cn ? '请输入描述信息' : 'Please enter a description')
			return
		}

		try {
			setGenerating(true)

			// 模拟 API 调用延迟
			await new Promise((resolve) => setTimeout(resolve, 2000))

			// TODO: 实际实现时调用 Agent API
			// const response = await agent.generate({
			//   agent_id: avatarAgent,
			//   prompt: prompt,
			// })

			// 模拟生成的图片（使用 placeholder 服务）
			const timestamp = Date.now()
			const mockFileId = `avatar_${timestamp}`
			const mockImageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
				prompt
			)}&backgroundColor=b6e3f4`

			setPreviewUrl(mockImageUrl)
			setGeneratedFileId(mockFileId)

			// Notify parent about image generation
			if (onImageGenerate) {
				onImageGenerate(true)
			}

			message.success(is_cn ? '生成成功！请确认使用' : 'Generated successfully! Please confirm to use')
		} catch (error) {
			console.error('Avatar generation failed:', error)
			const errorMsg = error instanceof Error ? error.message : is_cn ? '生成失败' : 'Generation failed'
			message.error(errorMsg)
		} finally {
			setGenerating(false)
		}
	}

	// 确认使用生成的头像
	const handleConfirm = async () => {
		if (!previewUrl || !generatedFileId) {
			message.warning(is_cn ? '请先生成头像' : 'Please generate an avatar first')
			throw new Error('No avatar generated')
		}

		// TODO: 实际实现时，应该将生成的图片上传到服务器，获取 fileID
		// 然后创建 wrapper 格式: CreateFileWrapper(avatarAgent || '__yao.attachment', fileID)

		// 现在使用模拟数据，如果是外部 URL 就直接使用
		// 如果是服务器生成的，应该返回 wrapper 格式
		const fileWrapper = previewUrl.startsWith('http')
			? previewUrl
			: CreateFileWrapper(avatarAgent || '__yao.attachment', generatedFileId)

		// 调用成功回调（传递 wrapper 格式和 fileId）
		onSuccess(fileWrapper, generatedFileId)
	}

	// 暴露 handleConfirm 方法给父组件
	useImperativeHandle(ref, () => ({
		handleConfirm
	}))

	return (
		<div className={styles.generator}>
			<div className={styles.generatorContent}>
				{previewUrl ? (
					<div className={styles.preview}>
						<img src={previewUrl} alt='Generated' />
						<div className={styles.previewActions}>
							<Icon name='material-auto_awesome' size={16} />
							<span>{is_cn ? '点击生成按钮重新生成' : 'Click Generate to regenerate'}</span>
						</div>
					</div>
				) : (
					<div className={styles.generationPlaceholder}>
						<Icon name='material-auto_awesome' size={40} />
						<p className={styles.placeholderText}>
							{is_cn ? '使用 AI 生成个性化头像' : 'Generate personalized avatar with AI'}
						</p>
						<p className={styles.placeholderHint}>
							{is_cn
								? '在下方描述您想要的头像风格'
								: 'Describe your desired avatar style below'}
						</p>
					</div>
				)}
			</div>

			<div className={styles.generatorForm}>
				<div className={styles.formItem}>
					<label className={styles.formLabel}>
						<span className={styles.required}>*</span>
						{is_cn ? '描述' : 'Description'}
					</label>
					<TextArea
						value={prompt}
						onChange={(value) => setPrompt(String(value))}
						schema={{
							type: 'string',
							placeholder: is_cn
								? '例如：一个可爱的卡通猫咪头像，蓝色背景，圆形构图...'
								: 'e.g., A cute cartoon cat avatar with blue background, circular composition...',
							maxLength: 500
						}}
						error=''
						hasError={false}
						rows={4}
						showCount={true}
					/>
				</div>

				<div className={styles.generateButtonWrapper}>
					<Button
						type='primary'
						size='small'
						onClick={handleGenerate}
						loading={generating}
						disabled={!prompt.trim()}
						icon={<Icon name='material-auto_awesome' size={14} />}
					>
						{generating
							? is_cn
								? '生成中...'
								: 'Generating...'
							: previewUrl
							? is_cn
								? '重新生成'
								: 'Regenerate'
							: is_cn
							? '生成头像'
							: 'Generate Avatar'}
					</Button>
				</div>
			</div>
		</div>
	)
})

Generator.displayName = 'Generator'

export default Generator
