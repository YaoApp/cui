import React, { useEffect, useMemo, useState } from 'react'
import {
	ProviderAndSchemaResponse,
	ProviderSchema,
	ProviderSchemaSummary,
	PropertySchema,
	PropertyValue,
	InputComponent
} from './types'
import { fetchProviderAndSchema, fetchProviderSchemaSummaries } from './mock'
import styles from './index.less'

// Input components (placeholders) mapped by component name
import TextInput from './inputs/Input/index'
import NumberInput from './inputs/InputNumber/index'
import PasswordInput from './inputs/InputPassword/index'
import ToggleSwitch from './inputs/Switch/index'
import SelectInput from './inputs/Select/index'
import TextAreaInput from './inputs/TextArea/index'
import CodeEditorInput from './inputs/CodeEditor/index'
import NestedContainer from './inputs/Nested/index'
import ItemsContainer from './inputs/Items/index'

type Values = Record<string, PropertyValue>

export interface ProviderConfiguratorProps {
	// Currently only 'chunkings' is used, but the API allows other types
	type?: string
	// Optional controlled value
	value?: { id?: string; properties?: Values }
	// Change notification to parent
	onChange?: (next: { id: string; properties: Values }) => void
	// Optional className for outer container
	className?: string
}

const componentMap: Record<InputComponent, React.ComponentType<any>> = {
	Input: TextInput,
	InputNumber: NumberInput,
	InputPassword: PasswordInput,
	Switch: ToggleSwitch,
	CheckboxGroup: SelectInput, // placeholder
	RadioGroup: SelectInput, // placeholder
	Slider: NumberInput, // placeholder
	Group: NestedContainer, // placeholder
	Select: SelectInput,
	Nested: NestedContainer,
	Items: ItemsContainer,
	TextArea: TextAreaInput,
	CodeEditor: CodeEditorInput
}

function getDefaultValueBySchema(schema: PropertySchema): PropertyValue | undefined {
	if (schema.default !== undefined) return schema.default as PropertyValue
	switch (schema.type) {
		case 'string':
			return ''
		case 'number':
		case 'integer':
			return 0
		case 'boolean':
			return false
		case 'object':
			return {}
		case 'array':
			return []
		default:
			return undefined
	}
}

function mergeDefaultsFromSchema(schema: ProviderSchema, base: Values = {}): Values {
	const next: Values = { ...base }
	Object.entries(schema.properties || {}).forEach(([key, ps]) => {
		if (next[key] === undefined) {
			next[key] = getDefaultValueBySchema(ps) as PropertyValue
		}
		if (ps.type === 'object' && ps.properties) {
			const obj = typeof next[key] === 'object' && !Array.isArray(next[key]) ? (next[key] as any) : {}
			next[key] = mergeDefaultsFromSchema({ id: schema.id, properties: ps.properties }, obj)
		}
	})
	return next
}

