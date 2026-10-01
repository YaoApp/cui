import '../../design/tokens.css'
import './platform/shell.less'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelloPage } from '@/features/hello'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <HelloPage />
  </StrictMode>,
)
