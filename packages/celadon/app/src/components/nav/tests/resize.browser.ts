import { expect, test } from '@playwright/test'

/* 导航列宽度可调：拖右缘把手改宽、松手记本机、刷新后还在。
   真实布局与样式在浏览器里才成立，因此这一组只放这里（`design/main-shell.md` §三 第 4 条）。 */

async function markSignedIn(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('celadon.session', JSON.stringify({ [location.origin]: Date.now() }))
  })
}

const navWidth = (page: import('@playwright/test').Page) =>
  page.evaluate(() => Math.round((document.querySelector('.nav') as HTMLElement).getBoundingClientRect().width))

test('drags the navigation column wider and remembers it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await markSignedIn(page)
  await page.goto('/app/inbox')
  await page.waitForTimeout(400)
  expect(await navWidth(page)).toBe(280)

  const handle = page.getByRole('separator', { name: '调整导航列宽度' })
  const box = await handle.boundingBox()
  if (!box) throw new Error('把手没有位置')
  const y = box.y + box.height / 2
  await page.mouse.move(box.x + box.width / 2, y)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 60, y, { steps: 6 })
  await page.mouse.up()
  await page.waitForTimeout(300)
  expect(await navWidth(page)).toBe(340)

  await page.reload()
  await page.waitForTimeout(400)
  expect(await navWidth(page)).toBe(340)
})

test('clamps at the range and resets on a double click', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await markSignedIn(page)
  await page.goto('/app/inbox')
  await page.waitForTimeout(400)

  const handle = page.getByRole('separator', { name: '调整导航列宽度' })
  await handle.focus()
  await page.keyboard.press('End')
  await page.waitForTimeout(300)
  expect(await navWidth(page)).toBe(420)
  await page.keyboard.press('Home')
  await page.waitForTimeout(300)
  expect(await navWidth(page)).toBe(264)
})

test('resets to the default width on a double click', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await markSignedIn(page)
  await page.goto('/app/inbox')
  await page.waitForTimeout(400)

  const handle = page.getByRole('separator', { name: '调整导航列宽度' })
  await handle.focus()
  await page.keyboard.press('Home')
  await page.waitForTimeout(300)
  expect(await navWidth(page)).toBe(264)

  const box = await handle.boundingBox()
  if (!box) throw new Error('把手没有位置')
  /* 用真实浏览器的双击事件触发：Playwright 的 mouse.dblclick 在这套远程环境里到不了这个
     元素（指针刚被捕获过），派发的双击事件与真实双击走同一条处理路径 */
  await handle.evaluate((el) => el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))
  await page.waitForTimeout(400)
  expect(await navWidth(page)).toBe(280)
})
