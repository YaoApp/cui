import { Navigate, type RouteObject } from 'react-router'
import { HelloPage } from '@/features/hello'
import { WorldPage } from '@/features/world'
import { SurfaceLayout } from './surface-layout'

/* 路由表：**只做装配**，业务实现不住这里。
   应用挂在构建决定的段下（base，见 architecture/04-host-integration.md）；路由路径**在 base 之下**：
   主区 `/<feature>/<object>` · 侧边 `/side/<feature>/<object>`（见 architecture/07-routing.md）。 */
const pageRoutes: RouteObject[] = [
  { index: true, element: <Navigate to="hello" replace /> },
  { path: 'hello', element: <HelloPage /> },
  { path: 'world', element: <WorldPage /> },
  { path: 'world/:worldId', element: <WorldPage /> },
]

export const routes: RouteObject[] = [
  { path: '/', element: <SurfaceLayout surface="main" />, children: pageRoutes },
  { path: '/side', element: <SurfaceLayout surface="side" />, children: pageRoutes },
  { path: '*', element: <Navigate to="/hello" replace /> },
]
