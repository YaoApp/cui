import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/base/button'
import { Tooltip } from './tooltip'

/* 提示的浮层要靠真实布局与指针事件，jsdom 里量不出来，因此这里只钉住触发元素这一侧：
   触发元素照常可聚焦、可访问名不被提示顶掉。浮层本身在浏览器用例里验。 */
describe('Tooltip', () => {
  it('keeps the trigger accessible name intact', () => {
    render(
      <Tooltip label="标签页">
        <Button iconOnly aria-label="标签页">
          页
        </Button>
      </Tooltip>,
    )
    const trigger = screen.getByRole('button', { name: '标签页' })
    expect(trigger).toBeVisible()
  })
})
