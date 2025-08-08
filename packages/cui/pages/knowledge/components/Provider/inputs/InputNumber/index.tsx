import React from 'react'
import { InputComponentProps } from '../../types'

export default function InputNumber({ value, onChange }: InputComponentProps) {
	const numeric = typeof value === 'number' ? value : 0
	return <input type='number' value={numeric} onChange={(e) => onChange(Number(e.target.value))} />
}
