import { useParams, useLocation } from '@umijs/max'

export interface AppRouteProps {
	__routeParams?: Record<string, string>
	__routeSearch?: string
}

export function useAppRoute(props?: AppRouteProps) {
	const routerParams = useParams()
	const location = useLocation()

	const params = props?.__routeParams ? { ...routerParams, ...props.__routeParams } : routerParams
	const search = props?.__routeSearch ?? location.search

	return { params, search, location }
}
