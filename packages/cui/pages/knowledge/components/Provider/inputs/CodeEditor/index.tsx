import React from 'react'
import { InputComponentProps } from '../../types'

// Minimal placeholder using textarea; can be replaced with Monaco/Ace.
export default function CodeEditor({ value, onChange }: InputComponentProps) {
	return (
		<textarea
			value={typeof value === 'string' ? value : ''}
			onChange={(e) => onChange(e.target.value)}
			rows={10}
			className='codeEditor'
		/>
	)
}
