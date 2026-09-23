import React, { useEffect, useMemo } from 'react'
import { getLocale } from '@umijs/max'
import type { ConnectorOptions } from '@/openapi/agent/types'
import { useModelGroups } from '@/hooks/useModelGroups'
import Selector from '../InputArea/Selector'

/** Display label for effort levels */
const effortLabels: Record<string, { en: string; cn: string }> = {
	none: { en: 'Off', cn: '关闭' },
	low: { en: 'Low', cn: '低' },
	medium: { en: 'Medium', cn: '中' },
	high: { en: 'High', cn: '高' },
	max: { en: 'Max', cn: '最高' },
	thinking: { en: 'On', cn: '开启' }
}

function effortLabel(level: string, isCn: boolean): string {
	const entry = effortLabels[level]
	if (entry) return isCn ? entry.cn : entry.en
	return level.charAt(0).toUpperCase() + level.slice(1)
}

export interface ModelSelectorProps {
	/** Currently selected full connector ID (backend Provider.Value) */
	value: string
	/** Selection change callback (outputs full connector ID) */
	onChange: (connector: string) => void
	/** Assistant info (passed to useModelGroups) */
	assistant?: {
		connector?: string
		connector_options?: ConnectorOptions
	}
	/** Disabled state (workspace offline, loading, recording) */
	disabled?: boolean
	/** Dropdown alignment direction */
	dropdownAlign?: 'left' | 'right'
	/** Responsive hiding */
	responsive?: boolean
	/** Current container width (from parent, for responsive check) */
	containerWidth?: number
}

const ModelSelector: React.FC<ModelSelectorProps> = (props) => {
	const { value, onChange, assistant, disabled, dropdownAlign, responsive, containerWidth } = props
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const { groups: modelGroups, connectorIndex, allModels, showSelector } = useModelGroups({
		assistant: assistant
			? { connector: assistant.connector, connector_options: assistant.connector_options }
			: undefined
	})

	// Current selection: reverse lookup connector ID → model group + effort
	const currentEntry = connectorIndex[value]

	// Effective connector: fallback to default_connector → first available
	const effectiveConnector = useMemo(() => {
		if (currentEntry) return value
		const defaultCid = modelGroups?.default_connector
		if (defaultCid && connectorIndex[defaultCid]) return defaultCid
		if (allModels.length > 0) {
			const first = allModels[0]
			return first.connectors[first.levels[0]] || ''
		}
		return ''
	}, [value, currentEntry, modelGroups, connectorIndex, allModels])

	// Notify parent when fallback triggers
	useEffect(() => {
		if (effectiveConnector && effectiveConnector !== value) {
			onChange(effectiveConnector)
		}
	}, [effectiveConnector, value, onChange])

	// Resolved entry for the current or effective connector
	const resolvedEntry = currentEntry || connectorIndex[effectiveConnector]
	const resolvedModel = resolvedEntry?.group
	const resolvedEffort = resolvedEntry?.effort || 'none'

	// Responsive hiding
	if (responsive && containerWidth !== undefined && containerWidth > 0 && containerWidth < 400) return null
	if (!showSelector || allModels.length === 0) return null

	// Model dropdown options — one per model family, grouped by provider
	const modelOptions = allModels.map((mg) => ({
		label: mg.model_name,
		value: mg.model_family,
		icon: 'material-psychology',
		group: mg.providerName
	}))

	// Effort dropdown — only when selected model has multiple levels
	const hasMultipleEfforts = resolvedModel ? resolvedModel.levels.length > 1 : false
	const effortOptions = resolvedModel
		? resolvedModel.levels.map((level) => ({
				label: effortLabel(level, is_cn),
				value: level,
				icon: 'material-tune',
				group: is_cn ? '思考强度' : 'Thinking Level'
			}))
		: []

	// Handle model family change — keep current effort if available in the new model
	const handleModelChange = (modelFamily: string) => {
		const mg = allModels.find((m) => m.model_family === modelFamily)
		if (!mg) return
		const effort = mg.connectors[resolvedEffort] ? resolvedEffort : mg.levels[0]
		const cid = mg.connectors[effort]
		if (cid) onChange(cid)
	}

	// Handle effort change within current model
	const handleEffortChange = (effort: string) => {
		if (!resolvedModel) return
		const cid = resolvedModel.connectors[effort]
		if (cid) onChange(cid)
	}

	return (
		<>
			{/* Model dropdown — value is model_family for correct highlighting */}
			<Selector
				value={resolvedModel?.model_family || ''}
				options={modelOptions}
				onChange={handleModelChange}
				variant='normal'
				tooltip={is_cn ? '切换模型' : 'Switch Model'}
				searchable={modelOptions.length >= 5}
				disabled={disabled}
				dropdownWidth='auto'
				dropdownMinWidth={200}
				dropdownMaxWidth={320}
				dropdownAlign={dropdownAlign}
			/>

			{/* Reasoning effort dropdown — only when multiple effort levels */}
			{hasMultipleEfforts && (
				<Selector
					value={resolvedEffort}
					options={effortOptions}
					onChange={handleEffortChange}
					variant='normal'
					tooltip={is_cn ? '思考强度' : 'Thinking Level'}
					disabled={disabled}
					dropdownMinWidth={120}
					dropdownMaxWidth={180}
					dropdownAlign={dropdownAlign}
					placeholderIcon='material-tune'
				/>
			)}
		</>
	)
}

export default ModelSelector
