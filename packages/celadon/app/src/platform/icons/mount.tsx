import { createRoot } from 'react-dom/client'
import { IconSprite } from './icon-sprite'

/* 图标底座是**文档级资源**，不是页面内容 —— 所以挂到 `body` 上，不占 `#app` 的位置
   （`#app` 的第一个孩子属于页面表面，见 app/src/features/hello/tests/page-surface.browser.ts）。 */
export function mountIconSprite(): void {
  const host = document.createElement('div')
  host.hidden = true
  document.body.append(host)
  createRoot(host).render(<IconSprite />)
}
