import { AppViewPage } from './pages/app-view'
import { AppsIndexPage } from './pages/apps-index'
import { BoardsPage } from './pages/boards'
import { BotsPage } from './pages/bots'
import { ComputersPage } from './pages/computers'
import { InboxPage } from './pages/inbox'
import { ModulesPage } from './pages/modules'
import { NewSessionPage } from './pages/new-session'
import { SessionDetailPage } from './pages/session-detail'
import { WorkspacesPage } from './pages/workspaces'

const path = window.location.pathname.replace(/\/+$/, '')
const appMatch = path.match(/^\/apps\/([^/]+)$/)
const botMatch = path.match(/^\/bots\/([^/]+)$/)
const sessionMatch = path.match(/^\/sessions\/([^/]+)$/)
const workspaceMatch = path.match(/^\/workspaces\/([^/]+)$/)

export function App() {
  if (path === '/new-session') return <NewSessionPage />
  if (path === '/apps') return <AppsIndexPage />
  if (path === '/bots') return <BotsPage />
  if (path === '/inbox') return <InboxPage />
  if (path === '/boards') return <BoardsPage />
  if (path === '/computers') return <ComputersPage />
  if (path === '/workspaces') return <WorkspacesPage />
  if (workspaceMatch) return <WorkspacesPage workspaceId={workspaceMatch[1]} />
  if (botMatch) return <BotsPage botId={botMatch[1]} />
  if (sessionMatch) return <SessionDetailPage sessionId={sessionMatch[1]} />
  if (appMatch) return <AppViewPage appId={appMatch[1]} />
  return <ModulesPage />
}
