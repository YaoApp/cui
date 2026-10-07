import { assertThemeContrast } from '@/platform/theme/assert-contrast'
import '@/platform/theme/tokens.css'
import './platform/shell.less'
/* 初始化 i18n（eager 载入三处语言包）—— 必须在渲染前完成，首屏才有正确文案。 */
import '@/platform/i18n'
/* 语言偏好（默认跟随系统）的副作用：把解析后的语言同步到 i18n 与 `<html lang>`。
   放在入口 import，任何界面表面（不只是渲染了语言切换的那页）都从第一帧起就是对的。 */
import '@/platform/i18n/locale.store'
import { i18n } from '@/platform/i18n'
import { ClientBootError, loadClient } from '@/platform/client'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { routerBasename } from '@/platform/router/basename'
import { routes } from '@/routes/routes'
import { mountIconSprite } from '@/platform/icons'

/* 图标底座挂一次（挂 body，不占页面结构）：所有 <Icon> 靠 #id 引用它（见 10-icons.md）。 */
mountIconSprite()

/* 首帧占位与站点图标都不在这里画：两者要在**应用包到达之前**就可见，因此写在 `index.html` 里
   （见该文件的注释）。这一段入口只负责装填客户端事实，装完把占位整体替换掉。 */

/**
 * 首帧占位的**文字**跟着当前语言走：占位本身写在 `index.html`（包到达前就要可见），
 * 它那里的文字只能按浏览器语言就近取；这里用真实语言包再校正一遍，
 * 换文案因此仍只需改语言包（`client.loading`）。
 */
function syncBootText(): void {
  const line = document.getElementById('boot-text')
  if (line) line.textContent = i18n.t('client.loading')
}

/** 装填失败：路由还没起来，所以这里画一个**最小视图**（失败码 + 重试）。 */
function renderBootError(error: unknown): void {
  const code = error instanceof ClientBootError ? error.code : 'client.boot_failed'
  const host = document.getElementById('app')
  if (!host) return
  host.textContent = ''
  const main = document.createElement('main')
  main.setAttribute('role', 'alert')
  const line = document.createElement('p')
  line.textContent = i18n.t('client.bootFailed', { code })
  const again = document.createElement('button')
  again.type = 'button'
  again.textContent = i18n.t('client.bootRetry')
  again.addEventListener('click', () => globalThis.location.reload())
  main.append(line, again)
  host.append(main)
}

/**
 * **一处装填**：客户端事实装满（清单 · 能力 · 宿主 · `client_id`）再渲染；失败即不可继续。
 *
 * 首帧占位（品牌标记 + 旋转指示 + 一句当前语言的说明）**写在 `index.html` 里**：
 * 它要在应用包到达之前可见，因此不能由这个模块来画（网络慢时先到的是 HTML，包还没下完）。
 * 这一段装填只在包已经到达之后才开始，桌面壳里要问一次宿主，是首次进入等得最久的一段。
 *
 * **服务地址不在这里等**：`GET /.well-known/yao` 由第一次请求按需读取（见 `platform/service/info.ts`），
 * 页面自己给进行中的状态。会话也不在这里读：基址回来后第一次请求会紧接着读一次，那一次才带得上凭据。
 */
async function boot(): Promise<void> {
  /* 占位已由 `index.html` 画好（包到达前就可见），这里只把文字校正成当前语言 */
  syncBootText()
  try {
    await loadClient()
  } catch (error) {
    renderBootError(error)
    return
  }
  /* 路由实例建在模块作用域 —— 每次渲染重建会丢掉导航栈。
     **装配点放在入口**：入口不属于任何层，于是 platform/ 不必反过来引 routes/
     （见 architecture/03-boundaries.md §2）。 */
  const router = createBrowserRouter(routes, { basename: routerBasename() })
  const host = document.getElementById('app')!
  /* 先清掉加载视图：`#app` 是宿主的根，React 接管时不该还留着别人的节点 */
  host.replaceChildren()
  createRoot(host).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
  /* 开发期自检：正文色与页面底色的对比度（见 architecture/09-theme.md §6）。生产不跑。 */
  assertThemeContrast()
}

void boot()
