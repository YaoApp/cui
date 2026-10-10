import { BrandMark } from '@/components/base/brand-mark'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { Tooltip } from '@/components/base/tooltip'
import { useTranslation } from '@/platform/i18n'
import { useWindowChrome } from '@/platform/client'

export type NavHeaderProps = {
  collapsed: boolean
  onToggle: () => void
}

/* 头部内块：品牌与整列的收起键，右侧留给客户端的窗口控制。这一行**留给客户端**，
   任何导航内容都不许挤占；Web 下不画窗口控制（能力开关）。见 design/main-shell.md §三。 */
export function NavHeader({ collapsed, onToggle }: NavHeaderProps) {
  const { t } = useTranslation()
  const chrome = useWindowChrome()
  const label = collapsed
    ? t('shell.navigation.action.expand')
    : t('shell.navigation.action.collapse')
  return (
    <div className="nav__header" {...chrome.dragProps}>
      <BrandMark name="brand-yao-agents" size={20} label={t('app.name')} />
      <span className="nav__brand">{t('app.name')}</span>
      <Tooltip label={label} side="bottom">
        <Button
          className="nav__toggle"
          iconOnly
          variant="plain"
          size="small"
          aria-label={label}
          aria-expanded={!collapsed}
          onClick={onToggle}
        >
          <Icon name={collapsed ? 'i-expand' : 'i-collapse'} size={16} />
        </Button>
      </Tooltip>
      {chrome.visible ? (
        <span className="nav__window">
          <Button
            iconOnly
            variant="plain"
            size="small"
            aria-label={t('shell.window.minimize')}
            onClick={chrome.minimize}
          >
            <Icon name="i-minus" size={16} />
          </Button>
          <Button
            iconOnly
            variant="plain"
            size="small"
            aria-label={t('shell.window.close')}
            onClick={chrome.close}
          >
            <Icon name="i-act-close" size={16} />
          </Button>
        </span>
      ) : null}
    </div>
  )
}
