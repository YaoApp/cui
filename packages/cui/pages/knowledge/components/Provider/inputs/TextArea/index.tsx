import React from 'react'
import { PropertySchema, PropertyValue } from '../../types'

interface Props {
	schema: PropertySchema
	value: PropertyValue
	onChange: (v: PropertyValue) => void
}

export default function TextArea({ value, onChange }: Props) {
	return (
		<textarea
			value={typeof value === 'string' ? value : ''}
			onChange={(e) => onChange(e.target.value)}
			rows={6}
		/>
	)
}
