import React from 'react'
import { InputComponentProps } from '../../types'

export default function TextArea({ value, onChange }: InputComponentProps) {
	return (
		<textarea
			value={typeof value === 'string' ? value : ''}
			onChange={(e) => onChange(e.target.value)}
			rows={6}
		/>
	)
}
