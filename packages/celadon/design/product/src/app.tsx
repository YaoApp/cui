import { AppViewPage } from './pages/app-view'
import { AppsIndexPage } from './pages/apps-index'
import { BoardsPage } from './pages/boards'
import { BotsPage } from './pages/bots'
import { InboxPage } from './pages/inbox'
import { ModulesPage } from './pages/modules'
import { NewSessionPage } from './pages/new-session'
import { SessionDetailPage } from './pages/session-detail'

const path = window.location.pathname.replace(/\/+$/, '')
const appMatch = path.match(/^\/apps\/([^/]+)$/)
const botMatch = path.match(/^\/bots\/([^/]+)$/)
const sessionMatch = path.match(/^\/sessions\/([^/]+)$/)

export function App() {
  if (path === '/new-session') return <NewSessionPage />
  if (path === '/apps') return <AppsIndexPage />
  if (path === '/bots') return <BotsPage />
  if (path === '/inbox') return <InboxPage />
  if (path === '/boards') return <BoardsPage />
  if (botMatch) return <BotsPage botId={botMatch[1]} />
  if (sessionMatch) return <SessionDetailPage sessionId={sessionMatch[1]} />
  if (appMatch) return <AppViewPage appId={appMatch[1]} />
  return <ModulesPage />
}
