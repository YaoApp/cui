import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Page, PageCell, PageRow, PageSection } from './page'

describe('the page building blocks', () => {
  it('renders a section heading, a row of cells and the body', () => {
    render(
      <Page>
        <PageSection heading={<span>标题</span>} label="一段">
          <PageRow>
            <PageCell>甲</PageCell>
            <PageCell>乙</PageCell>
          </PageRow>
        </PageSection>
      </Page>,
    )
    expect(screen.getByText('甲').closest('.page__body')).not.toBeNull()
    // 外壳已经有一个 `<main>`：正文容器不许再套一个
    expect(screen.queryByRole('main')).toBeNull()
    expect(screen.getByRole('region', { name: '一段' })).toBeInTheDocument()
    expect(screen.getByText('标题')).toBeInTheDocument()
    expect(screen.getAllByText(/甲|乙/)).toHaveLength(2)
  })
})
