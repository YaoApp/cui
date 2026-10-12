import { Navigate, Outlet, type RouteObject } from 'react-router'
import { AuthProvider } from '@/features/auth/components/auth-provider'
import { BackPage } from '@/features/auth/back'
import { LoginPage } from '@/features/auth/login'
import { RegisterPage } from '@/features/auth/register'
import { ServersPage } from '@/features/auth/servers'
import { WelcomePage } from '@/features/auth/welcome'
import { PlaceholderPage } from '@/components/content'
import { InboxPage } from '@/features/inbox'
import { EntryGate, ServerGuard } from './entry-gate'
import { RequireSession, SessionExpiryGuard } from './session-guard'
import { AppLayout } from './layout'
import { TitleBar } from '@/components/title-bar'
import { useColumnsStore } from '@/stores/layout/columns'

/* 路由表：**只做装配**，业务实现不住这里。应用挂在构建决定的段下（base，见 04-host-integration.md）；
   路径**在 base 之下**：根是入口判定，产品页在导航六项的地址下。 */

/* 产品面：第一阶段先落收件箱组装页，其余四个入口用占位页（见 plan/08-layout-base.md §3.3 与 §4）。 */
const productRoutes: RouteObject[] = [
	{ path: 'new', element: <PlaceholderPage titleKey='shell.navigation.item.new' /> },
	{ path: 'inbox', element: <InboxPage /> },
	{ path: 'apps', element: <PlaceholderPage titleKey='shell.navigation.item.apps' /> },
	{ path: 'board', element: <PlaceholderPage titleKey='shell.navigation.item.board' /> },
	{ path: 'workspace', element: <PlaceholderPage titleKey='shell.navigation.item.workspace' /> },
	{ path: 'computer', element: <PlaceholderPage titleKey='shell.navigation.item.computer' /> }
]

/* 入口页自带外壳与域状态，因此挂在**表面布局之外**：无路径的布局路由只提供 `AuthProvider`，
   页面的品牌、全局控件与卡片由 `AuthLayout` 画。 */
const authRoutes: RouteObject[] = [
	{
		element: (
			<AuthProvider>
				<Outlet />
			</AuthProvider>
		),
		children: [
			{ path: 'login', element: <LoginPage /> },
			/* 注册页先接通道：账号不存在的判定结果跳到这里（表单项按 06 随后落地） */
			{ path: 'register', element: <RegisterPage /> },
			/* 登录成功后的第一站（占位）：展示本次会话的用户信息，点继续再走成功地址 */
			{ path: 'welcome', element: <WelcomePage /> },
			/* 服务器选择（客户端内特有）：选好并校验通过后进登录页；Web 只读展示当前地址 */
			{ path: 'servers', element: <ServersPage /> },
			/* 第三方登录的回跳页：授权发起时把地址指到这里 */
			{ path: 'auth/back/:provider', element: <BackPage /> }
		]
	}
]

/* 三层装配：选服务器（桌面首次）→ 产品面（会话失效守卫 401 清状态回登录页 · 会话守卫 · 表面布局与入口判定）
   → 开发面（脚手架）；根地址走入口判定，未知路径算产品面。 */
/* 窗口外壳：Windows 自绘的那条标题栏画在所有页面之上，下方内容与 Web 一致。
   它读布局状态、把动作交给 TitleBar；macOS 与 Web 下 TitleBar 自己不画（见内部文档「桌面客户端壳」）。 */
function ShellFrame() {
	const navCollapsed = useColumnsStore((state) => state.navCollapsed)
	const toggleNav = useColumnsStore((state) => state.toggleNav)
	return (
		<>
			<TitleBar navCollapsed={navCollapsed} onToggleNav={toggleNav} />
			<Outlet />
		</>
	)
}

export const routes: RouteObject[] = [
	{
		element: <ShellFrame />,
		children: [
			{
				element: <ServerGuard />,
				children: [
					{
						element: <SessionExpiryGuard />,
						children: [
							...authRoutes,
							{
								path: '/',
								element: <AppLayout />,
								children: [{ index: true, element: <EntryGate /> }, ...productRoutes]
							},
							{
								/* 会话守卫的消费者：产品页（还没有）与未知路径 */
								element: <RequireSession />,
								children: [{ path: '*', element: <Navigate to='/' replace /> }]
							}
						]
					},
					{
						element: <AppLayout />
					}
				]
			}
		]
	}
]
