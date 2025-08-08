import React from 'react'
import { PropertySchema, PropertyValue } from '../../types'

interface Props {
	schema: PropertySchema
	value: PropertyValue
	onChange: (v: PropertyValue) => void
}

export default function Switch({ value, onChange }: Props) {
	const checked = Boolean(value)
	return <input type='checkbox' checked={checked} onChange={(e) => onChange(e.target.checked)} />
}
