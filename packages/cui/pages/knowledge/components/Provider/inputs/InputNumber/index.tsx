import React from 'react'
import { PropertySchema, PropertyValue } from '../../types'

interface Props {
	schema: PropertySchema
	value: PropertyValue
	onChange: (v: PropertyValue) => void
}

export default function InputNumber({ value, onChange }: Props) {
	const numeric = typeof value === 'number' ? value : 0
	return <input type='number' value={numeric} onChange={(e) => onChange(Number(e.target.value))} />
}
