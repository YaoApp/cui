import { Tabs } from 'antd'
import { getLocale } from '@umijs/max'
import type { FormInstance } from 'antd'
import General from '../General'
import Prompts from '../Prompts'
import styles from './index.less'

interface Message {
	role: 'system' | 'user' | 'assistant' | 'developer'
	content: string
}

interface EditProps {
	form: FormInstance
	prompts: Message[]
	options: { key: string; value: string }[]
	onPromptsChange: (prompts: Message[]) => void
	onOptionsChange: (options: { key: string; value: string }[]) => void
}

const Edit = ({ form, prompts, options, onPromptsChange, onOptionsChange }: EditProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const items = [
		{
			key: 'general',
			label: is_cn ? '基本信息' : 'General',
			children: <General form={form} />
		},
		{
			key: 'prompts',
			label: is_cn ? '提示词' : 'Prompts',
			children: (
				<Prompts value={prompts} options={options} onChange={onPromptsChange} onOptionsChange={onOptionsChange} />
			)
		}
	]

	return (
		<div className={styles.editContainer}>
			<Tabs items={items} defaultActiveKey='general' className={styles.editTabs} size='large' type='card' />
		</div>
	)
}

export default Edit

