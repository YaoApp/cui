import type { Component } from '@/types'
import type { ImageProps } from 'antd'
import { GetPreviewURL } from '@/components/edit/Upload/request/storages/utils'
import { getToken } from '@/knife'
import { useMemo, useState } from 'react'
import clsx from 'clsx'
import styles from './index.less'

interface IProps extends Component.PropsViewComponent, ImageProps {
	previewURL?: string
	useAppRoot?: boolean
	api?: string | { api: string; params: string }
}

const Index = (props: IProps) => {
	const { __value, onSave, api, useAppRoot, previewURL, style, ...rest_props } = props

	const [url, setUrl] = useState<string>()

	const token = getToken()
	useMemo(() => {
		if (!api) return
		const url = GetPreviewURL({
			response: { path: __value || '' },
			previewURL,
			useAppRoot,
			token,
			api
		})
		setUrl(url)
	}, [api, previewURL, useAppRoot])

	if (!__value || (Array.isArray(__value) && __value.length == 0)) return <span>-</span>

	const props_image: ImageProps = {
		preview: false,
		height: '100%',
		style: { objectFit: 'cover', ...(style || {}) },
		...rest_props
	}

	return (
		<div className={clsx([styles._local, 'xgen-file-viewer'])}>
			<div>
				{url} {JSON.stringify(props_image)}
			</div>
		</div>
	)
}

export default window.$app.memo(Index)
