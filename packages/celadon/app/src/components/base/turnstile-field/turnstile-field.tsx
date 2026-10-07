import { useEffect, useRef, useState } from 'react'
import { Spinner } from '@/components/base/spinner'
import './turnstile-field.less'

/** Cloudflare Turnstile 在页面上暴露的接口（只用到我们需要的部分）。 */
type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      theme?: 'light' | 'dark' | 'auto'
      callback?: (token: string) => void
      'error-callback'?: () => void
      'expired-callback'?: () => void
    },
  ) => string
  remove: (widgetId: string) => void
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

/** 取一次全局接口：脚本可能在别的组件里已经在加载，因此按 `window` 上的对象判断而不是按脚本标签。 */
function turnstileApi(): TurnstileApi | undefined {
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile
}

export type TurnstileFieldProps = {
  /** 配置里给的站点密钥。 */
  sitekey: string
  /** 拿到令牌时回调；令牌过期或出错时回调空串，由调用方决定怎么提示。 */
  onTokenChange: (token: string) => void
  /** 控件形态。默认按当前主题给，浅色主题给 `light`，其余给 `dark`。 */
  theme?: 'light' | 'dark' | 'auto'
  /** 无障碍名：控件本身是 iframe，读屏读到的是这个名字。 */
  label: string
  /** 错误提示；只用于画错误态，文案由调用方给。 */
  error?: string
  className?: string
}

/**
 * 人机验证控件：把 Cloudflare Turnstile 装进一个容器。
 *
 * 脚本按需加载，只加载一次；容器上的部件由它自己画，我们只给位置、主题与无障碍名。
 * 令牌通过 `onTokenChange` 交给调用方，判定请求把令牌放在 `captcha` 字段里（与图片验证码同名字段）。
 * 主题在挂载时读一次根元素的 `data-theme`：弹窗每次打开都是新挂载，因此打开那一刻的主题是准的。
 */
export function TurnstileField({
  sitekey,
  onTokenChange,
  theme,
  label,
  error,
  className,
}: TurnstileFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<string | null>(null)
  const observersRef = useRef<MutationObserver | null>(null)
  const [ready, setReady] = useState(Boolean(turnstileApi()))
  /** 控件是否已经画进容器：脚本慢时不至于一直空着 */
  const [widgetReady, setWidgetReady] = useState(false)

  /* 主题：显式给了就用它，否则按根元素当前的 data-theme 定 */
  const resolvedTheme = theme ?? (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

  useEffect(() => {
    if (ready) return
    const existing = document.querySelector<HTMLScriptElement>(`script[src^="${SCRIPT_SRC}"]`)
    if (existing) {
      /* 标签在但接口还没出来：脚本正在加载，等它挂到 window 上 */
      const timer = window.setInterval(() => {
        if (turnstileApi()) {
          window.clearInterval(timer)
          setReady(true)
        }
      }, 50)
      return () => window.clearInterval(timer)
    }
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.addEventListener('load', () => setReady(true))
    document.head.append(script)
    /* 脚本加载完就留在页面上（可能被别处共用），这里不需要解绑：监听器随脚本一起只触发一次加载事件 */
  }, [ready])

  useEffect(() => {
    const api = turnstileApi()
    const container = containerRef.current
    if (!ready || !api || !container || !sitekey) return
    /* 同一个容器只装一次：重复调用会拿到两个控件叠在一起 */
    if (container.dataset.rendered === 'true') return
    container.dataset.rendered = 'true'
    const id = api.render(container, {
      sitekey,
      theme: resolvedTheme,
      callback: (token) => onTokenChange(token),
      'error-callback': () => onTokenChange(''),
      'expired-callback': () => onTokenChange(''),
    })
    widgetRef.current = id

    /* 控件由脚本异步画进来（有时很慢）：等它真的出现再撤掉加载指示。
       观察自己的容器即可 —— iframe 是跨域的读不到内部，但它是这个容器的子节点。
       注意 `render` 是同步的，子节点可能**已经**在了，那时不需要（也不能）再等观察回调。 */
    if (container.childElementCount > 0) {
      setWidgetReady(true)
    } else {
      const observer = new MutationObserver(() => {
        if (container.childElementCount > 0) {
          setWidgetReady(true)
          observer.disconnect()
        }
      })
      observer.observe(container, { childList: true })
      observersRef.current = observer
    }

    return () => {
      observersRef.current?.disconnect()
      observersRef.current = null
      widgetRef.current = null
      delete container.dataset.rendered
      setWidgetReady(false)
      /* 卸载时收回控件。真控件对已经不存在的 id 会抛错，而抛在卸载清理里会中断这一次更新
         （弹窗从验证码步切到密码步时正好发生），因此这里吞掉它：收不回来不影响页面继续走。 */
      try {
        api.remove(id)
      } catch {
        /* 控件已经不在，忽略 */
      }
    }
  }, [ready, sitekey, resolvedTheme, onTokenChange])

  return (
    <div className={['turnstile-field', error ? 'is-error' : null, className].filter(Boolean).join(' ')}>
      {/* 控件没画出来之前给加载指示：脚本在网慢时要等一会儿，空着会让人以为坏了 */}
      <div className="turnstile-field__frame" aria-busy={!widgetReady}>
        {widgetReady ? null : (
          <span className="turnstile-field__loading" aria-hidden="true">
            <Spinner />
          </span>
        )}
        {/* 容器只负责位置：控件画在里面；没有站点密钥时不留空框，改由调用方给提示 */}
        <div className="turnstile-field__widget" ref={containerRef} role="group" aria-label={label} />
      </div>
      {/* 错误位**常驻**：文案出现时不改变弹窗高度（与字段的消息位同一条规则） */}
      <p className="turnstile-field__error">{error}</p>
    </div>
  )
}
