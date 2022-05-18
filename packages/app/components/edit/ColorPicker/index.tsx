import 'react-color-palette/lib/css/styles.css'

import { Input, Popover } from 'antd'
import clsx from 'clsx'
import { useEffect } from 'react'
import { ColorPicker, toColor, useColor } from 'react-color-palette'

import Item from '@/components/edit/Item'

import styles from './index.less'

import type { Color } from 'react-color-palette'
import type { ColorPickerProps } from 'react-color-palette/lib/interfaces/ColorPicker.interface'
import type { Component } from '@/types'

interface IProps extends ColorPickerProps, Component.PropsEditComponent {
	value: string
}

const Custom = window.$app.memo((props: ColorPickerProps & { value: string }) => {
	const [value, setValue] = useColor('hex', '#121212')

	useEffect(() => {
		if (!props.value) return

		setValue(toColor('hex', props.value))
	}, [props.value])

	const onChange = (v: Color) => {
		if (!props.onChange) return

		// @ts-ignore
		props.onChange(v.hex)

		setValue(v)
	}

	return (
		<Popover
			className='relative'
			overlayClassName={styles._local}
			trigger='click'
			content={
				<ColorPicker
					width={240}
					height={142}
					color={value}
					hideRGB
					hideHSV
					alpha
					onChange={(v) => onChange(v)}
					dark={localStorage.getItem('xgen-theme') === `"dark"`}
				></ColorPicker>
			}
		>
			<Input value={value.hex} readOnly></Input>
			<div
				className={clsx([styles.indicator, 'absolute'])}
				style={{ backgroundColor: value.hex }}
			></div>
		</Popover>
	)
})

const Index = (props: IProps) => {
	const { __bind, __name, __data_item, itemProps, ...rest_props } = props

	return (
		<Item {...itemProps} {...{ __bind, __name }}>
			<Custom {...rest_props}></Custom>
		</Item>
	)
}

export default window.$app.memo(Index)
