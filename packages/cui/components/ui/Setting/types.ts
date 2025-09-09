import { ProviderSchema, PropertyValue } from '../Provider/types'

export interface SettingProps {
	/** Schema definition */
	schema: ProviderSchema
	/** Current values */
	value?: Record<string, PropertyValue>
	/** Change callback */
	onChange?: (values: Record<string, PropertyValue>) => void
	/** CSS class */
	className?: string
}

export interface SettingRef {
	/** Validate all fields */
	validate: () => boolean
}
