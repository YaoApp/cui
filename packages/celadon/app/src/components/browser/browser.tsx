import './browser.less'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Menu as BaseMenu } from '@base-ui/react/menu'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { ScrollArea } from '@/components/base/scroll-area'
import { Tooltip } from '@/components/base/tooltip'
import { useTranslation } from '@/platform/i18n'
import type { BrowserSplit } from '@/stores/layout/columns'
import { BrowserTabs } from './parts/tabs'
import { SecondaryPane } from './parts/secondary-pane'
import { TabContextMenu, TabOverflowMenu } from './parts/tab-menu'
import { useTabOverflow } from './hooks/use-tab-overflow'
import type { BrowserTab } from './types'
import { useSplitResize } from './hooks/use-split-resize'
import { useColumnResize } from './hooks/use-column-resize'

export type { BrowserTab } from './types'

/** 两组标签与各自面板的 id 前缀：两组并存时 id 不撞，标签的 `aria-controls` 找得到自己那一块面板 */
const PRIMARY_GROUP_ID = 'browser-primary'
const SECONDARY_GROUP_ID = 'browser-secondary'

/** 主栏顶栏两侧的键：装配层给状态与动作，图形与文案由这一层按本栏来画（后两栏换边后本栏是主栏时才用） */
export type BarKey = {
	visible: boolean
	blocked?: boolean
	onClick: () => void
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
  /** 整栏宽度（像素）。null 表示跟随 token 默认宽，用户拖过分界线才有值 */
  width?: number | null
  onWidth?: (width: number | null) => void
  onActivate: (key: string) => void
  onClose: (key: string) => void
  /** 新建：开一个空页并停到它（空页里再开东西就在这一页里换内容） */
  onNew: () => void
  /** 拖动换序提交：索引按移除该项之后的数组算 */
  onReorder?: (key: string, index: number) => void
  /** 刷新这一页：外部页目前是占位，回调暂无可见变化 */
  onRefresh?: (key: string) => void
  /** 只留这一页 */
  onCloseOthers?: (key: string) => void
  /** 关掉所有能关的页 */
  onCloseAll?: () => void
  onMove: () => void
  onCollapse: () => void
  /** 这一栏是主栏：主栏不画收起键，改画两侧找回键 */
  primary?: boolean
  /** 顶栏前段：导航找回键，放在标签条之前，只在主栏传 */
  navKey?: BarKey
  /** 本栏在左且导航区收起、平台有原生交通灯：顶栏左端让出交通灯留白（macOS 壳） */
  barInset?: boolean
  /** 顶栏后段：次栏的找回键，占用收起键原来的位置；`collapsed` 决定文案取展开还是收起 */
  secondaryKey?: { collapsed: boolean; blocked?: boolean; onClick: () => void }
  /** 第一个面板的当前页：由装配层按标签的内容决定 */
  children: ReactNode
  /** 第二个面板的当前页；只有分屏时才渲染 */
  secondary?: ReactNode
  /** 第二个面板自己的一组标签与活动页：每组独立，互不引用 */
  secondaryTabs?: BrowserTab[]
  secondaryActiveKey?: string
  onSecondaryActivate?: (key: string) => void
  onSecondaryClose?: (key: string) => void
  onSecondaryNew?: () => void
  onSecondaryReorder?: (key: string, index: number) => void
  /** 新栏标签的刷新、关闭其它、关闭全部：只作用于新栏这一组 */
  onSecondaryRefresh?: (key: string) => void
  onSecondaryCloseOthers?: (key: string) => void
  onSecondaryCloseAll?: () => void
  /** 面板独占整扇窗口：导航区与内容区让位，只留这一栏（与窗口自身的最大化不是一件事） */
  exclusive?: boolean
  onExclusive?: () => void
}

