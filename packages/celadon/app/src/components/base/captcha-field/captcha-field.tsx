import { useCallback, useEffect } from 'react'
import { useRequest } from '@/data'
import { entryCaptchaQuery } from '@/data/user'
import { Input } from '@/components/base/input'
import { Spinner } from '@/components/base/spinner'
import './captcha-field.less'

export type CaptchaFieldProps = {
  /** 输入框的 HTML id：标签、提示与错误都按它关联。 */
  id: string
  /** 用户填进输入框的验证码文字。 */
  value: string
  onValueChange: (value: string) => void
  /** 后端给的那张图的标识。每次取图都会变，提交表单时随 `captcha_id` 一起回传。 */
  onCaptchaIdChange?: (captchaId: string) => void
  label?: string
  placeholder?: string
  hint?: string
  /** 调用方的校验错误。取图失败时组件自己会把失败文案挂在消息位，调用方的错误优先。 */
  error?: string
  disabled?: boolean
  required?: boolean
  name?: string
  autoComplete?: string
  size?: 'small' | 'medium' | 'large'
  /** 达标边界：控件边界取 `--border-control-strong`，入口类页面统一用这一档。 */
  strong?: boolean
  className?: string
  /** 刷新控件的可访问名，也是取图失败时控件上的文字。四语由调用方给。 */
  refreshLabel?: string
  /** 图片的替代文字，四语由调用方给。 */
  imageAlt?: string
}

/**
 * 图形验证码字段：输入框右侧挂一张图，点图或点刷新换一张。
 *
 * 取图直接走接口声明 `entryCaptcha`（`GET /user/entry/captcha`，经 `useRequest` 发），组件不拼地址也不带身份；
 * 每次取回都把新的 `captcha_id` 通过 `onCaptchaIdChange` 交给调用方，由调用方在提交时放进 `captcha_id`。
 * 一张图的三种过程都在控件里表达：取图中给指示器，取回给图片，取图失败给可点的文字（文案由调用方给）。
 */
export function CaptchaField({
  id,
  value,
  onValueChange,
  onCaptchaIdChange,
  label,
  placeholder,
  hint,
  error,
  disabled = false,
  required = false,
  name,
  autoComplete = 'off',
  size,
  strong,
  className,
  refreshLabel,
  imageAlt,
}: CaptchaFieldProps) {
  /* 手动模式：挂载取一张，之后每次 `run()` 都重新取一张（同一个 key 也会真的再发一次）。 */
  const captcha = useRequest(entryCaptchaQuery(), { manual: true })
  const { run } = captcha
  const { state } = captcha

  useEffect(() => {
    if (state.status === 'ok') onCaptchaIdChange?.(state.value.captcha_id)
  }, [state, onCaptchaIdChange])

  useEffect(() => {
    void run()
  }, [run])

  const refresh = useCallback(() => {
    void run()
  }, [run])

  /* 取图失败也是一条要上屏的消息，但它归组件；调用方给了 error 就以调用方的为准。 */
  const message = error ?? (state.status === 'error' ? state.failure.text : undefined)

  return (
    /* 档位类总是挂上：尾部槽位的定宽与输入框的预留都按档给，缺档会退回自动宽度，图会压到文字上。 */
    <div className={['captcha-field', `captcha-field--${size ?? 'medium'}`, className].filter(Boolean).join(' ')}>
      <Input
        id={id}
        label={label}
        placeholder={placeholder}
        hint={hint}
        error={message}
        disabled={disabled}
        required={required}
        name={name}
        autoComplete={autoComplete}
        size={size}
        strong={strong}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        state={state.status === 'loading' ? 'loading' : undefined}
        trailing={
          <button
            type="button"
            className="captcha-field__control"
            onClick={refresh}
            disabled={disabled}
            aria-label={refreshLabel}
          >
            {state.status === 'ok' ? (
              <img className="captcha-field__picture" src={state.value.captcha_image} alt={imageAlt ?? ''} />
            ) : null}
            {state.status === 'loading' ? <Spinner /> : null}
            {state.status === 'error' ? <span className="captcha-field__retry">{refreshLabel}</span> : null}
          </button>
        }
      />
    </div>
  )
}
