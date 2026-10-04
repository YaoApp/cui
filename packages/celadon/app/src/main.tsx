import { assertThemeContrast } from '@/platform/theme/assert-contrast'
import '@/platform/theme/tokens.css'
import './platform/shell.less'
/* 初始化 i18n（eager 载入三处语言包）—— 必须在渲染前完成，首屏才有正确文案。 */
import '@/platform/i18n'
/* 语言偏好（默认跟随系统）的副作用：把解析后的语言同步到 i18n 与 `<html lang>`。
   放在入口 import，任何界面表面（不只是渲染了语言切换的那页）都从第一帧起就是对的。 */
import '@/platform/i18n/locale.store'
// 启动读一次会话凭据（桌面写进 OS 凭据库、Web 是空操作）：出口之后的请求才带得上
import { loadSession } from '@/platform/credential'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { routerBasename } from '@/platform/router/basename'
import { routes } from '@/routes/routes'
import { mountIconSprite } from '@/platform/icons'
import { primeClientId } from '@/platform/client'

/* 图标底座挂一次（挂 body，不占页面结构）：所有 <Icon> 靠 #id 引用它（见 10-icons.md）。 */
mountIconSprite()

/* 桌面端把 `client_id` 从随机换成**真机器码**（拿不到就保持随机，不报错）。 */
void primeClientId()


/* 路由实例建在模块作用域 —— 每次渲染重建会丢掉导航栈。
   **装配点放在入口**：入口不属于任何层，于是 platform/ 不必反过来引 routes/
   （见 architecture/03-boundaries.md §2）。 */
const router = createBrowserRouter(routes, { basename: routerBasename() })

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

/* 开发期自检：正文色与页面底色的对比度（见 architecture/09-theme.md §6）。生产不跑。 */
assertThemeContrast()

void loadSession()
