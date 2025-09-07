import React from 'react'
import { PropertySchema, PropertyValue } from '../types'

interface Props {
	schema: PropertySchema
	value: PropertyValue[]
	onChange: (v: PropertyValue[]) => void
	renderItem: (itemVal: PropertyValue, idx: number) => React.ReactNode
	addItem: () => void
	removeItem: (idx: number) => void
}

export default function Items({ value, renderItem, addItem, removeItem }: Props) {
	const arr = Array.isArray(value) ? value : []
	return (
		<div className='arrayContainer'>
			<div className='arrayItems'>
				{arr.map((item, idx) => (
					<div key={idx}>
						{renderItem(item, idx)}
						<div className='arrayItemActions'>
							<button
								type='button'
								className='removeButton'
								onClick={() => removeItem(idx)}
							>
								Remove
							</button>
						</div>
					</div>
				))}
			</div>
			<div className='arrayActions'>
				<button type='button' className='addButton' onClick={addItem}>
					Add item
				</button>
			</div>
		</div>
	)
}
