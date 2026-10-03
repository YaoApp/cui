import type { RouteShape } from '@/routes/shapes'
import { appHref } from '@/platform/utils/nav'

export const prefs = (): RouteShape => ({ path: appHref() })
