import { useState } from 'react'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { Input } from '@/components/base/input'
import { useTranslation } from '@/platform/i18n'
import './password-input.less'

export type PasswordInputProps = {
  /** 字段的 HTML id，与标签和错误文案的关联都按它拼。 */
  id: string
  label?: string
  value: string
  onValueChange: (value: string) => void
  error?: string
  hint?: string
  autoComplete?: string
  disabled?: boolean
  readOnly?: boolean
  placeholder?: string
  name?: string
  onBlur?: () => void
  /** 进入这一步时自动聚焦（登录页从账号步切到密码步时用）。 */
  autoFocus?: boolean
  /** 达标边界，入口页统一用这一档。 */
  strong?: boolean
  /** 尺寸档，与输入框同梯；入口页取大档（等于 `--row-height` 40）。 */
  size?: 'small' | 'medium' | 'large'
}

/**
 * 密码输入：文本输入加一个可见性切换。
 *
 * 切换控件放在字段自带的尾部槽位里，因此位置与尺寸都跟着输入框走，不需要另写排布。
 * 它是纯文字档的小号图标按钮，可访问名写动作（显示或隐藏），并用 `aria-pressed` 表达当前是否明文。
 * 密码本身仍是 `type="password"` 的文本输入，不另立控件。
 */
export function PasswordInput({
  id,
  label,
  value,
  onValueChange,
  error,
  hint,
  autoComplete,
  disabled = false,
  readOnly = false,
  placeholder,
  name,
  onBlur,
  autoFocus,
  strong,
  size,
}: PasswordInputProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const action = visible ? 'auth.action.hidePassword' : 'auth.action.showPassword'

  return (
    <Input
      id={id}
      label={label}
      placeholder={placeholder}
      hint={hint}
      error={error}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      autoComplete={autoComplete}
      disabled={disabled}
      readOnly={readOnly}
      name={name}
      onBlur={onBlur}
      autoFocus={autoFocus}
      strong={strong}
      size={size}
      trailing={
        <Button
          type="button"
          className="password-input__toggle"
          variant="plain"
          size="small"
          iconOnly
          disabled={disabled}
          aria-label={t(action)}
          aria-pressed={visible}
          onClick={() => setVisible((on) => !on)}
          icon={<Icon name={visible ? 'i-eye-off' : 'i-eye'} />}
        />
      }
    />
  )
}
