import { useState } from 'react'
import { getLocale } from '@umijs/max'
import { message } from 'antd'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { Input, InputPassword } from '@/components/ui/inputs'
import type { PropertySchema } from '@/components/ui/inputs/types'
import { Setting } from '@/openapi/setting/api'
import type { SandboxRegistryConfig } from '@/openapi/setting/types'
import styles from './index.less'

interface RegistryPanelProps {
	registry: SandboxRegistryConfig
	onSaved: (reg: SandboxRegistryConfig) => void
}

function getSettingAPI(): Setting | null {
	if (!window.$app?.openapi) return null
	return new Setting(window.$app.openapi)
}

const textSchema: PropertySchema = { type: 'string' }
const pwdSchema: PropertySchema = { type: 'string' }

export default function RegistryPanel({ registry, onSaved }: RegistryPanelProps) {
	const is_cn = getLocale() === 'zh-CN'
	const [collapsed, setCollapsed] = useState(true)
	const [form, setForm] = useState<SandboxRegistryConfig>({ ...registry })
	const [saving, setSaving] = useState(false)

	const handleSave = async () => {
		const api = getSettingAPI()
		if (!api) return
		setSaving(true)
		try {
			const resp = await api.SaveSandboxRegistry(form)
			if (resp.data) {
				onSaved(resp.data)
				message.success(is_cn ? '已保存' : 'Saved')
			} else if (resp.error) {
				message.error(resp.error)
			}
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
