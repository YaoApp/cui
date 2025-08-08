import React from 'react'
import { PropertySchema, PropertyValue } from '../../types'

interface Props {
	schema: PropertySchema
	value: PropertyValue
	onChange: (v: PropertyValue) => void
}

// Minimal placeholder using textarea; can be replaced with Monaco/Ace.
export default function CodeEditor({ value, onChange }: Props) {
	return (
		<textarea
			value={typeof value === 'string' ? value : ''}
			onChange={(e) => onChange(e.target.value)}
			rows={10}
			className='codeEditor'
		/>
	)
}
