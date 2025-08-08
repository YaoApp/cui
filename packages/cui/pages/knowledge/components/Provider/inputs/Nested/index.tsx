import React from 'react'
import { PropertySchema, PropertyValue } from '../../types'

interface Props {
	schema: PropertySchema
	value: PropertyValue
	onChange: (v: PropertyValue) => void
	children?: React.ReactNode
}

export default function Nested({ children }: Props) {
	return <div>{children}</div>
}
