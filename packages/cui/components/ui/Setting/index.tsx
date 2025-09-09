import React, { forwardRef, useImperativeHandle, useState, useMemo } from 'react'
import { SettingProps, SettingRef } from './types'
import { PropertySchema, PropertyValue, ProviderSchema } from '../Provider/types'
import { validateField } from '../inputs/validation'
import ItemsContainer from '../inputs/Items'
import styles from './index.less'

// Input components mapping
import TextInput from '../inputs/Input'
import NumberInput from '../inputs/InputNumber'
import PasswordInput from '../inputs/InputPassword'
import ToggleSwitch from '../inputs/Switch'
import SelectInput from '../inputs/Select'
import TextAreaInput from '../inputs/TextArea'
import CodeEditorInput from '../inputs/CodeEditor'
import CheckboxGroupInput from '../inputs/CheckboxGroup'
import RadioGroupInput from '../inputs/RadioGroup'
import NestedContainer from '../inputs/Nested'

const componentMap: Record<string, any> = {
	Input: TextInput,
	InputNumber: NumberInput,
	InputPassword: PasswordInput,
	Switch: ToggleSwitch,
	Select: SelectInput,
	TextArea: TextAreaInput,
	CodeEditor: CodeEditorInput,
	CheckboxGroup: CheckboxGroupInput,
	RadioGroup: RadioGroupInput,
	Nested: NestedContainer,
	Items: ItemsContainer,
	Slider: TextInput // Fallback to TextInput for now
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

function mergeDefaultsFromSchema(
	schema: ProviderSchema,
	base: Record<string, PropertyValue> = {}
): Record<string, PropertyValue> {
	const next: Record<string, PropertyValue> = { ...base }
	Object.entries(schema.properties || {}).forEach(([key, ps]) => {
		const propertySchema = ps as PropertySchema
		if (next[key] === undefined) {
			next[key] = getDefaultValueBySchema(propertySchema) as PropertyValue
		}
		if (propertySchema.type === 'object' && propertySchema.properties) {
			const obj = typeof next[key] === 'object' && !Array.isArray(next[key]) ? (next[key] as any) : {}
			next[key] = mergeDefaultsFromSchema({ id: schema.id, properties: propertySchema.properties }, obj)
		}
	})
	return next
}

const Setting = forwardRef<SettingRef, SettingProps>((props, ref) => {
	const { schema, value = {}, onChange, className } = props
	const [values, setValues] = useState<Record<string, PropertyValue>>(() => mergeDefaultsFromSchema(schema, value))
	const [showValidation, setShowValidation] = useState(false)

	// Handle value change
	const updateField = (key: string, newValue: PropertyValue) => {
		setValues((prev) => {
			const next = { ...prev, [key]: newValue }
			onChange?.(next)
			return next
		})
		setShowValidation(true)
	}

	// Validate all fields
	const validateAllFields = () => {
		setShowValidation(true)
		if (!schema?.properties) return true

		const errors: string[] = []
		Object.entries(schema.properties).forEach(([key, fieldSchema]) => {
			const fieldValue = values[key]
			const isRequired = schema.required?.includes(key) || fieldSchema.required

			if (isRequired && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
				errors.push(`${fieldSchema.title || key} is required`)
				return
			}

			const validationResult = validateField(fieldSchema, fieldValue)
			if (!validationResult.isValid) {
				errors.push(validationResult.error || `Invalid ${fieldSchema.title || key}`)
			}
		})

		return errors.length === 0
	}

	// Expose methods to parent
	useImperativeHandle(ref, () => ({
		validate: validateAllFields
	}))

	// Get ordered entries
	const orderedEntries = useMemo(() => {
		const entries = Object.entries(schema?.properties || {}) as [string, PropertySchema][]
		return entries.sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
	}, [schema])

	// Render field
	const renderField = (name: string, ps: PropertySchema, keyPath: string[], parentSchema?: ProviderSchema) => {
		const key = keyPath.length > 0 ? keyPath.join('.') + '.' + name : name
		const currentValue = values[name]

		// Handle nested object
		if (ps.type === 'object' && ps.properties) {
			return (
				<div key={key} className={styles.nestedField}>
					<div className={styles.fieldLabel}>
						<div className={styles.labelName}>{ps.title || name}</div>
						{ps.description && <div className={styles.labelDescription}>{ps.description}</div>}
					</div>
					<div className={styles.nestedContent}>
						<NestedContainer
							schema={ps}
							value={currentValue}
							onChange={(v) => updateField(name, v)}
						>
							{Object.entries(ps.properties).map(([childKey, childPs]) =>
								renderChildField(childKey, childPs, name)
							)}
						</NestedContainer>
					</div>
				</div>
			)
		}

		// Handle array
		if (ps.type === 'array' && ps.items) {
			const arr = Array.isArray(currentValue) ? currentValue : []
			return (
				<div key={key} className={styles.arrayField}>
					<div className={styles.fieldLabel}>
						<div className={styles.labelName}>{ps.title || name}</div>
						{ps.description && <div className={styles.labelDescription}>{ps.description}</div>}
					</div>
					<ItemsContainer
						schema={ps}
						value={Array.isArray(currentValue) ? currentValue : []}
						onChange={(v) => updateField(name, v)}
						renderItem={(itemVal, idx) => (
							<div className={styles.arrayItem}>
								<div className={styles.arrayItemLabel}>
									{ps.items?.title || `${name}[${idx}]`}
								</div>
								{ps.items?.description && (
									<div className={styles.labelDescription}>
										{ps.items.description}
									</div>
								)}
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
		const isTextArea =
			ps.component === 'TextArea' ||
			ps.component === 'CodeEditor' ||
			ps.component === 'CheckboxGroup' ||
			ps.component === 'RadioGroup'
		const fieldClass = isTextArea ? `${styles.configField} ${styles.fullWidth}` : styles.configField
		const isRequired = parentSchema?.required?.includes(name) || ps.required

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

		// Validate the current value, but only show error if showValidation is true
		const validationResult = validateField(ps, val)
		const shouldShowError = showValidation && !validationResult.isValid

		return (
			<Comp
				schema={ps}
				value={val}
				onChange={onValueChange}
				error={shouldShowError ? validationResult.error : undefined}
				hasError={shouldShowError}
			/>
		)
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
				onChange?.(next)
				return next
			})
		})
	}

	return (
		<div className={`${styles.setting} ${className || ''}`}>
			<div className={styles.configForm}>
				{orderedEntries.map(([name, ps]) => renderField(name, ps, [], schema))}
			</div>
		</div>
	)
})

export default Setting
