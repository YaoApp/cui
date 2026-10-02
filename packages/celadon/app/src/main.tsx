import '../../design/tokens.css'
import './platform/shell.less'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouter } from '@/platform/router/router'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
