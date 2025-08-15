import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { AddDocumentData } from '../../index'
import ProviderConfigs, { ProviderConfigsRef } from '../ProviderConfigs'
import styles from '../../index.less'

interface AdvancedTabProps {
	data: AddDocumentData
	options: any
	onOptionsChange: (options: any) => void
}

export interface AdvancedTabRef {
	validateProviderConfig: () => boolean
}

const AdvancedTab = forwardRef<AdvancedTabRef, AdvancedTabProps>(({ data, options, onOptionsChange }, ref) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 文档处理配置ref
	const providerConfigsRef = useRef<ProviderConfigsRef>(null)

	// 暴露给父组件的方法
	useImperativeHandle(ref, () => ({
		validateProviderConfig: () => {
			return providerConfigsRef.current?.validateAllConfigs() || false
		}
	}))

	return (
		<div className={styles.advancedTab}>
			{/* 文档处理配置 - 详细模式 */}
			<div className={styles.configSection}>
				<div className={styles.sectionTitle}>
					<Icon name='material-settings' size={14} />
					<span>{is_cn ? '文档处理配置' : 'Document Processing Configuration'}</span>
				</div>
				<ProviderConfigs
					ref={providerConfigsRef}
					dataType={data.type}
					options={options}
					onOptionsChange={onOptionsChange}
					mode='detailed'
					className={styles.advancedProviderConfigs}
				/>
			</div>
		</div>
	)
})

export default AdvancedTab
