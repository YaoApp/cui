import React from 'react'
import { InputComponentProps } from '../../types'

export default function Switch({ value, onChange }: InputComponentProps) {
	const checked = Boolean(value)
	return <input type='checkbox' checked={checked} onChange={(e) => onChange(e.target.checked)} />
}
