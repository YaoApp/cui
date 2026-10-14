import './browser.less'
import { useEffect, useState, type ReactNode } from 'react'
import { Menu as BaseMenu } from '@base-ui/react/menu'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { ScrollArea } from '@/components/base/scroll-area'
import { Tooltip } from '@/components/base/tooltip'
import { useTranslation } from '@/platform/i18n'
import type { BrowserSplit } from '@/stores/layout/columns'
import { BrowserTabs } from './parts/tabs'
import type { BrowserTab } from './types'
import { useSplitResize } from './hooks/use-split-resize'
import { useColumnResize } from './hooks/use-column-resize'

export type { BrowserTab } from './types'

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
  /** 整栏宽度（像素）。null 表示跟随 token 默认宽，用户拖过分界线才有值 */
  width?: number | null
  onWidth?: (width: number | null) => void
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
  /** 第二个面板那一页的名字，画在它自己的小条上 */
  secondaryLabel?: string
  /** 聚焦哪个面板（0 是第一个）：标签条的点击落在聚焦的那个面板上 */
  focusedPane?: number
  onFocusPane?: (pane: number) => void
  /** 面板独占整扇窗口：导航区与内容区让位，只留这一栏（与窗口自身的最大化不是一件事） */
  exclusive?: boolean
  onExclusive?: () => void
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
  width = null,
  onWidth = () => {},
  onActivate,
  onClose,
  onNew,
  onMove,
  onCollapse,
  children,
  secondary = null,
  secondaryLabel = '',
  focusedPane = 0,
  onFocusPane = () => {},
  exclusive = false,
  onExclusive = () => {},
}: BrowserProps) {
  const { t } = useTranslation()
  const splitResize = useSplitResize(
    split === 'rows' ? 'rows' : 'columns',
    splitRatio,
    onSplitRatio
  )
  const columnResize = useColumnResize(width, onWidth, side)
  /* 分屏能不能开，按**本栏实宽**判：宽度由分界线拖出来，窗口宽只是其中一半条件。
     两个长度 token 从 `.celadon` 上读一次（默认宽与最小宽），读不到就用回退值 */
  const [limits, setLimits] = useState({ defaultWidth: 400, sideMin: 300 })
  useEffect(() => {
    const read = (name: string, fallback: number) => {
      const raw = getComputedStyle(document.body).getPropertyValue(name).trim()
      const value = Number.parseFloat(raw)
      return Number.isFinite(value) ? value : fallback
    }
    setLimits({
      defaultWidth: read('--side-width-reading', 400),
      sideMin: read('--side-min', 300),
    })
  }, [])
  const tooNarrowToSplit = (width ?? limits.defaultWidth) < limits.sideMin * 2
  /* 下拉菜单的开合：下拉键与在顶栏空白处点右键都开它 */
  const [menuOpen, setMenuOpen] = useState(false)
  const blocked = splitBlocked || tooNarrowToSplit
  return (
    <aside
      className="browser"
      data-side={side}
      data-split={split}
      data-collapsed={collapsed}
      data-edge-hover={columnResize.highlighted || undefined}
      data-dragging={columnResize.dragging || undefined}
      ref={columnResize.ref}
      aria-label={t('shell.browser.label')}
      aria-hidden={collapsed || undefined}
      inert={collapsed || undefined}
    >
      {/* 内容区与标签浏览器之间那条分界线：拖动改本栏宽度，双击回默认宽（口径同导航列右缘） */}
      <span
        className="browser__edge"
        role="separator"
        aria-orientation="vertical"
        aria-label={t('shell.browser.split.columns')}
        aria-valuemin={columnResize.min}
        aria-valuemax={columnResize.max}
        aria-valuenow={width ?? undefined}
        tabIndex={0}
        data-no-drag
        data-highlighted={columnResize.highlighted || undefined}
        onPointerEnter={columnResize.onPointerEnter}
        onPointerLeave={columnResize.onPointerLeave}
        onPointerDown={columnResize.onPointerDown}
        onDoubleClick={columnResize.onDoubleClick}
      >
        <span className="browser__grip" aria-hidden="true" />
      </span>
      {/* 顶栏：空白处点右键开同一个下拉菜单（标签上的右键留给标签自己的菜单，第 13 条） */}
      <div
        className="browser__bar"
        onContextMenu={(event) => {
          event.preventDefault()
          setMenuOpen(true)
        }}
      >
        <ScrollArea className="browser__tabs" size="small">
          <BrowserTabs
            tabs={tabs}
            activeKey={activeKey}
            onActivate={onActivate}
            onClose={onClose}
            onNew={onNew}
          />
        </ScrollArea>
        {/* 下拉：菜单上段放溢出的标签（第 14 条），下段是操作项；顶栏空白处点右键也开它 */}
        <BaseMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <BaseMenu.Trigger
            className="browser__more"
            aria-label={t('shell.browser.action.more')}
            render={<Button iconOnly variant="plain" size="small" />}
          >
            <Icon name="i-down" size={16} />
          </BaseMenu.Trigger>
          <BaseMenu.Portal>
            <BaseMenu.Positioner side="bottom" align="end" sideOffset={4}>
              <BaseMenu.Popup className="browser__menu" aria-label={t('shell.browser.action.more')}>
                <BaseMenu.Item className="browser__menu-item" onClick={onMove}>
                  <Icon name="i-swap" size={16} />
                  <span>{t('shell.browser.action.move')}</span>
                </BaseMenu.Item>
                <BaseMenu.Item
                  className="browser__menu-item"
                  disabled={blocked && split === 'none'}
                  aria-pressed={split === 'columns'}
                  onClick={() => onSplit(split === 'columns' ? 'none' : 'columns')}
                >
                  <Icon name="i-split" size={16} />
                  <span>{t('shell.browser.split.columns')}</span>
                </BaseMenu.Item>
                <BaseMenu.Item
                  className="browser__menu-item"
                  disabled={blocked && split === 'none'}
                  aria-pressed={split === 'rows'}
                  onClick={() => onSplit(split === 'rows' ? 'none' : 'rows')}
                >
                  <Icon name="i-rows" size={16} />
                  <span>{t('shell.browser.split.rows')}</span>
                </BaseMenu.Item>
              </BaseMenu.Popup>
            </BaseMenu.Positioner>
          </BaseMenu.Portal>
        </BaseMenu.Root>
        {/* 后段：最大化 / 恢复 与 关闭；图形与导航列、内容列头同族，同一档按钮 */}
        <Tooltip
          label={exclusive ? t('shell.window.restore') : t('shell.browser.action.exclusive')}
          side="bottom"
        >
          <Button
            className="browser__maximize"
            iconOnly
            variant="plain"
            size="small"
            aria-pressed={exclusive}
            aria-label={exclusive ? t('shell.window.restore') : t('shell.browser.action.exclusive')}
            onClick={onExclusive}
          >
            <Icon name={exclusive ? 'i-minimize-2' : 'i-maximize'} size={16} />
          </Button>
        </Tooltip>
        <Tooltip label={t('shell.browser.action.collapse')} side="bottom">
          <Button
            className="browser__close"
            iconOnly
            variant="plain"
            size="small"
            aria-label={t('shell.browser.action.collapse')}
            onClick={onCollapse}
          >
            <Icon name={side === 'left' ? 'i-panel-left' : 'i-panel-right'} size={16} />
          </Button>
        </Tooltip>
      </div>

      {/* 分屏：一层，左右或上下两个面板；单面板时只渲染 children，结构不变。
          第一面板的比例由分隔条拖动给出（跟手，见 hooks/use-split-resize）。 */}
      <div
        className="browser__body"
        data-split={split}
        data-dragging={splitResize.dragging || undefined}
      >
        <div
          className="browser__pane"
          data-focused={focusedPane === 0 || undefined}
          data-sized={split === 'none' ? undefined : 'true'}
          onPointerDown={() => onFocusPane(0)}
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
              tabIndex={0}
              data-no-drag
              data-highlighted={splitResize.highlighted || undefined}
              ref={splitResize.ref}
              onPointerEnter={splitResize.onPointerEnter}
              onPointerLeave={splitResize.onPointerLeave}
              onPointerDown={splitResize.onPointerDown}
              onKeyDown={splitResize.onKeyDown}
              onDoubleClick={splitResize.onDoubleClick}
            >
              <span className="browser__grip" aria-hidden="true" />
            </div>
            <div className="browser__pane" data-focused={focusedPane === 1 || undefined} onPointerDown={() => onFocusPane(1)}>
              {/* 第二个面板自己的小条：写出它绑的是哪一页，与第一个面板的内容区分开 */}
              <div className="browser__pane-head">{secondaryLabel}</div>
              <ScrollArea className="browser__page" size="medium" persistent>{secondary}</ScrollArea>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
