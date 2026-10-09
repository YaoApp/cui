import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { capturePage, shotDir } from '../../../../../scripts/shots.mjs'

/* 服务器选择的 Web 形态：地址由部署决定，只读展示，不画写入控件。
   桌面形态（清单、自建、连接校验）要宿主，开发浏览器里跑不到，见 `servers.test.tsx` 与桌面壳的实跑。 */
const SHOTS = shotDir('servers-page')
const shot = (page: Parameters<typeof capturePage>[0], name: string) => capturePage(page, join(SHOTS, `${name}.png`))

test('shows the deployed address instead of write controls on the web', async ({ page }) => {
  await page.goto('/app/servers')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('选择 Yao Agents 服务器')
  await expect(page.getByText('服务地址由部署决定，这里只展示当前地址。')).toBeVisible()
  await expect(page.locator('.servers__fixed-url')).toHaveText(/^(https?:\/\/)?[^/]+$/)
  await expect(page.getByRole('combobox', { name: '服务器' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '连接' })).toHaveCount(0)

  await shot(page, 'web')
})
