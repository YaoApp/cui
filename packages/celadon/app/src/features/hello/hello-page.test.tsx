import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { HelloPage } from '@/features/hello'

/* 这条走的是完整链路：base/button → header → feature store → 私有组件 foo-bar */
describe('HelloPage', () => {
  it('clicking refresh moves the counter on the page', async () => {
    render(<HelloPage />)
    expect(screen.getByText('已刷新 0 次')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '刷新' }))

    expect(screen.getByText('已刷新 1 次')).toBeInTheDocument()
  })
})

describe('HelloPage · theme', () => {
  it('switches the page theme through the toggle', async () => {
    render(<HelloPage />)
    expect(document.documentElement.dataset.theme).toBe('light')

    await userEvent.click(screen.getByRole('button', { name: '切到深色' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(screen.getByRole('button', { name: '切到浅色' })).toBeInTheDocument()
  })
})
