import React from 'react'
import { EnumOption, PropertySchema, PropertyValue } from '../../types'

interface Props {
	schema: PropertySchema
	value: PropertyValue
	onChange: (v: PropertyValue) => void
	options?: EnumOption[]
}

export default function Select({ value, onChange, options = [] }: Props) {
	return (
		<select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
			{options.map((opt) => (
				<option key={opt.value} value={opt.value}>
					{opt.label}
				</option>
			))}
		</select>
	)
}
