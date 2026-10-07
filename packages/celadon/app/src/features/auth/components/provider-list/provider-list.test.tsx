/* 第三方入口：一项一行，品牌图标 / 配置给的图片 / 通用图标三条路，点击把整个提供方交回调用方。 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { i18n } from '@/platform/i18n'
import type { SigninProvider } from '@/data/user'
import { ProviderList } from './provider-list'

const t = (key: string, options?: Record<string, unknown>) =>
  i18n.t(key as never, options as never) as unknown as string

const google: SigninProvider = { id: 'google', label: '谷歌', title: '使用谷歌账号登录', logo: '/assets/brands/google.svg' }
const github: SigninProvider = { id: 'github', label: 'Github', title: '使用 Github 账号登录' }
const unknown: SigninProvider = { id: 'gitlab', label: 'GitLab', title: '使用 GitLab 账号登录', logo: '/assets/brands/gitlab.svg' }
const unknownWithoutMark: SigninProvider = { id: 'bitbucket', label: 'Bitbucket', title: '使用 Bitbucket 账号登录' }

describe('the provider list', () => {
  it('renders nothing when no provider is configured', () => {
    const { container } = render(<ProviderList providers={[]} onPick={() => undefined} />)
    expect(container.querySelector('.provider-list')).toBeNull()
  })

  it('renders one row per provider with its own wording', () => {
    render(<ProviderList providers={[google, github]} onPick={() => undefined} />)
    expect(screen.getByRole('button', { name: t('auth.provider.continueWith', { provider: '谷歌' }) })).toBeTruthy()
    expect(screen.getByRole('button', { name: t('auth.provider.continueWith', { provider: 'Github' }) })).toBeTruthy()
  })

  it('matches the brand mark by provider id, then the configured image, then a generic icon', () => {
    render(<ProviderList providers={[google, github, unknown, unknownWithoutMark]} onPick={() => undefined} />)
    const markOf = (label: string) =>
      screen
        .getByRole('button', { name: t('auth.provider.continueWith', { provider: label }) })
        .querySelector('.provider-list__mark') as HTMLElement

    /* google 与 github 认得出：走产品品牌图标（标记本身就是 svg），配置里的图片地址不再使用 */
    for (const label of ['谷歌', 'Github']) {
      const mark = markOf(label)
      expect(mark.tagName.toLowerCase()).toBe('svg')
      expect(mark.querySelector('use')?.getAttribute('href')).toMatch(/^#brand-/)
      expect(mark.querySelector('img')).toBeNull()
    }
    /* 认不出的提供方：先用配置给的图片（标记本身就是 img） */
    const configured = markOf('GitLab')
    expect(configured.tagName.toLowerCase()).toBe('img')
    expect(configured.getAttribute('src')).toBe('/assets/brands/gitlab.svg')
    /* 图与品牌都没有：退回通用图标 */
    const fallback = markOf('Bitbucket')
    expect(fallback.tagName.toLowerCase()).toBe('span')
    expect(fallback.querySelector('.icon')).toBeTruthy()
  })

  it('hands the picked provider back to the caller', async () => {
    const onPick = vi.fn()
    const user = userEvent.setup()
    render(<ProviderList providers={[google]} onPick={onPick} />)
    await user.click(screen.getByRole('button', { name: t('auth.provider.continueWith', { provider: '谷歌' }) }))
    expect(onPick).toHaveBeenCalledWith(google)
  })

  it('disables every row while a request is on its way', () => {
    render(<ProviderList providers={[google, github]} onPick={() => undefined} pending />)
    for (const button of screen.getAllByRole('button')) expect((button as HTMLButtonElement).disabled).toBe(true)
  })
})
