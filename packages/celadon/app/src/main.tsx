import '../../design/tokens.css'
import './platform/shell.less'
/* 初始化 i18n（eager 载入三处语言包）—— 必须在渲染前完成，首屏才有正确文案。 */
import '@/platform/i18n'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouter } from '@/platform/router/router'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
