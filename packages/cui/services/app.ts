import axios from 'axios'
import { nanoid } from 'nanoid/non-secure'
import { injectable } from 'tsyringe'

import { catchError } from '@/knife'
import { local } from '@yaoapp/storex'
import { getApiBase } from './wellknown'

import type { Response } from '@/types'
import { getLocale } from '@umijs/max'

@injectable()
export default class Index {
	@catchError()
	getAppInfo<Res>() {
		const sid = nanoid() + new Date().valueOf()
		let lang = window.navigator.language.toLowerCase()
		try {
			lang = getLocale()?.toLowerCase()
		} catch (error) {
			lang = window.navigator.language.toLowerCase()
		}

		const time = new Date().toLocaleString().replaceAll('/', '-')
		local.temp_sid = sid

		// Use OpenAPI base URL if available, otherwise fall back to /api
		const apiBase = getApiBase()
		return axios.post<{}, Response<Res>>(`${apiBase}/__yao/app/setting`, { sid, lang, locale: lang, time })
	}

	@catchError()
	getUserMenu<Res>(locale?: string) {
		let lang = window.navigator.language.toLowerCase()
		if (locale) {
			lang = locale
		} else {
			try {
				lang = getLocale()?.toLowerCase()
			} catch (error) {
				lang = window.navigator.language.toLowerCase()
			}
		}

		// Use OpenAPI base URL if available, otherwise fall back to /api
		const apiBase = getApiBase()
		return axios.get<{}, Response<Res>>(`${apiBase}/${window.$app.api_prefix}/app/menu`, {
			params: { locale: lang }
		})
	}
}
