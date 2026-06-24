import React from 'react'
import { getLocale } from '@umijs/max'
import styles from './Placeholder.less'

interface AssistantInfo {
	name: string
	id: string
	avatar?: string
	description?: string
	placeholder?: { title?: string; description?: string; prompts?: string[] }
}

export interface PlaceholderProps {
	assistant?: AssistantInfo | null
	onQuickPrompt?: (text: string) => void
}

const Placeholder: React.FC<PlaceholderProps> = ({ assistant, onQuickPrompt }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const prompts = assistant?.placeholder?.prompts

	return (
		<div className={styles.placeholder}>
			<div className={styles.inner}>
				<div className={styles.intro}>
					{assistant?.avatar ? (
						<img className={styles.avatar} src={assistant.avatar} alt={assistant.name} />
					) : (
						<div className={styles.avatarFallback}>
							{assistant?.name?.charAt(0) || 'AI'}
						</div>
					)}
					<h3 className={styles.name}>
						{assistant?.name || (is_cn ? '智能助手' : 'AI Assistant')}
					</h3>
					<p className={styles.description}>
						{assistant?.description || (is_cn ? '今天有什么可以帮您？' : 'How can I help you today?')}
					</p>
				</div>

				{onQuickPrompt && prompts && prompts.length > 0 && (
					<div className={styles.prompts}>
						<span className={styles.promptsLabel}>
							{is_cn ? '可以这样问：' : 'You can ask:'}
						</span>
						{prompts.map((prompt, i) => (
							<button
								key={i}
								className={styles.promptItem}
								onClick={() => onQuickPrompt(prompt)}
							>
								{prompt}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

export default Placeholder
