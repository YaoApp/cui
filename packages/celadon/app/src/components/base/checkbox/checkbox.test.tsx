import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox } from '@/components/base/checkbox'

describe('Checkbox', () => {
  it('associates the label with the control and carries the design class', () => {
    const { container } = render(<Checkbox id="updates" label="接收更新通知" />)
    const control = screen.getByRole('checkbox', { name: '接收更新通知' })

    expect(control).toHaveClass('checkbox__box')
    expect(control).toHaveAttribute('aria-labelledby', 'updates-label')
    /* `id` 落在上游渲染的原生控件上，标签的 htmlFor 指的就是它 */
    expect(container.querySelector('input[type="checkbox"]')).toHaveAttribute('id', 'updates')
    expect(container.querySelector('.checkbox__label')).toHaveAttribute('id', 'updates-label')
  })

  it('reports the toggled value', async () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox id="updates" label="接收更新通知" onCheckedChange={onCheckedChange} />)

    await userEvent.click(screen.getByRole('checkbox', { name: '接收更新通知' }))

    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything())
  })

  it('toggles from the keyboard', async () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox id="updates" label="接收更新通知" onCheckedChange={onCheckedChange} />)

    await userEvent.tab()
    const control = screen.getByRole('checkbox', { name: '接收更新通知' })
    expect(control).toHaveFocus()

    await userEvent.keyboard(' ')
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything())
  })

  it('reflects the checked prop on the accessible state', () => {
    render(<Checkbox id="updates" label="接收更新通知" checked onCheckedChange={() => {}} />)

    expect(screen.getByRole('checkbox', { name: '接收更新通知' })).toBeChecked()
  })

  it('exposes the mixed state while indeterminate', () => {
    /* 不确定态既非选中也非未选，可访问状态要如实表达，不能只说"未选中" */
    render(<Checkbox id="partial" label="部分选中" indeterminate />)

    expect(screen.getByRole('checkbox', { name: '部分选中' })).toHaveAttribute('aria-checked', 'mixed')
  })

  it('does not call back while disabled', async () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox id="updates" label="接收更新通知" disabled onCheckedChange={onCheckedChange} />)
    const control = screen.getByRole('checkbox', { name: '接收更新通知' })

    await userEvent.click(control)

    /* 上游把禁用表达为 aria-disabled 加 data-disabled，并把控件移出 Tab 序，不是原生 disabled 属性 */
    expect(control).toHaveAttribute('aria-disabled', 'true')
    expect(control).toHaveAttribute('data-disabled', '')
    expect(control).toHaveAttribute('tabindex', '-1')
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it('leaves a read-only control focusable but unchanged', async () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox id="updates" label="接收更新通知" readOnly checked onCheckedChange={onCheckedChange} />)
    const control = screen.getByRole('checkbox', { name: '接收更新通知' })

    await userEvent.click(control)

    expect(control).toHaveAttribute('aria-readonly', 'true')
    expect(control).toBeChecked()
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it('links the hint and the error text through aria-describedby', () => {
    render(<Checkbox id="updates" label="接收更新通知" hint="显示在字段下方" error="必选" />)
    const control = screen.getByRole('checkbox', { name: '接收更新通知' })

    expect(control).toHaveAttribute('aria-describedby', 'updates-hint updates-error')
    expect(screen.getByText('显示在字段下方')).toHaveClass('checkbox__hint')
    expect(screen.getByText('必选')).toHaveClass('checkbox__error')
  })

  it('marks the box when it carries an error', () => {
    render(<Checkbox id="updates" label="接收更新通知" error="必选" />)

    expect(screen.getByRole('checkbox', { name: '接收更新通知' })).toHaveClass('is-error')
  })

  it('puts the static state class on the box, not on the row', () => {
    /* 设计类的规则都写在方框上；加在行上不会生效（这是清单页并排展示多态的前提） */
    const { container } = render(<Checkbox id="updates" label="is-hover" state="hover" />)
    const box = screen.getByRole('checkbox', { name: 'is-hover' })

    expect(box).toHaveClass('checkbox__box', 'is-hover')
    expect(container.querySelector('.checkbox__row')).not.toHaveClass('is-hover')
  })

  it('exposes the busy state while loading', () => {
    render(<Checkbox id="updates" label="is-loading" state="loading" />)
    const control = screen.getByRole('checkbox', { name: 'is-loading' })

    expect(control).toHaveClass('is-loading')
    expect(control).toHaveAttribute('aria-busy', 'true')
  })

  it('carries the size class on the field', () => {
    const { container } = render(<Checkbox id="updates" label="large" size="large" />)

    expect(container.querySelector('.checkbox')).toHaveClass('checkbox--large')
  })

  it('takes the static error class on the box', () => {
    render(<Checkbox id="updates" label="is-error" state="error" />)

    expect(screen.getByRole('checkbox', { name: 'is-error' })).toHaveClass('is-error')
  })

  it('takes the mark out of the accessibility tree', () => {
    /* 选中与否由控件的可访问状态表达，勾只是装饰 */
    const { container } = render(<Checkbox id="updates" label="接收更新通知" defaultChecked />)

    expect(container.querySelector('.checkbox__mark svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('draws a bar instead of the tick while indeterminate', () => {
    const { container } = render(<Checkbox id="partial" label="部分选中" indeterminate />)

    expect(container.querySelector('.checkbox__dash')).not.toBeNull()
    expect(container.querySelector('.checkbox__mark svg')).toBeNull()
  })

  it('renders without a label', () => {
    const { container } = render(<Checkbox id="bare" />)

    expect(screen.getByRole('checkbox')).toHaveClass('checkbox__box')
    expect(container.querySelector('.checkbox__label')).toBeNull()
  })
})
