import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { i18n } from '@/platform/i18n'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NewSessionPage } from './new-session'

const createSession = vi.fn()

vi.mock('@/data/session', () => ({
  createSession: (...args: unknown[]) => createSession(...args),
  listComputers: async () => [{ id: 'cmp_1', name: 'Mac Studio', status: 'online' }],
  listWorkspaces: async () => [
    {
      id: 'ws_1',
      computer_id: 'cmp_1',
      name: 'cui',
      scope: 'private',
      role: 'editor',
      status: 'online',
      path: '/workspace/cui',
    },
  ],
  listModels: async () => [
    {
      model_id: 'deepseek-chat',
      provider_name: 'DeepSeek',
      name: 'DeepSeek Chat',
      context_window: 128000,
      reasoning: false,
    },
  ],
  listVaults: async () => [],
}))

vi.mock('@/data/apps', () => ({
  listApps: async () => [
    {
      id: 'poster-studio',
      icon: 'i-act-edit',
      category: 'design',
      surface: 'canvas',
      status: 'ready',
      source: 'self',
      updated_at: '2026-10-28T12:00:00Z',
    },
  ],
  listBots: async () => [{ id: 'researcher', icon: 'i-search', status: 'ready' }],
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/new-session']}>
      <Routes>
        <Route path='/new-session' element={<NewSessionPage />} />
        <Route path='/apps/:appId' element={<div>App detail</div>} />
        <Route path='/sessions/:id' element={<div>Session detail</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('NewSessionPage', () => {
  beforeEach(() => {
    createSession.mockReset()
    createSession.mockResolvedValue({ id: 'sess_1', title: 'Launch poster' })
  })

  it('opens the App surface from a recommendation', async () => {
    renderPage()
    const appName = i18n.t('session.app.poster')
    const app = await screen.findByRole('button', { name: new RegExp(appName) })
    await userEvent.click(app)
    expect(await screen.findByText('App detail')).toBeInTheDocument()
    expect(createSession).not.toHaveBeenCalled()
  })

  it('moves the selected tab with the arrow keys', async () => {
    renderPage()
    const useTab = screen.getByRole('tab', { name: i18n.t('session.new.tab.use') })
    const buildTab = screen.getByRole('tab', { name: i18n.t('session.new.tab.build') })

    useTab.focus()
    await userEvent.keyboard('{ArrowRight}')

    expect(buildTab).toHaveAttribute('aria-selected', 'true')
    expect(useTab).toHaveAttribute('aria-selected', 'false')
  })

  it('switches to Build and shows the template section', async () => {
    renderPage()
    expect(screen.getByRole('heading', { name: i18n.t('session.rec.title') })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: i18n.t('session.new.tab.build') }))

    expect(screen.getByRole('heading', { name: i18n.t('session.build.title') })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: i18n.t('session.build.templates') })).toBeInTheDocument()
    expect(screen.queryByText(i18n.t('session.rec.recommendTitle'))).not.toBeInTheDocument()
    expect(
      screen.queryByText(i18n.t('session.rec.createBotContext'), { selector: '.session-new__context' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', i18n.t('session.build.placeholder'))
  })

  it('starts a session from a Bot with the platform submit shortcut', async () => {
    renderPage()
    const botName = i18n.t('session.bot.researcher')
    const bot = await screen.findByRole('button', { name: new RegExp(botName) })
    await userEvent.click(bot)
    expect(screen.getByText(i18n.t('session.rec.chatting', { name: botName }))).toBeInTheDocument()

    const input = screen.getByRole('textbox')
    await userEvent.click(input)
    await userEvent.type(input, 'Launch poster')
    await userEvent.keyboard('{Enter}')
    expect(createSession).not.toHaveBeenCalled()
    await userEvent.keyboard('{Control>}{Enter}{/Control}')

    await waitFor(() => expect(createSession).toHaveBeenCalledTimes(1))
    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        agent: 'researcher',
        title: 'Launch poster',
        model: 'deepseek-chat',
        effort: 'medium',
      }),
    )
    expect(await screen.findByText('Session detail')).toBeInTheDocument()
  })

  it('clears the selected Bot through the context close action', async () => {
    renderPage()
    const botName = i18n.t('session.bot.researcher')
    const bot = await screen.findByRole('button', { name: new RegExp(botName) })
    await userEvent.click(bot)
    await userEvent.click(
      screen.getByRole('button', { name: i18n.t('session.rec.removeContext', { name: botName }) }),
    )
    expect(screen.queryByText(i18n.t('session.rec.chatting', { name: botName }))).not.toBeInTheDocument()
  })
})
