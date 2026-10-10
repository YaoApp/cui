import { useTranslation } from '@/platform/i18n'

export type WebProps = {
  /** 外部地址：原样展示，骨架阶段不抓取内容 */
  address: string
}

/* 外部地址页：地址栏在顶部（见 design/main-shell.md §五），内容先占位。 */
export function Web({ address }: WebProps) {
  const { t } = useTranslation()
  return (
    <div className="browser__web">
      <p className="browser__address-line">{address}</p>
      <p className="browser__hint">{t('shell.browser.web.hint')}</p>
    </div>
  )
}
