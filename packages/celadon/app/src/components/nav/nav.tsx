import './nav.less'
import { useEffect, useState, type ReactNode } from 'react'
import type { I18nKey } from '@/platform/i18n/i18n-types'
import type { IconId } from '@/platform/icons'
import { useTranslation } from '@/platform/i18n'
import { NavFooter } from './parts/footer'
import { NavHeader } from './parts/header'
import { NavMain } from './parts/main'
import { NavScene } from './parts/scene'
import type { NavItem } from './nav.types'

/* 两处时长不写死，从 token 读：取 design/foundations.md F4 的 collapse 档（--duration-fast）
   与 panel 档（--duration-base）。样式改档位时组件跟着走，两边不会各说各话。 */
function durationMs(name: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const value = Number.parseFloat(raw)
  if (!Number.isFinite(value)) return fallback
  return raw.endsWith('ms') ? value : raw.endsWith('s') ? value * 1000 : fallback
}

export type NavProps = {
  items: NavItem[]
  /** 底部一行右侧的快捷图标：与主导航里的工作空间、电脑是同一份内容 */
  shortcuts: NavItem[]
  /** 当前场景名字在语言包里的键；没有场景时用 `shell.navigation.scene.none` */
  scene: I18nKey
  /** 当前场景的图标 */
  sceneIcon: IconId
  accountName: string
  /** 整列收起（视口驱动的那一档由样式按视口给，这里是用户偏好） */
  collapsed: boolean
  onToggle: () => void
  /** 主导航那一段折叠 */
  mainFolded: boolean
  onToggleMain: () => void
  /** 「当前」区里的二级导航，由业务域以插槽给（没有也要把那一行画出来） */
  children?: ReactNode
  onSelect: (item: NavItem) => void
}

/* 导航列：四段（头部内块 · 上区主导航 · 下区当前 · 底部一行），两处收起分开 ——
   头部键收整列，上区自己的键只折主导航（见 design/main-shell.md §三）。
   组件不认识业务：条目、「当前」区的内容、账号名与两处收起都由装配层给。 */
export function Nav({
  items,
  shortcuts,
  scene,
  sceneIcon,
  accountName,
  collapsed,
  onToggle,
  mainFolded,
  onToggleMain,
  children,
  onSelect,
}: NavProps) {
  const { t } = useTranslation()
  /* 收起态下整列悬停才把标志换成展开图标，但要在收拢动画走完之后才允许：
     点收起键的指针本来就停在列内，动画期间不揭示，标志因此在整段收拢过程中保持不变。 */
  const [revealReady, setRevealReady] = useState(false)
  /* 内容形态总在动画开始前准备好：只要列宽还没到 280，就画图标轨那一套。
     收起时立刻切回图标轨（文字不再被挤在变窄的列里），展开时等宽度到位再换回来。 */
  const [settled, setSettled] = useState(!collapsed)

  useEffect(() => {
    if (collapsed) {
      setSettled(false)
      return
    }
    /* 展开按 F4 的 panel 档 200ms */
    const timer = window.setTimeout(() => setSettled(true), durationMs('--duration-base', 200))
    return () => window.clearTimeout(timer)
  }, [collapsed])

  const railLook = collapsed || !settled

  useEffect(() => {
    if (!collapsed) {
      setRevealReady(false)
      return
    }
    /* 收起动作按 design/foundations.md F4 的 collapse 档走 --duration-fast（120ms），
       等这段动画结束再允许整列悬停揭示展开图标 */
    const timer = window.setTimeout(() => setRevealReady(true), durationMs('--duration-fast', 120))
    return () => window.clearTimeout(timer)
  }, [collapsed])

  const select = (item: NavItem) => {
    onSelect(item)
  }
  const currentLabel = t(scene)

  return (
    <nav
      className={['nav', railLook ? 'nav--collapsed' : '', revealReady ? 'nav--reveal' : '']
        .filter(Boolean)
        .join(' ')}
      aria-label={t('shell.navigation.label')}
    >
      <NavHeader collapsed={railLook} onToggle={onToggle} />
      <NavMain
        items={items}
        compact={railLook}
        folded={mainFolded}
        onToggleFold={onToggleMain}
        onSelect={select}
      />
      <NavScene
        items={items}
        currentLabel={currentLabel}
        sceneIcon={sceneIcon}
        folded={mainFolded}
        onSelect={select}
        onUnfold={onToggleMain}
      >
        {children}
      </NavScene>
      <NavFooter name={accountName} shortcuts={shortcuts} onSelect={select} />
    </nav>
  )
}
