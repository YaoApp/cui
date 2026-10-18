import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SettingsShell } from './settings-shell'

describe('SettingsShell', () => {
  it('shows the three entry sections and the placeholder', () => {
    render(<SettingsShell open section='profile' onOpenChange={vi.fn()} onSection={vi.fn()} />)

    expect(screen.getByRole('button', { name: '个人资料' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: '团队管理' })).toBeVisible()
    expect(screen.getByRole('button', { name: '用量与套餐' })).toBeVisible()
    expect(screen.getByRole('heading', { name: '个人资料' })).toBeVisible()
    expect(screen.getByText('暂无设置项。')).toBeVisible()
  })

  it('reports the section the user picks', async () => {
    const onSection = vi.fn()
    render(<SettingsShell open section='profile' onOpenChange={vi.fn()} onSection={onSection} />)

    await userEvent.click(screen.getByRole('button', { name: '团队管理' }))
    expect(onSection).toHaveBeenCalledWith('team')
  })

  it('focuses the current section and moves between sections with arrow keys', async () => {
    const onSection = vi.fn()
    render(<SettingsShell open section='profile' onOpenChange={vi.fn()} onSection={onSection} />)

    const profile = screen.getByRole('button', { name: '个人资料' })
    await waitFor(() => expect(document.activeElement).toBe(profile))
    await userEvent.keyboard('{ArrowDown}')
    expect(onSection).toHaveBeenCalledWith('team')
    expect(document.activeElement).toHaveTextContent('团队管理')
  })

  it('closes from the close key', async () => {
    const onOpenChange = vi.fn()
    render(<SettingsShell open section='usage' onOpenChange={onOpenChange} onSection={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: '关闭设置' }))
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false)
  })
})
