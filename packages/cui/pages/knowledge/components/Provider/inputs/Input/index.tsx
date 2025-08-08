import React from 'react'
import { PropertySchema, PropertyValue, EnumOption } from '../../types'

interface Props {
	schema: PropertySchema
	value: PropertyValue
	onChange: (v: PropertyValue) => void
	options?: EnumOption[]
}

export default function Input({ value, onChange }: Props) {
	return <input value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} />
}
