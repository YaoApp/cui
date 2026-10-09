/* 服务器选择页：清单、预选、自建、失败重试与 Web 只读，只断言页面上看得见的东西。 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const loadCloudServers = vi.hoisted(() => vi.fn())
const writeServiceAddress = vi.hoisted(() => vi.fn())
const invalidate = vi.hoisted(() => vi.fn())
vi.mock('@/platform/portal', () => ({ loadCloudServers }))
vi.mock('@/platform/service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/platform/service')>()
  return { ...actual, writeServiceAddress, serviceBase: () => '' }
})
vi.mock('@/data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data')>()
  return { ...actual, invalidate }
})

import { i18n } from '@/platform/i18n'
import { client } from '@/platform/client'
import { readServers, rememberServer } from '../server-history'
import { ServersPage } from './servers'

const t = (key: string) => i18n.t(key as never) as unknown as string

const CLOUD = [
  { url: 'https://asia.example.com', name: '官方亚太', slug: 'apac', region: 'APAC' },
  { url: 'https://bj.example.com', name: '官方中国', slug: 'cn', region: 'CN' },
]

function renderServers() {
  return render(
    <MemoryRouter initialEntries={['/servers']}>
      <Routes>
        <Route path="/servers" element={<ServersPage />} />
        <Route path="/login" element={<p>登录页</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('the server page', () => {
  beforeEach(() => {
    vi.mocked(loadCloudServers).mockReset()
    vi.mocked(writeServiceAddress).mockReset()
    invalidate.mockClear()
    localStorage.clear()
    client.capabilities.serviceAddress = true
  })

  afterEach(() => {
    client.capabilities.serviceAddress = false
  })

  it('lists the cloud servers, preselects the first and connects through the host', async () => {
    loadCloudServers.mockResolvedValue({ ok: true, value: CLOUD })
    writeServiceAddress.mockResolvedValue({ ok: true, value: 'https://asia.example.com' })
    const user = userEvent.setup()
    renderServers()

    await waitFor(() => expect(screen.getByRole('combobox', { name: t('auth.servers.selectLabel') })).toHaveTextContent('官方亚太'))
    await user.click(screen.getByRole('button', { name: t('auth.servers.connect') }))

    await waitFor(() => expect(writeServiceAddress).toHaveBeenCalledWith('https://asia.example.com'))
    /* 换地址就是换服务：user 域的数据全部作废，登录页按新地址重取 */
    expect(invalidate).toHaveBeenCalledWith(['user'])
    expect(await screen.findByText('登录页')).toBeTruthy()
    expect(readServers()[0].url).toBe('https://asia.example.com')
  })

  it('preselects the server this machine used last', async () => {
    rememberServer('https://bj.example.com', '官方中国', 5)
    loadCloudServers.mockResolvedValue({ ok: true, value: CLOUD })
    writeServiceAddress.mockResolvedValue({ ok: true, value: 'https://bj.example.com' })
    const user = userEvent.setup()
    renderServers()

    await waitFor(() => expect(screen.getByRole('combobox', { name: t('auth.servers.selectLabel') })).toHaveTextContent('官方中国'))
    await user.click(screen.getByRole('button', { name: t('auth.servers.connect') }))
    await waitFor(() => expect(writeServiceAddress).toHaveBeenCalledWith('https://bj.example.com'))
  })

  it('reveals the address field for a self-hosted server and asks for it', async () => {
    loadCloudServers.mockResolvedValue({ ok: true, value: CLOUD })
    writeServiceAddress.mockResolvedValue({ ok: true, value: 'https://mine.example.com' })
    const user = userEvent.setup()
    renderServers()

    await screen.findByRole('combobox', { name: t('auth.servers.selectLabel') })
    await user.click(screen.getByRole('combobox', { name: t('auth.servers.selectLabel') }))
    await user.click(await screen.findByRole('option', { name: /自建/ }))

    const input = screen.getByPlaceholderText(t('auth.servers.customHint'))
    /* 字段带自己的一档下边距，别和主按钮贴在一起 */
    expect(input.closest('.field')?.className).toContain('servers__custom')
    await user.click(screen.getByRole('button', { name: t('auth.servers.connect') }))
    expect(screen.getByText(t('auth.servers.customRequired'))).toBeTruthy()
    expect(writeServiceAddress).not.toHaveBeenCalled()

    await user.type(input, 'https://mine.example.com')
    expect(screen.queryByText(t('auth.servers.customRequired'))).toBeNull()
    await user.click(screen.getByRole('button', { name: t('auth.servers.connect') }))
    await waitFor(() => expect(writeServiceAddress).toHaveBeenCalledWith('https://mine.example.com'))
  })

  it('keeps a retry when the cloud list cannot be loaded', async () => {
    loadCloudServers.mockResolvedValue({ ok: false, code: 'transport.status', params: {}, message: 'boom' })
    const user = userEvent.setup()
    renderServers()

    const retry = await screen.findByRole('button', { name: t('auth.servers.retry') })
    loadCloudServers.mockResolvedValue({ ok: true, value: CLOUD })
    await user.click(retry)

    expect(await screen.findByText('官方亚太')).toBeTruthy()
  })

  it('shows the reason when the host refuses the address', async () => {
    loadCloudServers.mockResolvedValue({ ok: true, value: CLOUD })
    writeServiceAddress.mockResolvedValue({ ok: false, code: 'service.notAService', params: {}, message: 'not a service' })
    const user = userEvent.setup()
    renderServers()

    await screen.findByRole('combobox', { name: t('auth.servers.selectLabel') })
    await user.click(screen.getByRole('button', { name: t('auth.servers.connect') }))

    expect(await screen.findByRole('alert')).toHaveTextContent(t('bridge.error.service.notAService'))
    expect(screen.queryByText('登录页')).toBeNull()
  })

  it('offers the self-hosted field when the cloud list is empty', async () => {
    loadCloudServers.mockResolvedValue({ ok: true, value: [] })
    renderServers()

    expect(await screen.findByText(t('auth.servers.empty'))).toBeTruthy()
    expect(screen.getByRole('combobox', { name: t('auth.servers.selectLabel') })).toBeTruthy()
  })

  it('fills the self-hosted field with the address this machine used last when the list does not have it', async () => {
    rememberServer('https://mine.example.com', undefined, 5)
    loadCloudServers.mockResolvedValue({ ok: true, value: CLOUD })
    writeServiceAddress.mockResolvedValue({ ok: true, value: 'https://mine.example.com' })
    const user = userEvent.setup()
    renderServers()

    /* 记过的地址不在清单里：回填到自建那一格，而不是被清单里的第一台顶掉 */
    expect((await screen.findByDisplayValue('https://mine.example.com')) as HTMLInputElement).toBeTruthy()
    await user.click(screen.getByRole('button', { name: t('auth.servers.connect') }))
    await waitFor(() => expect(writeServiceAddress).toHaveBeenCalledWith('https://mine.example.com'))
  })

  it('keeps the self-hosted field usable when the cloud list cannot be loaded', async () => {
    loadCloudServers.mockResolvedValue({ ok: false, code: 'transport.status', params: {}, message: 'boom' })
    const user = userEvent.setup()
    renderServers()

    await screen.findByRole('button', { name: t('auth.servers.retry') })
    const input = screen.getByPlaceholderText(t('auth.servers.customHint')) as HTMLInputElement
    expect(input.value).toBe('')
    /* 连接按钮不能是个按了没反应的按钮：没填地址要出字段提示，填了要交给宿主 */
    await user.click(screen.getByRole('button', { name: t('auth.servers.connect') }))
    expect(screen.getByText(t('auth.servers.customRequired'))).toBeTruthy()
    expect(writeServiceAddress).not.toHaveBeenCalled()

    await user.type(input, 'https://mine.example.com')
    /* 重试入口还在：失败态既能手填，也能再取一次清单 */
    expect(screen.getByRole('button', { name: t('auth.servers.retry') })).toBeTruthy()
    writeServiceAddress.mockResolvedValue({ ok: true, value: 'https://mine.example.com' })
    await user.click(screen.getByRole('button', { name: t('auth.servers.connect') }))
    await waitFor(() => expect(writeServiceAddress).toHaveBeenCalledWith('https://mine.example.com'))
  })

  it('only reads the address on the web, where the deployment decides it', async () => {
    client.capabilities.serviceAddress = false
    renderServers()

    expect(await screen.findByText(t('auth.servers.webLead'))).toBeTruthy()
    expect(screen.queryByRole('combobox', { name: t('auth.servers.selectLabel') })).toBeNull()
    expect(screen.queryByRole('button', { name: t('auth.servers.connect') })).toBeNull()
    expect(loadCloudServers).not.toHaveBeenCalled()
  })
})
