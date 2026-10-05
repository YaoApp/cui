import { test } from '@playwright/test'
const OUT = '/Users/max/tai-nodes/Volumes/ws-2eecb5c7-8c1/app/logs/2026-10-05/shots/welcome'
test('welcome, top row tidy', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.setViewportSize({ width: 1440, height: 900 })
  for (const [q, name] of [['', 'welcome-web'], ['?view=client', 'welcome-client']] as const) {
    await page.goto('http://localhost:8667/prototype/welcome.html' + q, { waitUntil: 'load' })
    await page.waitForTimeout(800)
    const g = await page.evaluate(() => {
      const l = document.getElementById('lang-label') as HTMLElement
      const r = l.getBoundingClientRect()
      return { labelBox: [Math.round(r.width), Math.round(r.height)], oneLine: r.height < 24, isClient: document.body.classList.contains('is-client') }
    })
    console.log('DIAG ' + name + ' ' + JSON.stringify(g))
    await page.screenshot({ path: `${OUT}/${name}.png` })
  }
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark' }); await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT}/welcome-dark.png` })
})
