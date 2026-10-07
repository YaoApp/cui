import { Button } from '@/components/base/button'
import { Input } from '@/components/base/input'
import './locked-account.less'

export type LockedAccountProps = {
  /** 输入框的 HTML id。 */
  id: string
  /** 账号，只读展示。 */
  value: string
  /** 账号字段的可访问名与「修改」按钮的文案；四语由调用方给。 */
  label: string
  changeLabel: string
  /** 点「修改」时回调：由调用方决定回到哪一步、清掉哪些状态。 */
  onChange: () => void
  disabled?: boolean
  /** 客户端内用达标边界，独立访问有意弱化（与其余入口页字段一致）。 */
  strong?: boolean
  className?: string
}

/**
 * 锁定后的账号行：只读输入框与小档反色按钮并排。
 *
 * 判定通过之后账号不再可改，要改必须点「修改」。输入框与小档反色按钮都是基础件，
 * 这一层只负责把它们组合成一行（布局规则见 `design/layout.md` 第 4 节：控件与首行对齐、间距一个档），
 * 不改基础件本身；文案不进组件，由调用方从语言包给。
 */
export function LockedAccount({
  id,
  value,
  label,
  changeLabel,
  onChange,
  disabled = false,
  strong = false,
  className,
}: LockedAccountProps) {
  return (
    <div className={['locked-account', className].filter(Boolean).join(' ')}>
      <Input
        id={id}
        aria-label={label}
        value={value}
        readOnly
        disabled={disabled}
        strong={strong}
        size="large"
      />
      <Button type="button" variant="inverse" size="small" disabled={disabled} onClick={onChange}>
        {changeLabel}
      </Button>
    </div>
  )
}
