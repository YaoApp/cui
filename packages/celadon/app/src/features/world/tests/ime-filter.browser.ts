import { expect, test, type Page } from '@playwright/test'

/* 场景：用**中文输入法**在「过滤」里打字。
   两件事必须成立：① 组合中按回车**不许误提交**（表单真提交会把查询串清掉，侧边面板随之丢失）
   ② 上屏之后，过滤按**最终文字**生效。

   为什么用原生 setter 再派发事件：React 的受控 input 会记住上一次的值，
   直接改 `el.value` 不会触发 onChange —— 这是模拟输入法的标准做法。 */

async function dispatchComposition(page: Page, type: string, data?: string) {
  await page.evaluate(
    ({ type, data }) => {
      const el = document.querySelector('#world-q') as HTMLInputElement | null
      if (!el) throw new Error('#world-q not found')
      el.dispatchEvent(new CompositionEvent(type, { bubbles: true, data }))
    },
    { type, data },
  )
}

async function typeThroughInput(page: Page, value: string) {
  await page.evaluate((next) => {
    const el = document.querySelector('#world-q') as HTMLInputElement | null
    if (!el) throw new Error('#world-q not found')
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(el, next)
    el.dispatchEvent(new InputEvent('input', { bubbles: true, data: next }))
  }, value)
}

test('composing in the filter does not submit, and the committed text filters', async ({ page }) => {
  await page.goto('/app/world/w1?sideEntity=e2')
  const filter = page.getByLabel('过滤')
  await filter.click()

  // 组合中：拼音进了输入框，但还没上屏
  await dispatchComposition(page, 'compositionstart')
  await typeThroughInput(page, 'gam')
  await dispatchComposition(page, 'compositionupdate', 'gam')
  await expect(filter).toHaveValue('gam')

  // 组合中按回车 —— 不许提交。表单一旦真提交，查询串被清掉，面板会跟着丢
  await filter.press('Enter')
  await expect(page).toHaveURL(/\/app\/world\/w1/)
  await expect(page).toHaveURL(/sideEntity=e2/)
  await expect(page.getByRole('region', { name: '条目面板' })).toBeVisible()

  // 上屏：候选词落地，过滤按最终文字生效
  await dispatchComposition(page, 'compositionend', 'gamma')
  await typeThroughInput(page, 'gamma')

  await expect(filter).toHaveValue('gamma')
  await expect(page).toHaveURL(/q=gamma/)
  await expect(page.getByRole('link', { name: 'Gamma 世界' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Alpha 世界' })).toHaveCount(0)

  // 上屏后仍在同一页、同一个面板：输入法不该把上下文弄丢
  await expect(page.getByRole('region', { name: '条目面板' })).toBeVisible()
})
