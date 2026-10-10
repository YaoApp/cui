import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Content } from './content'
import { PlaceholderPage } from './parts/placeholder'

describe('Content', () => {
  it('renders the page inside a scrollable main region', () => {
    render(
      <Content>
        <p>页面内容</p>
      </Content>,
    )
    expect(screen.getByRole('main')).toBeVisible()
    expect(screen.getByText('页面内容')).toBeVisible()
    expect(document.querySelector('.scroll-area__viewport')).not.toBeNull()
  })

  it('renders the placeholder page with its title and hint', () => {
    render(<PlaceholderPage titleKey="shell.navigation.item.board" />)
    expect(screen.getByRole('heading', { name: '看板' })).toBeVisible()
    expect(screen.getByText('这一页还在搭骨架，先用占位')).toBeVisible()
  })
})
