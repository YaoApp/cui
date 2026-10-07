/* 条款勾选：只给一个链接时不出现连接词，勾选与错误都由调用方驱动。 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { i18n } from '@/platform/i18n'
import { TermsNote } from './terms-note'

const t = (key: string) => i18n.t(key as never) as unknown as string

describe('the terms note', () => {
  it('shows both links with the conjunction when the configuration gives both', () => {
    render(<TermsNote id="terms" checked={false} onCheckedChange={() => undefined} serviceHref="/terms" privacyHref="/privacy" />)
    expect(screen.getByRole('link', { name: t('auth.terms.service') }).getAttribute('href')).toBe('/terms')
    expect(screen.getByRole('link', { name: t('auth.terms.privacy') }).getAttribute('href')).toBe('/privacy')
    expect(screen.getByText(t('auth.terms.and'))).toBeTruthy()
  })

  it('drops the conjunction when only one link is configured', () => {
    render(<TermsNote id="terms" checked={false} onCheckedChange={() => undefined} privacyHref="/privacy" />)
    expect(screen.getByRole('link', { name: t('auth.terms.privacy') })).toBeTruthy()
    expect(screen.queryByText(t('auth.terms.and'))).toBeNull()
  })

  it('reports the check and shows the message from the caller', async () => {
    const onCheckedChange = vi.fn()
    const user = userEvent.setup()
    render(
      <TermsNote id="terms" checked={false} onCheckedChange={onCheckedChange} error="请先同意" privacyHref="/privacy" />,
    )
    expect(screen.getByText('请先同意')).toBeTruthy()
    await user.click(screen.getByRole('checkbox'))
    expect(onCheckedChange.mock.calls[0][0]).toBe(true)
  })
})