/* 标签浏览器：顶部标签条（新建吸附右端，放不下的进下拉菜单上段，标签可拖动换序），
   下面当前页或两个面板。标签是全局一套，与会话弱关联（`design/main-shell.md` §五）；
   标签数据与页内容都由装配层给，组件不认识业务（`architecture/03-boundaries.md` §2 的层间方向）。 */
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
  onReorder,
  onRefresh,
  onCloseOthers,
  onCloseAll,
  onMove,
  onCollapse,
  primary = false,
  navKey,
  barInset = false,
  secondaryKey,
  children,
  secondary = null,
  secondaryTabs = [],
  secondaryActiveKey = '',
  onSecondaryActivate = () => {},
  onSecondaryClose = () => {},
  onSecondaryNew = () => {},
  onSecondaryReorder = () => {},
  onSecondaryRefresh,
  onSecondaryCloseOthers,
  onSecondaryCloseAll,
  exclusive = false,
  onExclusive = () => {},
}: BrowserProps) {
  const { t } = useTranslation()
  const splitResize = useSplitResize(
    split === 'rows' ? 'rows' : 'columns',
    splitRatio,
    onSplitRatio,
    /* 左右分栏新栏在左、比例记主栏：指针往右是主栏变小，换算取反；上下分栏方向本来就对 */
    split === 'columns'
  )
  const columnResize = useColumnResize(width, onWidth, side)
  /* 分屏能不能开，按**本栏实宽**判：宽度由分界线拖出来，窗口宽只是其中一半条件。
     两个长度 token 从 `.celadon` 上读一次（默认宽与最小宽），读不到就用回退值 */
  const [limits, setLimits] = useState({ defaultWidth: 400, sideMin: 300, paneMin: 240 })
  useEffect(() => {
    const read = (name: string, fallback: number) => {
      const raw = getComputedStyle(document.body).getPropertyValue(name).trim()
      const value = Number.parseFloat(raw)
      return Number.isFinite(value) ? value : fallback
    }
    setLimits({
      defaultWidth: read('--side-width-reading', 400),
      sideMin: read('--side-min', 300),
      paneMin: read('--pane-min-height', 240),
    })
  }, [])
  /* 本栏页面的实际高度：上下分栏的判定要用它，窗口高不算顶栏与侧栏头部 */
  const [bodyHeight, setBodyHeight] = useState(0)
  const bodyRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const node = bodyRef.current
    if (!node) return
    const measure = () => setBodyHeight(node.getBoundingClientRect().height)
    measure()
    /* 单测环境没有 ResizeObserver：只量一次即可，真机上再跟窗口变化 */
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [split])
  /* 下拉菜单的开合：下拉键与在顶栏空白处点右键都开它 */
  const [menuOpen, setMenuOpen] = useState(false)
  /* 标签自己的右键菜单：记下点的是哪一页与指针位置，菜单按指针位置定位 */
  const [tabMenu, setTabMenu] = useState<{ key: string; point: { x: number; y: number } } | null>(null)
  const contextTab = tabMenu ? (tabs.find((tab) => tab.key === tabMenu.key) ?? null) : null
  /* 新栏标签的右键菜单：左右分栏时新栏的标签条在顶栏，菜单也挂在这一层 */
  const [secondaryTabMenu, setSecondaryTabMenu] = useState<{ key: string; point: { x: number; y: number } } | null>(
    null
  )
  const secondaryContextTab = secondaryTabMenu
    ? (secondaryTabs.find((tab) => tab.key === secondaryTabMenu.key) ?? null)
    : null
  const closableCount = tabs.filter((tab) => tab.closable).length
  const otherClosableCount = tabs.filter((tab) => tab.closable && tab.key !== tabMenu?.key).length
  /* 两个方向各按自己的条件判：
     左右看**实际栏宽**能不能放下两块（两倍侧栏最小宽再加分隔条）；
     上下看**实际栏高**能不能放下两块（两倍面板最小高再加新栏自己那条标签条）。
     已经开着一个方向时，另一个方向按同一个条件判，切不过去就不会出现放不下的场面 */
  const columnsRoom = width ?? limits.defaultWidth
  const columnsBlocked = splitBlocked || columnsRoom < limits.sideMin * 2 + 8
  const rowsBlocked = bodyHeight > 0 && bodyHeight < limits.paneMin * 2 + 40
  /* 标签条的溢出量在这里算：算出来的可见段交给标签条渲染，放不下的那些进菜单上段。
     放在这一层是因为菜单也在这一层，不必再从下面把结果报上来 */
  const { containerRef: tabsContainerRef, overflow } = useTabOverflow(tabs, activeKey)
  /* 第二组标签条（左右分栏时进顶栏左段）的溢出按它自己的宽度算，与主栏互不影响 */
  const { containerRef: secondaryTabsRef, overflow: secondaryOverflow } = useTabOverflow(
    secondaryTabs,
    secondaryActiveKey
  )
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
      {/* 裁切层与内容壳：本栏的宽度变化只在这里开窗，栏内内容按落点宽度排版一次、不随宽度重排。
          分界线句柄留在这一层外面，因此不会被裁掉（见 browser.less 的同名规则） */}
      <div className="browser__clip">
        <div className="browser__shell">
      {/* 顶栏：空白处点右键开同一个下拉菜单；标签上的右键留给标签自己的菜单 */}
      <div
        className="browser__bar"
        style={barInset ? ({ "--bar-inset": "var(--traffic-lights-width)" } as CSSProperties) : undefined}
        onContextMenu={(event) => {
          event.preventDefault()
          setMenuOpen(true)
        }}
      >
        {/* 前段槽位：镜像态装导航找回键，在标签条之前。它落在裁切容器与标签行之外，
            因此不参与标签条的溢出预算，也不会被当成拖动起手 */}
        {navKey ? (
          <span className="browser__slot browser__slot--nav" data-hidden={!navKey.visible}>
            <span className="browser__slot-key">
              <Tooltip
                label={
                  navKey.blocked
                    ? t('shell.navigation.action.blocked')
                    : t('shell.navigation.action.expand')
                }
                side="bottom"
              >
                {/* 提示挂在外层 span 上：禁用态的按钮收不到指针事件，气泡否则不会出现 */}
                <span
                  className="browser__slot-key-wrap"
                  title={navKey.blocked ? t('shell.navigation.action.blocked') : undefined}
                >
                  <Button
                    className="browser__nav"
                    iconOnly
                    variant="plain"
                    size="small"
                    disabled={navKey.blocked}
                    aria-label={
                      navKey.blocked
                        ? t('shell.navigation.action.blocked')
                        : t('shell.navigation.action.expand')
                    }
                    onClick={navKey.onClick}
                  >
                    <Icon name="i-panel-left" size={16} />
                  </Button>
                </span>
              </Tooltip>
            </span>
          </span>
        ) : null}
        {/* 左右分栏：新栏的标签条进顶栏左段，与主栏同一条基线；上下分栏时它在自己那一块顶部 */}
        {split === 'columns' ? (
          <div
            className="browser__bar-secondary"
            data-group="secondary"
            /* 与下方新栏同宽：样式里用负外边距把起点拉回最左，这里的比例直接用新栏那一份 */
            style={{ inlineSize: `${(1 - splitRatio) * 100}%` }}
          >
            <BrowserTabs
              group="secondary"
              idPrefix={SECONDARY_GROUP_ID}
              tabs={secondaryTabs}
              activeKey={secondaryActiveKey}
              containerRef={secondaryTabsRef}
              visibleKeys={secondaryOverflow.visibleKeys}
              onActivate={onSecondaryActivate}
              onClose={onSecondaryClose}
              onNew={onSecondaryNew}
              onReorder={onSecondaryReorder}
              onTabContextMenu={(key, point) => setSecondaryTabMenu({ key, point })}
            />
            {/* 新栏自己的溢出键：放不下的页与关闭项都在它自己的菜单里 */}
            <TabOverflowMenu
              hiddenTabs={secondaryOverflow.hiddenTabs}
              actions={{
                onActivate: onSecondaryActivate,
                onClose: onSecondaryClose,
                onRefresh: onSecondaryRefresh,
                onCloseOthers: onSecondaryCloseOthers,
                onCloseAll: onSecondaryCloseAll
              }}
              label={t('shell.browser.label')}
            />
            {/* 新栏标签的右键菜单：与溢出菜单同一组动作，只作用于新栏 */}
            {secondaryContextTab ? (
              <TabContextMenu
                tab={secondaryContextTab}
                point={secondaryTabMenu?.point ?? null}
                actions={{
                  onActivate: onSecondaryActivate,
                  onClose: onSecondaryClose,
                  onRefresh: onSecondaryRefresh,
                  onCloseOthers: onSecondaryCloseOthers,
                  onCloseAll: onSecondaryCloseAll
                }}
                onOpenChange={(open) => {
                  if (!open) setSecondaryTabMenu(null)
                }}
              />
            ) : null}
          </div>
        ) : null}
        <BrowserTabs
          group="primary"
          idPrefix={PRIMARY_GROUP_ID}
          tabs={tabs}
          activeKey={activeKey}
          containerRef={tabsContainerRef}
          visibleKeys={overflow.visibleKeys}
          onActivate={onActivate}
          onClose={onClose}
          onNew={onNew}
          onReorder={onReorder}
          onTabContextMenu={(key, point) => setTabMenu({ key, point })}
        />
        {/* 下拉：菜单上段是放不下的标签，下段是操作项；顶栏空白处点右键也开它 */}
        <BaseMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <BaseMenu.Trigger
            className="browser__more"
            aria-label={t('shell.browser.action.more')}
            render={<Button iconOnly variant="plain" size="small" />}
          >
            <Icon name="i-down" size={16} />
          </BaseMenu.Trigger>
          <BaseMenu.Portal>
            <BaseMenu.Positioner
              className="browser__menu-layer"
              side="bottom"
              align="end"
              sideOffset={4}
            >
              <BaseMenu.Popup className="browser__menu" aria-label={t('shell.browser.action.more')}>
                {/* 上段：放不下的标签，点选即激活。当前页不会落在这里：可见段放不下它时，
                    它替掉可见段末尾那一项留在条上 */}
                {overflow.hiddenTabs.map((tab) => (
                  <BaseMenu.Item
                    key={tab.key}
                    className="browser__menu-item"
                    onClick={() => onActivate(tab.key)}
                  >
                    <Icon name={tab.icon ?? (tab.closable ? 'i-globe' : 'i-home')} size={16} />
                    <span className="browser__menu-label">{tab.label}</span>
                  </BaseMenu.Item>
                ))}
                {overflow.hiddenTabs.length > 0 ? (
                  <span
                    className="browser__menu-separator"
                    role="separator"
                    aria-orientation="horizontal"
                  />
                ) : null}
                <BaseMenu.Item className="browser__menu-item" onClick={onMove}>
                  <Icon name="i-swap" size={16} />
                  <span>{t('shell.browser.action.move')}</span>
                </BaseMenu.Item>
                <BaseMenu.Item
                  className="browser__menu-item"
                  title={columnsBlocked && split !== 'columns' ? t('shell.browser.split.blocked') : undefined}
                  disabled={columnsBlocked && split !== 'columns'}
                  aria-pressed={split === 'columns'}
                  onClick={() => onSplit(split === 'columns' ? 'none' : 'columns')}
                >
                  <Icon name="i-split" size={16} />
                  <span>{t('shell.browser.split.columns')}</span>
                </BaseMenu.Item>
                <BaseMenu.Item
                  className="browser__menu-item"
                  title={rowsBlocked && split !== 'rows' ? t('shell.browser.split.tooShallow') : undefined}
                  disabled={rowsBlocked && split !== 'rows'}
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
        {/* 标签自己的右键菜单：指针位置开，刷新 / 关闭 / 分隔线 / 关闭其他 / 关闭全部，
            后两项按可用性置灰（还有别的可关页、还有可关页） */}
        <BaseMenu.Root open={tabMenu !== null} onOpenChange={(next) => !next && setTabMenu(null)}>
          <BaseMenu.Portal>
            <BaseMenu.Positioner
              className="browser__menu-layer"
              side="bottom"
              align="start"
              sideOffset={4}
              anchor={
                tabMenu
                  ? {
                      getBoundingClientRect: () => ({
                        x: tabMenu.point.x,
                        y: tabMenu.point.y,
                        top: tabMenu.point.y,
                        left: tabMenu.point.x,
                        right: tabMenu.point.x,
                        bottom: tabMenu.point.y,
                        width: 0,
                        height: 0,
                        toJSON: () => ({})
                      })
                    }
                  : undefined
              }
            >
              <BaseMenu.Popup
                className="browser__menu browser__menu--tab"
                aria-label={t('shell.browser.label')}
              >
                <BaseMenu.Item
                  className="browser__menu-item"
                  onClick={() => onRefresh?.(tabMenu?.key ?? '')}
                >
                  <Icon name="i-act-refresh" size={16} />
                  <span>{t('shell.browser.tab.refresh')}</span>
                </BaseMenu.Item>
                <BaseMenu.Item
                  className="browser__menu-item"
                  disabled={!contextTab?.closable}
                  onClick={() => onClose(tabMenu?.key ?? '')}
                >
                  <Icon name="i-act-close" size={16} />
                  <span>{t('shell.browser.tab.close')}</span>
                </BaseMenu.Item>
                <span className="browser__menu-separator" role="separator" aria-orientation="horizontal" />
                <BaseMenu.Item
                  className="browser__menu-item"
                  disabled={otherClosableCount === 0}
                  onClick={() => onCloseOthers?.(tabMenu?.key ?? '')}
                >
                  {/* 关闭类的三项一律用叉，与浏览器的通行做法一致；刷新另用刷新图形 */}
                  <Icon name="i-act-close" size={16} />
                  <span>{t('shell.browser.tab.closeOthers')}</span>
                </BaseMenu.Item>
                <BaseMenu.Item
                  className="browser__menu-item"
                  disabled={closableCount === 0}
                  onClick={() => onCloseAll?.()}
                >
                  <Icon name="i-act-close" size={16} />
                  <span>{t('shell.browser.tab.closeAll')}</span>
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
        {/* 本栏是次栏时留收起键；是主栏时这一格装次栏找回键（镜像态），主栏不画收起键 */}
        {primary ? null : (
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
        )}
        {/* 后段槽位：镜像态装次栏找回键；次栏还在时这一格空着（它的收起键在次栏自己的列头里） */}
        {secondaryKey ? (
          <span className="browser__slot browser__slot--trail" data-hidden={!secondaryKey.collapsed}>
            <span className="browser__slot-key">
              <Tooltip
                label={
                  secondaryKey.blocked
                    ? t('shell.browser.action.blocked')
                    : secondaryKey.collapsed
                      ? t('shell.browser.action.expand')
                      : t('shell.browser.action.collapse')
                }
                side="bottom"
              >
                {/* 提示挂在外层 span 上，与内容列头同一套；禁用时无障碍名也换成原因 */}
                <span
                  className="browser__slot-key-wrap"
                  title={secondaryKey.blocked ? t('shell.browser.action.blocked') : undefined}
                >
                  <Button
                    className="browser__secondary-key"
                    iconOnly
                    variant="plain"
                    size="small"
                    disabled={secondaryKey.blocked}
                    aria-label={
                      secondaryKey.blocked
                        ? t('shell.browser.action.blocked')
                        : secondaryKey.collapsed
                          ? t('shell.browser.action.expand')
                          : t('shell.browser.action.collapse')
                    }
                    aria-expanded={!secondaryKey.collapsed}
                    onClick={secondaryKey.onClick}
                  >
                    <Icon name="i-panel-right" size={16} />
                  </Button>
                </span>
              </Tooltip>
            </span>
          </span>
        ) : null}
      </div>
      {/* 分屏：一层，左右或上下两个面板；单面板时只渲染 children，结构不变。
          第一面板的比例由分隔条拖动给出（跟手，见 hooks/use-split-resize）。 */}
      <div
        className="browser__body"
        ref={bodyRef}
        data-split={split}
        data-dragging={splitResize.dragging || undefined}
      >
        <div
          className="browser__pane"
          data-sized={split === 'none' ? undefined : 'true'}
          style={
            split === 'none'
              ? undefined
              : split === 'rows'
                ? { blockSize: `${splitRatio * 100}%` }
                : { inlineSize: `${splitRatio * 100}%` }
          }
        >
          <ScrollArea
            className="browser__page"
            size="medium"
            persistent
            /* 主栏这一块是被控面板：id 与组前缀一致，标签的 aria-controls 指到这里 */
            id={`${PRIMARY_GROUP_ID}-panel`}
            role="tabpanel"
            aria-labelledby={`${PRIMARY_GROUP_ID}-tab-${activeKey}`}
          >
            {children}
          </ScrollArea>
        </div>
        {split === 'none' ? null : (
          <>
            <div
              className="browser__divider"
              role="separator"
              aria-orientation={split === 'columns' ? 'vertical' : 'horizontal'}
              /* 分隔条是可控的：读屏要能读出当前比例与可调范围（与钩子里的 0.2 到 0.8 同口径） */
              aria-label={t('shell.browser.split.divider')}
              aria-valuemin={20}
              aria-valuemax={80}
              aria-valuenow={Math.round(splitRatio * 100)}
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
            <SecondaryPane
              tabs={secondaryTabs}
              activeKey={secondaryActiveKey}
              onActivate={onSecondaryActivate}
              onClose={onSecondaryClose}
              onNew={onSecondaryNew}
              onReorder={onSecondaryReorder}
              idPrefix={SECONDARY_GROUP_ID}
              menuActions={{
                onRefresh: onSecondaryRefresh,
                onCloseOthers: onSecondaryCloseOthers,
                onCloseAll: onSecondaryCloseAll
              }}
              /* 上下分栏时新栏自己画标签条；左右分栏时标签条在顶栏左段 */
              showStrip={split === 'rows'}
              /* 比例记的是主栏那一份，新栏取补出来的那一份 */
              size={
                split === 'rows'
                  ? { blockSize: `${(1 - splitRatio) * 100}%` }
                  : { inlineSize: `${(1 - splitRatio) * 100}%` }
              }
            >
              {secondary}
            </SecondaryPane>
          </>
        )}
      </div>
        </div>
      </div>
    </aside>
  )
}
