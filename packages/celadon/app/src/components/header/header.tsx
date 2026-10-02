import type { ReactNode } from 'react'
import './header.less'
import { Button } from '@/components/base/button'
import { useTranslation } from '@/platform/i18n'

export type HeaderProps = {
  title: string
  onRefresh?: () => void
  /** 导航等头部内容 —— 头部只提供位置，放什么由调用方决定 */
  children?: ReactNode
}

export function Header({ title, onRefresh, children }: HeaderProps) {
  const { t } = useTranslation()

  return (
    <header className="header">
      <h1 className="header__title">{title}</h1>
      {children ? <div className="header__slot">{children}</div> : null}
      <Button variant="soft" size="small" onClick={onRefresh}>
        {t('header.refresh')}
      </Button>
    </header>
  )
}
