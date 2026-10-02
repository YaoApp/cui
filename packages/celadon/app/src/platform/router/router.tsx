import { createBrowserRouter, RouterProvider } from 'react-router'
import { routes } from '@/routes/routes'
import { routerBasename } from './basename'

/* 机制层：只负责把路由装起来。路径怎么设计是 routes/ 的事（见 architecture/07-routing.md）。
   路由实例建在模块作用域 —— 每次渲染重建会丢掉导航栈。 */
const router = createBrowserRouter(routes, { basename: routerBasename() })

export function AppRouter() {
  return <RouterProvider router={router} />
}
