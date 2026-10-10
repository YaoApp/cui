import './browser.less'
import type { ReactNode } from 'react'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { ScrollArea } from '@/components/base/scroll-area'
import { Tooltip } from '@/components/base/tooltip'
import { useTranslation } from '@/platform/i18n'

export type BrowserTab = {
  /** 一页的稳定标识 */
  key: string
  /** 标签上显示的名字 */
  label: string
  /** 首页不可关 */
  closable: boolean
}

export type BrowserProps = {
  tabs: BrowserTab[]
  activeKey: string
  side: 'right' | 'left'
  onActivate: (key: string) => void
  onClose: (key: string) => void
  /** 新建：落在首页的地址栏 */
  onNew: () => void
  onMove: () => void
  onCollapse: () => void
  /** 当前页：由装配层按标签的内容决定 */
  children: ReactNode
}

/* 标签浏览器：顶部标签条（首页固定第一个、新建吸附右端），下面是当前页。
   标签是全局一套，与会话弱关联（`design/main-shell.md` §五）；标签数据与页内容都由装配层给，
   组件不认识业务（`architecture/03-boundaries.md` §2 的层间方向）。 */
export function Browser({
  tabs,
  activeKey,
  side,
  onActivate,
  onClose,
  onNew,
  onMove,
  onCollapse,
  children,
}: BrowserProps) {
  const { t } = useTranslation()
  return (
    <aside className="browser" data-side={side} aria-label={t('shell.browser.label')}>
      <div className="browser__bar">
        <ScrollArea className="browser__tabs" size="small">
          <div className="browser__tabs-row" role="tablist" aria-label={t('shell.browser.label')}>
            {tabs.map((tab) => (
              <span className="browser__tab" key={tab.key}>
                <Button
                  className="browser__tab-button"
                  variant="ghost"
                  size="small"
                  role="tab"
                  aria-selected={tab.key === activeKey}
                  onClick={() => onActivate(tab.key)}
                >
                  <Icon name={tab.closable ? 'i-globe' : 'i-home'} size={16} />
                  <span className="browser__tab-label">{tab.label}</span>
                </Button>
                {tab.closable ? (
                  <Tooltip label={t('shell.browser.tab.close')} side="bottom">
                    <Button
                      className="browser__tab-close"
                      iconOnly
                      variant="ghost"
                      size="small"
                      aria-label={t('shell.browser.tab.close')}
                      onClick={() => onClose(tab.key)}
                    >
                      <Icon name="i-act-close" size={14} />
                    </Button>
                  </Tooltip>
                ) : null}
              </span>
            ))}
          </div>
        </ScrollArea>
        <Tooltip label={t('shell.browser.tab.new')} side="bottom">
          <Button
            className="browser__new"
            iconOnly
            variant="ghost"
            size="small"
            aria-label={t('shell.browser.tab.new')}
            onClick={onNew}
          >
            <Icon name="i-plus" size={16} />
          </Button>
        </Tooltip>
        <Tooltip label={t('shell.browser.action.move')} side="bottom">
          <Button
            className="browser__move"
            iconOnly
            variant="ghost"
            size="small"
            aria-label={t('shell.browser.action.move')}
            onClick={onMove}
          >
            <Icon name="i-split" size={16} />
          </Button>
        </Tooltip>
        <Tooltip label={t('shell.browser.action.collapse')} side="bottom">
          <Button
            className="browser__collapse"
            iconOnly
            variant="ghost"
            size="small"
            aria-label={t('shell.browser.action.collapse')}
            onClick={onCollapse}
          >
            <Icon name="i-panel-right" size={16} />
          </Button>
        </Tooltip>
      </div>

      <ScrollArea className="browser__page" size="medium" persistent>{children}</ScrollArea>
    </aside>
  )
}
