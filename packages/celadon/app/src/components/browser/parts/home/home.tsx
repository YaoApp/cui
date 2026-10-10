import { useState } from 'react'
import { Button } from '@/components/base/button'
import { Input } from '@/components/base/input'
import { useTranslation } from '@/platform/i18n'

export type HomeRecent = {
  key: string
  label: string
}

export type HomeProps = {
  /** 这一侧已经打开的页（不含首页） */
  recent: HomeRecent[]
  /** 打开一页外部地址：由外层开标签并激活 */
  onOpenAddress: (address: string) => void
}

/* 首页：这一侧打开过的东西与打开外部地址的入口（见 design/main-shell.md §五）。
   骨架阶段"打开过的东西"只有已打开的标签，持久的历史随后接。 */
export function Home({ recent, onOpenAddress }: HomeProps) {
  const { t } = useTranslation()
  const [address, setAddress] = useState('')

  return (
    <div className="browser__home">
      <form
        className="browser__address"
        onSubmit={(event) => {
          event.preventDefault()
          const value = address.trim()
          if (!value) return
          onOpenAddress(value)
          setAddress('')
        }}
      >
        <Input
          id="browser-address"
          label={t('shell.browser.address.label')}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder={t('shell.browser.address.placeholder')}
        />
        <Button type="submit" variant="soft" size="small">
          {t('shell.browser.tab.new')}
        </Button>
      </form>
      <div className="browser__recent">
        <h2 className="browser__recent-title">{t('shell.browser.recent')}</h2>
        {recent.length === 0 ? (
          <p className="browser__hint">{t('shell.browser.recent.empty')}</p>
        ) : (
          <ul className="browser__recent-list">
            {recent.map((item) => (
              <li key={item.key} className="browser__recent-item">
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
