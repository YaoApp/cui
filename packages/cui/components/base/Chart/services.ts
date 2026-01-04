import axios from 'axios'
import { injectable } from 'tsyringe'

import { catchError } from '@/knife'
import { getApiBase } from '@/services/wellknown'

import type { Response } from '@/types'

@injectable()
export default class Index {
	@catchError()
	search<Req, Res>(model: string, params?: Req) {
		return axios.get<Req, Response<Res>>(`${getApiBase()}/${window.$app.api_prefix}/chart/${model}/data`, { params })
	}
}
