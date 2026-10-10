import type { I18nKey } from '@/platform/i18n/i18n-types'
import type { IconId } from '@/platform/icons'

export type { I18nKey }

/** 一个导航条目：图标 + 文字（+ 未读数），去向由调用方给。 */
export type NavItem = {
  /** 稳定的键，用于选中判定与 React key */
  key: string
  icon: IconId
  labelKey: I18nKey
  /** 应用内路径，不带命名空间 */
  to: string
  /** 未读数，0 与缺省都不画角标 */
  badge?: number
  /** 当前项：由装配层按地址判定 */
  active?: boolean
}
