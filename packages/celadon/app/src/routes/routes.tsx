import { Navigate, Outlet, type RouteObject } from 'react-router'
import { AuthProvider } from '@/features/auth/components/auth-provider'
import { BackPage } from '@/features/auth/back'
import { LoginPage } from '@/features/auth/login'
import { RegisterPage } from '@/features/auth/register'
import { ServersPage } from '@/features/auth/servers'
import { WelcomePage } from '@/features/auth/welcome'
import { HomePage } from '@/features/home'
import { BasePage } from '@/features/scaffold/base'
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
  /* 基础件清单页：人类验收与浏览器断言共用（plan/06-login-components.md） */
  { path: 'scaffold/base', element: <BasePage /> },
]

/* 入口页自带外壳与域状态，因此挂在**表面布局之外**：无路径的布局路由只提供 `AuthProvider`，
   页面的品牌、全局控件与卡片由 `AuthLayout` 画（见 plan/06-login-features-login.md）。 */
const authRoutes: RouteObject[] = [
  {
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [
      { path: 'login', element: <LoginPage /> },
      /* 注册页先接通道：账号不存在的判定结果跳到这里（表单项按 plan/06 随后落地） */
      { path: 'register', element: <RegisterPage /> },
      /* 登录成功后的第一站（占位）：展示本次会话的用户信息，点继续再走成功地址 */
      { path: 'welcome', element: <WelcomePage /> },
      /* 服务器选择（客户端内特有）：选好并校验通过后进登录页；Web 只读展示当前地址 */
      { path: 'servers', element: <ServersPage /> },
      /* 第三方登录的回跳页：授权发起时把地址指到这里（见 plan/06-login-features-login.md 第 7 节） */
      { path: 'auth/back/:provider', element: <BackPage /> },
    ],
  },
]

export const routes: RouteObject[] = [
  ...authRoutes,
  { path: '/', element: <SurfaceLayout />, children: pageRoutes },
  { path: '*', element: <Navigate to="/" replace /> },
]
