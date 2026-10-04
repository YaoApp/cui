import { Navigate, type RouteObject } from 'react-router'
import { HomePage } from '@/features/home'
import { BridgePage } from '@/features/scaffold/bridge'
import { OverviewPage } from '@/features/scaffold/overview'
import { RequestsPage } from '@/features/scaffold/requests'
import { RoutingPage } from '@/features/scaffold/routing'
import { SurfaceLayout } from './surface-layout'

/* 路由表：**只做装配**，业务实现不住这里。应用挂在构建决定的段下（base，见 04-host-integration.md）；
   路径**在 base 之下**：首页在 `/`，脚手架在 `/scaffold/*`（见 architecture/07-routing.md · plan/05-scaffold.md）。 */
const pageRoutes: RouteObject[] = [
  { index: true, element: <HomePage /> },
  { path: 'scaffold', element: <OverviewPage /> },
  /* 路由参数的样例：对象在路径里（`/scaffold/routing/<worldId>`） */
  { path: 'scaffold/routing', element: <RoutingPage /> },
  { path: 'scaffold/routing/:worldId', element: <RoutingPage /> },
  { path: 'scaffold/bridge', element: <BridgePage /> },
  { path: 'scaffold/requests', element: <RequestsPage /> },
]

export const routes: RouteObject[] = [
  { path: '/', element: <SurfaceLayout />, children: pageRoutes },
  { path: '*', element: <Navigate to="/" replace /> },
]
