import { render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { UserMenu, type UserMenuProps } from './user-menu'

const links = { home: 'https://yaoagents.com', help: 'https://yaoagents.com/docs', docs: 'https://yaoagents.com/docs/x' }

function setup(props: Partial<UserMenuProps> = {}) {
  const handlers = {
    onOpenSettings: vi.fn(),
    onOpenExternal: vi.fn(),
    onSignOut: vi.fn().mockResolvedValue(true),
    onSignIn: vi.fn(),
    onRetry: vi.fn(),
  }
  render(
    <UserMenu
      status='ready'
      name='Mock OAuth User'
      plan='体验版'
      teamName="Administrator's Team"
      usage={{ remaining: 902467, upgradeUrl: 'https://yaoagents.com/pricing' }}
      shortcut='⌘,'
      links={links}
      {...handlers}
      {...props}
    />
  )
  return handlers
}

describe('UserMenu', () => {
  it('shows the identity, plan, usage and team after opening', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /账户菜单/ }))

    expect(await screen.findByText('体验版')).toBeVisible()
    expect(screen.getByText('902,467 积分')).toBeVisible()
    expect(screen.getByText("Administrator's Team")).toBeVisible()
    expect(screen.getByText('⌘,')).toBeVisible()
  })

  it('opens settings at the section chosen', async () => {
    const handlers = setup()
    await userEvent.click(screen.getByRole('button', { name: /账户菜单/ }))
    await userEvent.click(await screen.findByText('团队'))
    expect(handlers.onOpenSettings).toHaveBeenCalledWith('team')
  })

  it('hands external links to the opener', async () => {
    const handlers = setup()
    await userEvent.click(screen.getByRole('button', { name: /账户菜单/ }))
    await userEvent.click(await screen.findByText('首页'))
    expect(handlers.onOpenExternal).toHaveBeenCalledWith(links.home)
  })

  it('opens the upgrade url from the inverted small button', async () => {
    const handlers = setup()
    await userEvent.click(screen.getByRole('button', { name: /账户菜单/ }))
    const upgrade = await screen.findByText('升级')
    expect(upgrade.closest('button')).toHaveClass('button--inverse', 'button--small')

    await userEvent.click(upgrade)
    expect(handlers.onOpenExternal).toHaveBeenCalledWith('https://yaoagents.com/pricing')
  })

  it('asks before signing out and only then calls the handler', async () => {
    const handlers = setup()
    await userEvent.click(screen.getByRole('button', { name: /账户菜单/ }))
    await userEvent.click(await screen.findByText('退出登录'))

    expect(await screen.findByText('退出登录？')).toBeVisible()
    expect(handlers.onSignOut).not.toHaveBeenCalled()

    const dialog = screen.getByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: '取消' }))
    expect(handlers.onSignOut).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: /账户菜单/ }))
    await userEvent.click(await screen.findByText('退出登录'))
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '退出登录' }))
    expect(handlers.onSignOut).toHaveBeenCalled()
  })

  it('keeps the confirmation open and reports a failed sign-out', async () => {
    const onSignOut = vi.fn().mockResolvedValue(false)
    setup({ onSignOut })
    await userEvent.click(screen.getByRole('button', { name: /账户菜单/ }))
    await userEvent.click(await screen.findByText('退出登录'))
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '退出登录' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('退出失败，请重试。')
    expect(screen.getByRole('alertdialog')).toBeVisible()
    expect(onSignOut).toHaveBeenCalled()
  })

  it('blocks both confirmation actions while sign-out is running', async () => {
    const onSignOut = vi.fn(() => new Promise<boolean>(() => undefined))
    setup({ onSignOut })
    await userEvent.click(screen.getByRole('button', { name: /账户菜单/ }))
    await userEvent.click(await screen.findByText('退出登录'))
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '退出登录' }))

    const dialog = screen.getByRole('alertdialog')
    expect(within(dialog).getByRole('button', { name: '正在退出…' })).toBeDisabled()
    expect(within(dialog).getByRole('button', { name: '取消' })).toBeDisabled()
  })

  it('shows a skeleton while loading', async () => {
    setup({ status: 'loading', name: '', plan: '' })
    await userEvent.click(screen.getByRole('button', { name: /账户菜单/ }))
    expect(await screen.findByText('用量')).toBeVisible()
    expect(screen.queryByText('Mock OAuth User')).toBeNull()
  })

  it('keeps the links when the account is unavailable and retries from the identity row', async () => {
    const handlers = setup({ status: 'unavailable' })
    await userEvent.click(screen.getByRole('button', { name: /账户菜单/ }))
    const menu = await screen.findByRole('menu')
    expect(within(menu).getByText('账户不可用')).toBeVisible()
    expect(within(menu).getByText('重试')).toBeVisible()
    expect(within(menu).getByText('首页')).toBeVisible()
    expect(within(menu).getByText('设置')).toBeVisible()
    expect(within(menu).getByText('退出登录')).toBeVisible()

    await userEvent.click(within(menu).getByText('账户不可用'))
    expect(handlers.onRetry).toHaveBeenCalled()
  })

  it('goes straight to sign in when signed out', async () => {
    const handlers = setup({ status: 'signedOut', name: '' })
    const button = screen.getByRole('button', { name: '未登录，去登录' })
    expect(button).toHaveTextContent('未登录')
    await userEvent.click(button)
    expect(handlers.onSignIn).toHaveBeenCalled()
  })
})
