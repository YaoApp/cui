import './browser.less'
import type { ReactNode } from 'react'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { ScrollArea } from '@/components/base/scroll-area'
import { Tooltip } from '@/components/base/tooltip'
import { useTranslation } from '@/platform/i18n'
import type { BrowserSplit } from '@/stores/layout/columns'
import { useSplitResize } from './hooks/use-split-resize'

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
  /** 整栏收成零宽（用户收起，或窗口压窄到最后一档）；样式在 routes/layout.less */
  collapsed?: boolean
  /** 分屏方向：`none` 单面板 · `columns` 左右 · `rows` 上下 */
  split?: BrowserSplit
  /** 栏宽（或栏高）不足以放下两个面板：分栏键禁用，气泡说明原因 */
  splitBlocked?: boolean
  /** 第一个面板占的比例，0.2 到 0.8，0.5 是平分 */
  splitRatio?: number
  onSplitRatio?: (ratio: number) => void
  onSplit?: (split: BrowserSplit) => void
  onActivate: (key: string) => void
  onClose: (key: string) => void
  /** 新建：落在首页的地址栏 */
  onNew: () => void
  onMove: () => void
  onCollapse: () => void
  /** 第一个面板的当前页：由装配层按标签的内容决定 */
  children: ReactNode
  /** 第二个面板的当前页；只有分屏时才渲染 */
  secondary?: ReactNode
}

/* 标签浏览器：顶部标签条（首页固定第一个、新建吸附右端），下面当前页或两个面板。
   标签是全局一套，与会话弱关联（`design/main-shell.md` §五）；标签数据与页内容都由装配层给，
   组件不认识业务（`architecture/03-boundaries.md` §2 的层间方向）。 */
export function Browser({
  tabs,
  activeKey,
  side,
  collapsed = false,
  split = 'none',
  splitBlocked = false,
  splitRatio = 0.5,
  onSplitRatio = () => {},
  onSplit = () => {},
  onActivate,
  onClose,
  onNew,
  onMove,
  onCollapse,
  children,
  secondary = null,
}: BrowserProps) {
  const { t } = useTranslation()
  const { containerRef, dragging, onPointerDown, reset } = useSplitResize(
    split === 'rows' ? 'rows' : 'columns',
    onSplitRatio
  )
  return (
    <aside
      className="browser"
      data-side={side}
      data-split={split}
      data-collapsed={collapsed}
      aria-label={t('shell.browser.label')}
      aria-hidden={collapsed || undefined}
      inert={collapsed || undefined}
    >
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
        <Tooltip
          label={
            splitBlocked && split === 'none'
              ? t('shell.browser.split.blocked')
              : t('shell.browser.split.columns')
          }
          side="bottom"
        >
          <Button
            className="browser__split"
            iconOnly
            variant="ghost"
            size="small"
            disabled={splitBlocked && split === 'none'}
            aria-pressed={split === 'columns'}
            aria-label={t('shell.browser.split.columns')}
            onClick={() => onSplit(split === 'columns' ? 'none' : 'columns')}
          >
            <Icon name="i-split" size={16} />
          </Button>
        </Tooltip>
        <Tooltip
          label={
            splitBlocked && split === 'none'
              ? t('shell.browser.split.blocked')
              : t('shell.browser.split.rows')
          }
          side="bottom"
        >
          <Button
            className="browser__split"
            iconOnly
            variant="ghost"
            size="small"
            disabled={splitBlocked && split === 'none'}
            aria-pressed={split === 'rows'}
            aria-label={t('shell.browser.split.rows')}
            onClick={() => onSplit(split === 'rows' ? 'none' : 'rows')}
          >
            <Icon name="i-split2" size={16} />
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

      {/* 分屏：一层，左右或上下两个面板；单面板时只渲染 children，结构不变。
          第一面板的比例由分隔条拖动给出（跟手，见 hooks/use-split-resize）。 */}
      <div className="browser__body" data-split={split} data-dragging={dragging} ref={containerRef}>
        <div
          className="browser__pane"
          data-focused={split === 'none' || undefined}
          data-sized={split === 'none' ? undefined : 'true'}
          style={
            split === 'none'
              ? undefined
              : split === 'rows'
                ? { blockSize: `${splitRatio * 100}%` }
                : { inlineSize: `${splitRatio * 100}%` }
          }
        >
          <ScrollArea className="browser__page" size="medium" persistent>{children}</ScrollArea>
        </div>
        {split === 'none' ? null : (
          <>
            <div
              className="browser__divider"
              role="separator"
              aria-orientation={split === 'columns' ? 'vertical' : 'horizontal'}
              onPointerDown={onPointerDown}
              onDoubleClick={reset}
            />
            <div className="browser__pane">
              <ScrollArea className="browser__page" size="medium" persistent>{secondary}</ScrollArea>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
