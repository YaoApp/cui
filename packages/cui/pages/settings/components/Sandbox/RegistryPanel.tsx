import { useState } from 'react'
import { getLocale } from '@umijs/max'
import { message } from 'antd'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { Input, InputPassword } from '@/components/ui/inputs'
import type { PropertySchema } from '@/components/ui/inputs/types'
import type { RegistryConfig } from '../../types'
import { mockApi } from '../../mockApi'
import styles from './index.less'

interface RegistryPanelProps {
	registry: RegistryConfig
	onSaved: (reg: RegistryConfig) => void
}

const textSchema: PropertySchema = { type: 'string' }
const pwdSchema: PropertySchema = { type: 'string' }

export default function RegistryPanel({ registry, onSaved }: RegistryPanelProps) {
	const is_cn = getLocale() === 'zh-CN'
	const [collapsed, setCollapsed] = useState(true)
	const [form, setForm] = useState<RegistryConfig>({ ...registry })
	const [saving, setSaving] = useState(false)

	const handleSave = async () => {
		setSaving(true)
		try {
			const result = await mockApi.saveRegistryConfig(form)
			onSaved(result)
			message.success(is_cn ? '已保存' : 'Saved')
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className={styles.registryPanel}>
			<div className={styles.registryHeader} onClick={() => setCollapsed(!collapsed)}>
				<div className={styles.registryTitle}>
					<Icon name='material-settings' size={14} />
					<span>{is_cn ? '高级设置' : 'Advanced'}</span>
					<span className={styles.registrySubtitle}>
						{is_cn ? '私有仓库配置' : 'Private Registry'}
					</span>
				</div>
				<span className={`${styles.collapseIcon} ${collapsed ? '' : styles.collapseIconOpen}`}>
					<Icon name='material-expand_more' size={18} />
				</span>
			</div>
			{!collapsed && (
				<div className={styles.registryBody}>
					<div className={styles.registryField}>
						<label>{is_cn ? '仓库地址' : 'Registry URL'}</label>
						<Input
							schema={textSchema}
							value={form.registry_url}
							onChange={(v) => setForm((prev) => ({ ...prev, registry_url: String(v || '') }))}
						/>
					</div>
					<div className={styles.registryField}>
						<label>
							{is_cn ? '用户名' : 'Username'}
							<span className={styles.optionalTag}>{is_cn ? '可选' : 'Optional'}</span>
						</label>
						<Input
							schema={textSchema}
							value={form.username}
							onChange={(v) => setForm((prev) => ({ ...prev, username: String(v || '') }))}
						/>
					</div>
					<div className={styles.registryField}>
						<label>
							{is_cn ? '密码' : 'Password'}
							<span className={styles.optionalTag}>{is_cn ? '可选' : 'Optional'}</span>
						</label>
						<InputPassword
							schema={pwdSchema}
							value={form.password}
							onChange={(v) => setForm((prev) => ({ ...prev, password: String(v || '') }))}
						/>
					</div>
					<div className={styles.registryActions}>
						<Button type='primary' size='small' loading={saving} onClick={handleSave}>
							{is_cn ? '保存' : 'Save'}
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}
