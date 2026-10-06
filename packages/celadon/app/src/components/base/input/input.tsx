import './input.less'
import { useEffect, useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { Field } from '@base-ui/react/field'
import { Input as BaseInput } from '@base-ui/react/input'
import { Spinner } from '@/components/base/spinner'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** 必给：标签与错误文本都用它拼 id，保证 htmlFor 与 aria-describedby 对得上。 */
  id: string
  label?: string
  hint?: string
  error?: string
  /** 左侧图标，对应原型里的 `.field__icon`。 */
  icon?: ReactNode
  /** 右侧附加内容（例如密码的可见性切换），对应原型里的 `.field__trail`。 */
  trailing?: ReactNode
  className?: string
  /** 静态态：把设计类的 `is-*` 直接写在控件本体上，供清单页与设计稿并排展示同一个控件的多种状态。
      真实交互仍由伪类驱动，这里只解决"一张图上要同时看到多态"的问题。 */
  state?: 'hover' | 'focus' | 'error' | 'loading'
  /** 错误抖动：一次性反馈，**默认不加**。传 `true` 在判定错误时播一次；
      传**计数器**（每次判定错误的序号）则每次变化都重播，调用方不必先把它置回 false。
      错误文案变化也算一次新的判定。动作由设计类 `.is-shake` 完成，
      组件只负责在动画结束后摘掉这个类，好让下一次能重新跑。 */
  shake?: boolean | number
}

/* 行为与无障碍（受控值 · 键盘 · 禁用 · 表单联动）交给 Base UI 的 Field 与 Input；
   视觉照设计：字段是 `.field` 容器加 `.input` 本体，左右两个槽位，颜色与间距一律取 token。
   用户名、邮箱与密码都用它，靠 `type` 与校验规则区分。 */
export function Input({
  id,
  label,
  hint,
  error,
  icon,
  trailing,
  className,
  disabled,
  state,
  shake,
  ...rest
}: InputProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  /* 抖动的播放开关。同名动画不会自行重跑，所以每次触发都先把类摘掉，隔一帧再挂上，
     浏览器才会从头播一次；数字触发值每次变化都会走到这里，因此连续错误不必由调用方复位。 */
  const [shakeOn, setShakeOn] = useState(false)
  useEffect(() => {
    if (!shake) return
    setShakeOn(false)
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setShakeOn(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [shake, error])

  return (
    <Field.Root
      className={['field', className].filter(Boolean).join(' ')}
      disabled={disabled}
      invalid={Boolean(error)}
    >
      {label ? (
        <Field.Label className="field__label" htmlFor={id}>
          {label}
        </Field.Label>
      ) : null}
      <div className={['field__box', error ? 'is-error' : null].filter(Boolean).join(' ')}>
        {icon ? (
          <span className="field__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <BaseInput
          id={id}
          /* 状态类必须落在控件本体上：设计类的规则都写在 `.input` 上，加在字段框上不会生效。 */
          className={['input', error ? 'is-error' : null, state ? `is-${state}` : null, shake && shakeOn ? 'is-shake' : null]
            .filter(Boolean)
            .join(' ')}
          disabled={disabled}
          aria-describedby={describedBy}
          aria-busy={state === 'loading' || undefined}
          /* 一次播完就摘类，下一次触发才能重跑；减动效下动画被停掉不会有结束事件，
             但下一次触发仍走"先摘后挂"，因此不受影响。 */
          onAnimationEnd={() => setShakeOn(false)}
          {...rest}
        />
        {/* 加载态：右侧槽位放四分之一圆环指示器，只让出槽位的内距，值仍然完整可读。
            它是装饰，状态由控件上的 aria-busy 表达，因此不需要文案，也不进语言包。
            调用方自带 trailing 时以调用方为准，不叠加。 */}
        {state === 'loading' && !trailing ? (
          <span className="field__trail" aria-hidden="true">
            <Spinner />
          </span>
        ) : null}
        {trailing ? <span className="field__trail">{trailing}</span> : null}
      </div>
      {/* 消息位始终存在并占一行：没有消息时留空。
          否则同一行里有消息的字段比没消息的高，网格行高按最高的算，矮的格子底下会空出一段，
          看上去就像"间距比四周还大"。预留下方一行也是表单的常规做法。 */}
      <div className="field__message">
        {hint ? (
          <Field.Description id={hintId} className="field__hint">
            {hint}
          </Field.Description>
        ) : null}
        {error ? (
          /* 错误来自服务端，不是浏览器原生校验，所以显式用 match 让它渲染。
             颜色用设计类 .hint-error（危险色的文字档，--danger-ink），不在组件里另取名。 */
          <Field.Error id={errorId} className="hint-error" match={Boolean(error)}>
            {error}
          </Field.Error>
        ) : null}
      </div>
    </Field.Root>
  )
}
