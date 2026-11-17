import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '@/components/base/button'
import { i18n } from '@/platform/i18n'
import { MessageList } from './message-list'
import type { MessageItem } from './types'

const messages: MessageItem[] = [
  { id: 'u1', role: 'user', content: 'Review this change' },
  { id: 'a1', role: 'assistant', content: 'The transport looks consistent.', kind: 'text' },
]

describe('MessageList', () => {
  it('renders a custom empty state without inventing message rows', () => {
    render(<MessageList messages={[]} empty={<span>Nothing here</span>} />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('renders user and assistant messages in order', () => {
    render(<MessageList messages={messages} />)
    expect(screen.getByText('Review this change')).toBeInTheDocument()
    expect(screen.getByText('The transport looks consistent.')).toBeInTheDocument()
    expect(screen.getByRole('list').children).toHaveLength(2)
  })

  it('offers pagination and calls back once', async () => {
    const onLoadMore = vi.fn()
    render(<MessageList messages={messages} hasMore onLoadMore={onLoadMore} />)
    await userEvent.click(screen.getByRole('button', { name: i18n.t('messageList.loadMore') }))
    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('places actions only where the renderer returns a node', () => {
    render(
      <MessageList
        messages={messages}
        renderActions={(message) =>
          message.role === 'assistant' ? <Button>Copy</Button> : null
        }
      />,
    )
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('shows the loading state before the first page arrives', () => {
    render(<MessageList messages={[]} loading />)
    expect(screen.getByRole('status')).toHaveTextContent(i18n.t('messageList.loading'))
  })
})
