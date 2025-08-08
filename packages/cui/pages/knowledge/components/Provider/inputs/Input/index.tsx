import React from 'react'
import { InputComponentProps } from '../../types'

export default function Input({ value, onChange }: InputComponentProps) {
	return <input value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} />
}
