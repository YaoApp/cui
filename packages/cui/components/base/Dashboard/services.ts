import axios from 'axios'
import { injectable } from 'tsyringe'

import { catchError } from '@/knife'
import { getApiBase } from '@/services/wellknown'

import type { Response } from '@/types'

@injectable()
export default class Index {
	@catchError()
	search<Res>(model: string) {
		return axios.get<{}, Response<Res>>(`${getApiBase()}/${window.$app.api_prefix}/dashboard/${model}/data`)
	}
}
