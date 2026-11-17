import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { i18n } from '@/platform/i18n'
import { Chatbox } from './chatbox'

function renderChatbox(overrides: Partial<Parameters<typeof Chatbox>[0]> = {}) {
  return render(
    <Chatbox
      messages={[]}
      value=''
      onValueChange={() => {}}
      onSubmit={() => {}}
      {...overrides}
    />,
  )
}

describe('Chatbox', () => {
  it('submits on Enter and keeps Shift+Enter for a new line', async () => {
    const onSubmit = vi.fn()
    renderChatbox({ value: 'Review this change', canSend: true, onSubmit })
    const input = screen.getByRole('textbox')
    await userEvent.click(input)
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}')
    expect(onSubmit).not.toHaveBeenCalled()
    await userEvent.keyboard('{Enter}')
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('requires the platform modifier when submitKey is mod-enter', async () => {
    const onSubmit = vi.fn()
    renderChatbox({ value: 'Draft', canSend: true, submitKey: 'mod-enter', onSubmit })
    const input = screen.getByRole('textbox')
    await userEvent.click(input)
    await userEvent.keyboard('{Enter}')
    expect(onSubmit).not.toHaveBeenCalled()
    await userEvent.keyboard('{Control>}{Enter}{/Control}')
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('renders only the composer when history is disabled', () => {
    renderChatbox({ value: 'Draft', showHistory: false, empty: <span>Welcome</span> })
    expect(screen.queryByText('Welcome')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows stop instead of send while a turn is streaming', async () => {
    const onStop = vi.fn()
    renderChatbox({ streaming: true, onStop })
    await userEvent.click(screen.getByRole('button', { name: i18n.t('chatbox.stop') }))
    expect(onStop).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: i18n.t('chatbox.send') })).not.toBeInTheDocument()
  })

  it('keeps input ids unique when the content and browser surfaces are open together', () => {
    renderChatbox({ value: 'one' })
    renderChatbox({ value: 'two' })
    const inputs = screen.getAllByRole('textbox')
    expect(inputs[0].id).not.toBe(inputs[1].id)
  })

  it('exposes attachments with a remove action', async () => {
    const onRemoveAttachment = vi.fn()
    renderChatbox({
      attachments: [{ id: 'a1', name: 'contract.pdf' }],
      onRemoveAttachment,
    })
    await userEvent.click(
      screen.getByRole('button', {
        name: i18n.t('chatbox.removeAttachment', { name: 'contract.pdf' }),
      }),
    )
    expect(onRemoveAttachment).toHaveBeenCalledWith('a1')
  })
})
