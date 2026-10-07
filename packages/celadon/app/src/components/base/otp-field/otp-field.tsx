import './otp-field.less'
import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { Input as BaseInput } from '@base-ui/react/input'

export type OtpFieldProps = {
  /** 字段的 HTML id：标签与错误都按它关联，第一格用这个 id，其余格按序派生。 */
  id: string
  /** 已经填进去的口令，只有数字，从左往右连续。不足 `length` 时后面为空。 */
  value: string
  onValueChange: (value: string) => void
  /** 填满时回调一次（从「没满」变「满」的那一次），便于自动提交。 */
  onComplete?: (value: string) => void
  label?: string
  hint?: string
  /** 调用方的校验错误。错误是持续状态，格子描边与消息文案一起表达。 */
  error?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  /** 表单提交用的字段名；给了名字会同时输出一个隐藏输入，值就是整段口令。 */
  name?: string
  /** 口令位数，默认 6。 */
  length?: number
  /** 尺寸档，与输入框、按钮、选择器同梯：小 24 · 中 32 · 大 40，中档就是基础档。格子是正方形。 */
  size?: 'small' | 'medium' | 'large'
  className?: string
  /** 第一格的 autocomplete，默认 `one-time-code`，交给系统与浏览器做验证码自动填充。 */
  autoComplete?: string
  /** 每一格的可访问名，四语由调用方给（基础件不写文案）。不传时退回「标签 + 序号」。 */
  cellLabel?: (index: number) => string
  /** 静态态：清单页与设计稿并排展示多态时用，真实交互仍由伪类驱动。 */
  state?: 'hover' | 'focus'
}

const onlyDigits = (text: string) => text.replace(/\D/g, '')

/**
 * 一次性口令字段：把口令拆成等宽的正方形格子。
 *
 * 值是一段**从左往右连续**的数字，格子只是它的视图，因此不会留下空洞；插到已填过的位置上就是替换。
 * 键位按通行做法：输入数字自动前进，退格清掉本格及其右侧（本格为空时退到上一格），
 * 左右方向键与 Home / End 移动，整段粘贴按当前格铺开，只有数字被接受。
 *
 * 尺寸与输入框同梯：格子边长等于该档控件高度（24 · 32 · 40），字号与行高取同一批控件 token，
 * 因此和输入框并排时高度完全一致。文案一律由调用方给，组件不写死任何一种语言。
 */
export function OtpField({
  id,
  value,
  onValueChange,
  onComplete,
  label,
  hint,
  error,
  disabled = false,
  readOnly = false,
  required = false,
  name,
  length = 6,
  size = 'medium',
  className,
  autoComplete = 'one-time-code',
  cellLabel,
  state,
}: OtpFieldProps) {
  const cells = useRef<Array<HTMLInputElement | null>>([])

  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  const locked = disabled || readOnly
  /* 第一格是标签指向的控件；点中间的空格时把光标拉回第一格空位，值因此始终是连续的前缀。 */
  const firstEmpty = value.length < length ? value.length : length - 1

  const commit = (next: string) => {
    if (next === value) return
    onValueChange(next)
    if (next.length === length && value.length < length) onComplete?.(next)
  }

  const focusCell = (index: number) => {
    const target = cells.current[Math.max(0, Math.min(index, length - 1))]
    target?.focus()
    target?.select()
  }

  const handleInput = (index: number, text: string, element: HTMLInputElement) => {
    const digits = onlyDigits(text)
    if (!digits) {
      /* 不是数字就原样放回：受控输入在值没变时不会重渲染，得把 DOM 上的字符擦掉，
         否则字母会留在格子里。口令本身不动，清空格子走退格/删除键。 */
      element.value = value[index] ?? ''
      return
    }
    /* 一次收到多位（浏览器自动填充、或逐字输入落进同一格）按粘贴处理：从这一格铺开。
       只收一位时，写在已填过的位置就是替换，写在空位就是接着往后填（光标已按 firstEmpty 归位）。 */
    if (digits.length > 1) {
      const spread = `${value.slice(0, index)}${digits}`.slice(0, length)
      commit(spread)
      focusCell(Math.min(spread.length, length - 1))
      return
    }
    const next =
      index >= value.length ? value + digits : `${value.slice(0, index)}${digits}${value.slice(index + 1)}`
    commit(next)
    focusCell(Math.min(next.length, length - 1))
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault()
      commit(value.slice(0, index))
      focusCell(index - 1)
      return
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusCell(index - 1)
      return
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusCell(index + 1)
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      focusCell(0)
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      focusCell(firstEmpty)
    }
  }

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    const digits = onlyDigits(event.clipboardData.getData('text'))
    if (!digits) return
    event.preventDefault()
    const next = `${value.slice(0, index)}${digits}`.slice(0, length)
    commit(next)
    focusCell(Math.min(next.length, length - 1))
  }

  return (
    /* 分段输入是**多控件**字段：标签、提示与错误由本组件自己按 id 关联，不套单控件的 Field ——
       Field 会把每个格子的 id 覆盖成同一个，并用 aria-labelledby 盖掉每格的位置名。
       字段的类名与输入框同一套（`.field*`），观感因此一致。 */
    <div className={['field', className].filter(Boolean).join(' ')}>
      {label ? (
        <label className="field__label" id={`${id}-label`} htmlFor={id}>
          {label}
        </label>
      ) : null}

      <div className={['otp-field', `otp-field--${size}`].filter(Boolean).join(' ')}>
        <div
          className="otp-field__cells"
          role="group"
          aria-labelledby={label ? `${id}-label` : undefined}
          aria-required={required || undefined}
        >
          {Array.from({ length }, (_, index) => (
            <BaseInput
              key={index}
              id={index === 0 ? id : `${id}-${index + 1}`}
              ref={(node: HTMLInputElement | null) => {
                cells.current[index] = node
              }}
              /* 状态类落在格子本身上：设计类的规则都写在 `.otp-field__cell` 上。 */
              className={['otp-field__cell', error ? 'is-error' : null, index === 0 && state ? `is-${state}` : null]
                .filter(Boolean)
                .join(' ')}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={value[index] ?? ''}
              disabled={disabled}
              readOnly={readOnly}
              autoComplete={index === 0 ? autoComplete : 'off'}
              aria-label={cellLabel?.(index) ?? (label ? `${label} ${index + 1}` : undefined)}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              onChange={(event) => handleInput(index, event.target.value, event.target)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={(event) => handlePaste(index, event)}
              onFocus={(event) => {
                if (!locked) event.target.select()
              }}
              onClick={() => {
                if (!locked && index > firstEmpty) focusCell(firstEmpty)
              }}
            />
          ))}
        </div>
      </div>

      {/* 整段口令同时交给原生表单：分段输入不占表单字段名，隐藏输入承担提交。 */}
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <div className="field__message">
        {hint ? (
          <p id={hintId} className="field__hint">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="hint-error">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
