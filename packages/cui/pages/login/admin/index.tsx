import { useAsyncEffect } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { container } from 'tsyringe'

import Common from '@/pages/login/components/Common'
import Model from '@/pages/login/model'
import { history } from '@umijs/max'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))

	useAsyncEffect(async () => {
		await window.$app.Event.emit('app/getAppInfo')

		// Redirect to the openapi auth page
		if (x.global.app_info.openapi?.baseURL != '') {
			return history.push('/auth/signin')
		}

		x.global.app_info.openapi?.baseURL != '' && history.push('/auth/signin')

		x.user_type = 'admin'
		x.getCaptcha()
	}, [])

	return <Common type='admin' x={x}></Common>
}

export default new window.$app.Handle(Index).by(observer).get()
