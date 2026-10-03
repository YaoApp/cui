import { Navigate, type RouteObject } from 'react-router'
import { HelloPage } from '@/features/hello'
import { WorldPage } from '@/features/world'
import { SurfaceLayout } from './surface-layout'

/* 路由表：**只做装配**，业务实现不住这里。
   地址语法：/<surface>/<feature>/<object>?<面板参数>（见 architecture/07-routing.md）。 */
export const routes: RouteObject[] = [
  { path: '/', element: <Navigate to="/app/hello" replace /> },
  {
    path: '/:surface',
    element: <SurfaceLayout />,
    children: [
      { index: true, element: <Navigate to="hello" replace /> },
      { path: 'hello', element: <HelloPage /> },
      { path: 'world', element: <WorldPage /> },
      { path: 'world/:worldId', element: <WorldPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/app/hello" replace /> },
]