export default function ProviderConfigurator(props: ProviderConfiguratorProps) {
	const { type = 'chunkings', value, onChange, className } = props
	const [summaries, setSummaries] = useState<ProviderSchemaSummary[]>([])
	const [selectedId, setSelectedId] = useState<string | undefined>(value?.id)
	const [schema, setSchema] = useState<ProviderSchema | undefined>(undefined)
	const [providerResp, setProviderResp] = useState<ProviderAndSchemaResponse | undefined>(undefined)
	const [values, setValues] = useState<Values>(value?.properties || {})
	const [loadingList, setLoadingList] = useState(false)
	const [loadingDetail, setLoadingDetail] = useState(false)

	// Fetch summaries on mount
	useEffect(() => {
		let ignore = false
		setLoadingList(true)
		fetchProviderSchemaSummaries(type)
			.then((list) => {
				if (ignore) return
				setSummaries(list)
				if (!selectedId && list.length > 0) {
					setSelectedId(list[0].id)
				}
			})
			.finally(() => !ignore && setLoadingList(false))
		return () => {
			ignore = true
		}
	}, [type])

	// Fetch details when selectedId changes
	useEffect(() => {
		if (!selectedId) return
		let ignore = false
		setLoadingDetail(true)
		fetchProviderAndSchema(selectedId)
			.then((resp) => {
				if (ignore) return
				setProviderResp(resp)
				setSchema(resp.schema)

				// Initialize values from provider default option and schema defaults
				const defaultOption = resp.provider.options.find((o) => o.default) || resp.provider.options[0]
				const baseValues: Values = defaultOption?.properties ? { ...defaultOption.properties } : {}
				const merged = mergeDefaultsFromSchema(resp.schema, baseValues)
				setValues((prev) => ({ ...merged, ...prev }))
				onChange?.({ id: selectedId, properties: { ...merged, ...values } })
			})
			.finally(() => !ignore && setLoadingDetail(false))
		return () => {
			ignore = true
		}
	}, [selectedId])

	// Handle value change
	const updateField = (key: string, newValue: PropertyValue) => {
		setValues((prev) => {
			const next = { ...prev, [key]: newValue }
			if (selectedId) onChange?.({ id: selectedId, properties: next })
			return next
		})
	}

	const orderedEntries = useMemo(() => {
		const entries = Object.entries(schema?.properties || {}) as [string, PropertySchema][]
		return entries.sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
	}, [schema])

	// Loading states
	if (loadingList) {
		return <div className={styles.loadingState}>Loading providers...</div>
	}

	if (summaries.length === 0) {
		return <div className={styles.emptyState}>No providers available</div>
	}

	const renderField = (name: string, ps: PropertySchema, path: string[] = [], parentSchema?: ProviderSchema) => {
		const Comp = ps.component ? componentMap[ps.component] : TextInput
		const key = [...path, name].join('.')
		const currentValue = (values as any)[name]

		if (ps.type === 'object' && ps.properties) {
			// Render nested object
			const entries = Object.entries(ps.properties).sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
			const isNestedObjectRequired = ps.required || false

			return (
				<div key={key} className={styles.nestedField}>
					{ps.title && (
						<div className={styles.nestedTitle} title={ps.title}>
							{ps.title}
							{isNestedObjectRequired && <span className={styles.requiredMark}>*</span>}
						</div>
					)}
					{ps.description && (
						<div className={styles.nestedDescription} title={ps.description}>
							{ps.description}
						</div>
					)}
					<div className={styles.nestedContainer}>
						<div className={styles.nestedForm}>
							{entries.map(([childKey, childPs]) => {
								const isNestedTextArea =
									childPs.component === 'TextArea' ||
									childPs.component === 'CodeEditor'
								const nestedFieldClass = isNestedTextArea
									? `${styles.nestedFieldRow} ${styles.fullWidth}`
									: styles.nestedFieldRow
								// For nested fields, check if it's in the parent's requiredFields array
								const isChildRequired = ps.requiredFields?.includes(childKey) || false

								return (
									<div key={`${key}.${childKey}`} className={nestedFieldClass}>
										<div className={styles.nestedFieldLabel}>
											<div
												className={styles.labelName}
												title={childPs.title || childKey}
											>
												{childPs.title || childKey}
												{isChildRequired && (
													<span className={styles.requiredMark}>
														*
													</span>
												)}
											</div>
											{childPs.description && (
												<div
													className={styles.labelDescription}
													title={childPs.description}
												>
													{childPs.description}
												</div>
											)}
										</div>
										<div className={styles.nestedFieldControl}>
											{renderChildField(childKey, childPs, name)}
										</div>
									</div>
								)
							})}
						</div>
					</div>
				</div>
			)
		}

		if (ps.type === 'array' && ps.items) {
			const arr = Array.isArray(currentValue) ? (currentValue as any[]) : []
			return (
				<div key={key} className={styles.arrayField}>
					{ps.title && <div className={styles.arrayTitle}>{ps.title}</div>}
					{ps.description && <div className={styles.arrayDescription}>{ps.description}</div>}
					<ItemsContainer
						schema={ps}
						value={arr}
						onChange={(val: any[]) => updateField(name, val as any)}
						renderItem={(itemVal: any, idx: number) => (
							<div key={`${key}[${idx}]`} className={styles.arrayItem}>
								<div className={styles.arrayItemLabel}>
									<div className={styles.labelName}>
										{ps.items?.title || `${name}[${idx}]`}
									</div>
									{ps.items?.description && (
										<div className={styles.labelDescription}>
											{ps.items.description}
										</div>
									)}
								</div>
								<div className={styles.arrayItemControl}>
									{renderDynamicInput(ps.items as PropertySchema, itemVal, (v) => {
										const next = [...arr]
										next[idx] = v
										updateField(name, next as any)
									})}
								</div>
							</div>
						)}
						addItem={() => {
							const base = getDefaultValueBySchema(ps.items as PropertySchema)
							updateField(name, [...arr, base] as any)
						}}
						removeItem={(idx: number) => {
							const next = [...arr]
							next.splice(idx, 1)
							updateField(name, next as any)
						}}
					/>
				</div>
			)
		}

		// Primitive field
		const isTextArea = ps.component === 'TextArea' || ps.component === 'CodeEditor'
		const fieldClass = isTextArea ? `${styles.configField} ${styles.fullWidth}` : styles.configField
		const isRequired = parentSchema?.required?.includes(name) || false

		return (
			<div key={key} className={fieldClass}>
				<div className={styles.fieldLabel}>
					<div className={styles.labelName} title={ps.title || name}>
						{ps.title || name}
						{isRequired && <span className={styles.requiredMark}>*</span>}
					</div>
					{ps.description && (
						<div className={styles.labelDescription} title={ps.description}>
							{ps.description}
						</div>
					)}
				</div>
				<div className={styles.fieldControl}>
					{renderDynamicInput(ps, currentValue, (v) => updateField(name, v))}
				</div>
			</div>
		)
	}

	const renderDynamicInput = (
		ps: PropertySchema,
		val: PropertyValue,
		onValueChange: (v: PropertyValue) => void
	) => {
		const Comp = ps.component ? componentMap[ps.component] : TextInput
		return <Comp schema={ps} value={val} onChange={onValueChange} />
	}

	const renderChildField = (childKey: string, childPs: PropertySchema, parentKey: string) => {
		const val = (values as any)[parentKey] || {}
		const childValue = val[childKey]
		return renderDynamicInput(childPs, childValue, (v) => {
			setValues((prev) => {
				const parent =
					prev[parentKey] && typeof prev[parentKey] === 'object' && !Array.isArray(prev[parentKey])
						? { ...(prev[parentKey] as any) }
						: {}
				const next = { ...prev, [parentKey]: { ...parent, [childKey]: v } }
				if (selectedId) onChange?.({ id: selectedId, properties: next })
				return next
			})
		})
	}

	return (
		<div className={`${styles.providerConfigurator} ${className || ''}`}>
			{/* Provider container with selector and config */}
			<div className={styles.providerContainer}>
				{/* Provider selector */}
				<div className={styles.providerSelector}>
					<div className={styles.selectorLabel}>
						<div className={styles.labelName}>Chunking Provider</div>
						<div className={styles.labelDescription}>Choose the chunking algorithm</div>
					</div>
					<div className={styles.selectorControl}>
						<SelectInput
							schema={{
								type: 'string',
								title: 'Provider',
								enum: summaries.map((s) => ({
									label: s.title || s.id,
									value: s.id
								}))
							}}
							value={selectedId || ''}
							onChange={(id: any) => setSelectedId(String(id))}
						/>
					</div>
				</div>

				{/* Details form */}
				{schema && (
					<div className={styles.configForm}>
						{loadingDetail ? (
							<div className={styles.loadingState}>Loading configuration...</div>
						) : (
							orderedEntries.map(([name, ps]) => renderField(name, ps, [], schema))
						)}
					</div>
				)}
			</div>
		</div>
	)
}
