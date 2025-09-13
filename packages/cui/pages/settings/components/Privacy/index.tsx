import React, { useState, useEffect, useRef } from 'react'
import { getLocale } from '@umijs/max'
import { message } from 'antd'
import { mockApi, PrivacyData } from '../../mockData'
import { ProviderSchema } from '@/components/ui/Provider/types'
import { Button, Setting } from '@/components/ui'
import { SettingRef } from '@/components/ui/Setting/types'
import Icon from '@/widgets/Icon'
import styles from './index.less'

const Privacy = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [schema, setSchema] = useState<ProviderSchema | null>(null)
	const [data, setData] = useState<PrivacyData | null>(null)

	// Setting component ref
	const settingRef = useRef<SettingRef>(null)

	// Load schema and data
	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true)
				const [schemaData, privacyData] = await Promise.all([
					mockApi.getPrivacySchema(locale),
					mockApi.getPrivacyData()
				])
				setSchema(schemaData)
				setData(privacyData)
			} catch (error) {
				console.error('Failed to load privacy settings:', error)
				message.error(is_cn ? '加载隐私设置失败' : 'Failed to load privacy settings')
			} finally {
				setLoading(false)
			}
		}

		loadData()
	}, [is_cn])

	// Handle setting changes
	const handleSettingChange = (values: PrivacyData) => {
		setData(values)
	}

	// Handle save
	const handleSave = async () => {
		if (!data) return

		// Validate form
		const isValid = settingRef.current?.validate()
		if (!isValid) {
			message.error(is_cn ? '请检查表单输入' : 'Please check form inputs')
			return
		}

		try {
			setSaving(true)
			await mockApi.updatePrivacyData(data)
			message.success(is_cn ? '更新成功' : 'Privacy settings updated successfully')
		} catch (error) {
			console.error('Failed to save privacy settings:', error)
			message.error(is_cn ? '更新失败' : 'Failed to update privacy settings')
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<div className={styles.privacy}>
				<div className={styles.loadingState}>
					<Icon name='material-hourglass_empty' size={32} className={styles.loadingIcon} />
					<span>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			</div>
		)
	}

	if (!schema || !data) {
		return (
			<div className={styles.privacy}>
				<div className={styles.errorState}>
					<Icon name='material-error' size={32} className={styles.errorIcon} />
					<span>{is_cn ? '加载失败' : 'Failed to load'}</span>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.privacy}>
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '隐私设置' : 'Privacy Settings'}</h2>
					<p>
						{is_cn
							? '管理您的隐私偏好和数据使用设置'
							: 'Manage your privacy preferences and data usage settings'}
					</p>
				</div>
				<div className={styles.headerActions}>
					<Button
						type='primary'
						icon={<Icon name='material-sync' size={14} />}
						onClick={handleSave}
						loading={saving}
					>
						{is_cn ? '更新' : 'Update'}
					</Button>
				</div>
			</div>

			{/* Settings Panel */}
			<div className={styles.panel}>
				<div className={styles.panelContent}>
					<Setting
						ref={settingRef}
						schema={schema}
						value={data}
						onChange={handleSettingChange}
						className={styles.setting}
					/>
				</div>
			</div>
		</div>
	)
}

export default Privacy
