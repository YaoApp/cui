import { Menu as BaseMenu } from '@base-ui/react/menu'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'

export type UserMenuUsageProps = {
  label: string
  /** 已格式化好的余量（千分位 + 单位）；加载中与取不到时为 null */
  value: string | null
  loading: boolean
  upgradeLabel: string
  /** 没有套餐地址时不画升级按钮 */
  upgradeUrl?: string
  onSelect: () => void
  onUpgrade: () => void
}

/** 用量行与升级按钮：数据未回来时只给骨架，取不到时不再画升级入口。
    升级用反色小档、整宽，与用量行同宽。 */
export function UserMenuUsage({ label, value, loading, upgradeLabel, upgradeUrl, onSelect, onUpgrade }: UserMenuUsageProps) {
  return (
    <>
      <BaseMenu.Item className='user-menu__item' onClick={onSelect}>
        <Icon name='i-obj-quota' size={16} />
        <span className='user-menu__label'>{label}</span>
        {loading ? (
          <span className='user-menu__skeleton' aria-hidden='true' />
        ) : (
          <span className='user-menu__trailing'>{value ?? '—'}</span>
        )}
      </BaseMenu.Item>
      {upgradeUrl && !loading ? (
        <BaseMenu.Item
          className='user-menu__upgrade'
          render={<Button variant='inverse' size='small' block type='button' />}
          onClick={onUpgrade}
        >
          {upgradeLabel}
        </BaseMenu.Item>
      ) : null}
    </>
  )
}
