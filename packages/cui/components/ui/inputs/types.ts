/**
 * Primitive schema data types supported by provider property definitions.
 * Mirrors common JSON Schema types with an extra 'integer' for numeric integers.
 */
export type PropertyType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array'

/**
 * A single option in an enumerated field.
 */
export interface EnumOption {
	/** Display label shown in UI */
	label: string
	/** Underlying machine value submitted/saved */
	value: string
	/** Optional helper text for this option */
	description?: string
	/** Whether this option is the default selection */
	default?: boolean
}

/**
 * OptionGroup represents a group of related options with a group label.
 */
export interface OptionGroup {
	/** Group label displayed as section header */
	groupLabel: string
	/** Array of options within this group */
	options: EnumOption[]
}

/**
 * Runtime value type for `ProviderOption.properties` entries.
 * Matches the possible values permitted by the corresponding `PropertySchema`.
 */
export type PropertyValue = string | number | boolean | PropertyValue[] | { [key: string]: PropertyValue }

/**
 * PropertySchema describes both the data and UI configuration for a single field in a Provider schema.
 * UI components are strongly typed via `InputComponent` and should correspond to entries under `@inputs/`.
 */
export interface PropertySchema {
	// Data Structure
	/** Data type for this field */
	type: PropertyType
	/** Short label displayed near the field */
	title?: string
	/** Helper text describing the field usage */
	description?: string
	/** Default value applied when undefined */
	default?: unknown
	/** Enumerated options for select-like inputs (can be flat options or grouped options) */
	enum?: (EnumOption | OptionGroup)[]

	// Validation
	/** Whether the field is required */
	required?: boolean
	/** For object types: names of nested properties that are required when the object is provided */
	requiredFields?: string[]
	/** Minimum length for string values */
	minLength?: number
	/** Maximum length for string values */
	maxLength?: number
	/** Regex pattern a string must satisfy */
	pattern?: string
	/** Minimum numeric value (inclusive) */
	minimum?: number
	/** Maximum numeric value (inclusive) */
	maximum?: number
	/** Error message templates with variable interpolation support */
	errorMessages?: {
		required?: string
		minLength?: string
		maxLength?: string
		pattern?: string
		minimum?: string
		maximum?: string
		custom?: string
	}

	// UI Configuration
	/** Input component to render from `@inputs/` */
	component?: InputComponent // enumerated input component
	/** Placeholder text for inputs */
	placeholder?: string
	/** Additional help text below the field */
	help?: string
	/** Field ordering index within a group/form */
	order?: number
	/** If true, the field is not displayed */
	hidden?: boolean
	/** If true, the field is disabled (non-interactive) */
	disabled?: boolean
	/** If true, the field is read-only */
	readOnly?: boolean
	/** Visual width hint (e.g. full, half, third, quarter) */
	width?: string
	/** Grouping name for organizing fields in UI */
	group?: string
	/** Allow clearing selection (for RadioGroup, Select, etc.) */
	allowClear?: boolean
	/** Number of rows for TextArea */
	rows?: number
	/** Enable search functionality (for Select) */
	searchable?: boolean
	/** Avatar variant (normal or large) */
	variant?: 'normal' | 'large'
	/** User name for avatar initials */
	userName?: string

	// Object / Array
	/** Nested properties when type === 'object' (use with component: 'Nested') */
	properties?: Record<string, PropertySchema>
	/** Array item schema when type === 'array' (use with component: 'Items') */
	items?: PropertySchema
}

/**
 * Available UI input components under `@inputs/`.
 * Keep in sync with the folders in `cui/components/ui/inputs`.
 */
export type InputComponent =
	| 'Input'
	| 'InputNumber'
	| 'InputPassword'
	| 'Switch'
	| 'CheckboxGroup'
	| 'RadioGroup'
	| 'Slider'
	| 'Group'
	| 'Select'
	| 'Nested'
	| 'Items'
	| 'TextArea'
	| 'CodeEditor'
	| 'Avatar'

/**
 * Common props interface for all input components
 */
export interface InputComponentProps {
	/** The property schema definition */
	schema: PropertySchema
	/** Current field value */
	value?: PropertyValue
	/** Value change handler */
	onChange?: (v: PropertyValue) => void
	/** Error message to display (if any) */
	error?: string
	/** Whether the field is in error state */
	hasError?: boolean
}
