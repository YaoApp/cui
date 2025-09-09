import React, { useState, useEffect, useRef } from 'react'
import { getLocale } from '@umijs/max'
import { message } from 'antd'
import { mockApi, PreferencesData } from '../../mockData'
import { ProviderSchema } from '@/components/ui/Provider/types'
import { Button, Setting } from '@/components/ui'
import { SettingRef } from '@/components/ui/Setting/types'
import Icon from '@/widgets/Icon'
import styles from './index.less'

const Preferences = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [schema, setSchema] = useState<ProviderSchema | null>(null)
	const [data, setData] = useState<PreferencesData | null>(null)

	// Setting component ref
	const settingRef = useRef<SettingRef>(null)

	// Load schema and data
	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true)
				const [schemaData, preferencesData] = await Promise.all([
					mockApi.getPreferencesSchema(locale),
					mockApi.getPreferencesData()
				])
				setSchema(schemaData)
				setData(preferencesData)
			} catch (error) {
				console.error('Failed to load preferences:', error)
				message.error(is_cn ? '加载偏好设置失败' : 'Failed to load preferences')
			} finally {
				setLoading(false)
			}
		}

		loadData()
	}, [is_cn])

	// Handle setting changes
	const handleSettingChange = (values: PreferencesData) => {
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
			await mockApi.updatePreferencesData(data)
			message.success(is_cn ? '更新成功' : 'Preferences updated successfully')
		} catch (error) {
			console.error('Failed to save preferences:', error)
			message.error(is_cn ? '更新失败' : 'Failed to update preferences')
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<div className={styles.preferences}>
				<div className={styles.loadingState}>
					<Icon name='material-hourglass_empty' size={32} className={styles.loadingIcon} />
					<span>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			</div>
		)
	}

	if (!schema || !data) {
		return (
			<div className={styles.preferences}>
				<div className={styles.errorState}>
					<Icon name='material-error' size={32} className={styles.errorIcon} />
					<span>{is_cn ? '加载失败' : 'Failed to load'}</span>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.preferences}>
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '偏好设置' : 'Preferences'}</h2>
					<p>
						{is_cn
							? '管理您的个人偏好和界面设置'
							: 'Manage your personal preferences and interface settings'}
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

export default Preferences
