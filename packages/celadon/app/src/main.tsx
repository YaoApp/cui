import '../../design/tokens.css'
import './platform/shell.less'
/* 初始化 i18n（eager 载入三处语言包）—— 必须在渲染前完成，首屏才有正确文案。 */
import '@/platform/i18n'
/* 语言偏好（默认跟随系统）的副作用：把解析后的语言同步到 i18n 与 `<html lang>`。
   放在入口 import，任何界面表面（不只是渲染了语言切换的那页）都从第一帧起就是对的。 */
import '@/platform/i18n/locale.store'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouter } from '@/platform/router/router'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
