import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'
import { mountIcons } from './icons'
import './app.css'

mountIcons()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
