import { fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar } from './avatar'

describe('Avatar', () => {
  it('falls back to the first letter and keeps it upper case', () => {
    const { container } = render(<Avatar name="mock user" />)
    expect(container.querySelector('.avatar__initial')?.textContent).toBe('M')
  })

  it('keeps the first character of a CJK name', () => {
    const { container } = render(<Avatar name="王小明" />)
    expect(container.querySelector('.avatar__initial')?.textContent).toBe('王')
  })

  it('uses U when the name is empty', () => {
    const { container } = render(<Avatar name="  " />)
    expect(container.querySelector('.avatar__initial')?.textContent).toBe('U')
  })

  it('draws the image when a source is given and falls back after an error', () => {
    const { container } = render(<Avatar name="Mock" src="https://example.com/a.png" />)
    const image = container.querySelector('.avatar__image')
    expect(image).toBeTruthy()

    fireEvent.error(image!)
    expect(container.querySelector('.avatar__image')).toBeNull()
    expect(container.querySelector('.avatar__initial')?.textContent).toBe('M')
  })

    it('retries when the image source changes after a failure', async () => {
      const { container, rerender } = render(<Avatar name="Mock" src="https://example.com/a.png" />)
      fireEvent.error(container.querySelector('.avatar__image')!)
      expect(container.querySelector('.avatar__image')).toBeNull()

      rerender(<Avatar name="Mock" src="https://example.com/b.png" />)
      await waitFor(() => expect(container.querySelector('.avatar__image')).toBeTruthy())
    })

    it('stacks a team badge with the team initial', () => {
    const { container } = render(<Avatar name="Mock" team={{ name: 'Administrator Team' }} />)
    expect(container.querySelector('.avatar__team')?.textContent).toBe('A')
  })

  it('renders a skeleton while loading and no initial', () => {
    const { container } = render(<Avatar name="Mock" loading />)
    expect(container.querySelector('.avatar')).toHaveClass('avatar--loading')
    expect(container.querySelector('.avatar__initial')).toBeNull()
  })

  it('is decorative unless labelled', () => {
    const { container, rerender } = render(<Avatar name="Mock" />)
    expect(container.querySelector('.avatar')).toHaveAttribute('aria-hidden', 'true')

    rerender(<Avatar name="Mock" label="Mock 的头像" />)
    expect(container.querySelector('.avatar')).toHaveAttribute('role', 'img')
    expect(container.querySelector('.avatar')).toHaveAttribute('aria-label', 'Mock 的头像')
  })
})
