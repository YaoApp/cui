import { Button } from '@/components/base/button'
import { CaptchaField } from '@/components/base/captcha-field'
import { DialogPage } from '@/components/base/dialog'
import { TurnstileField } from '@/components/base/turnstile-field'
import { useTranslation } from '@/platform/i18n'
import './captcha-dialog.less'

export type CaptchaDialogProps = {
  open: boolean
  /** 开合变化时回调；取消、叉、Esc 与点遮罩都带 `false`。 */
  onOpenChange: (open: boolean) => void
  /** 入口配置声明的形态；未声明时按图形验证码渲染。 */
  type?: 'image' | 'turnstile'
  sitekey?: string
  /** 验证码的轮次：每换一轮就换掉控件的 key，两种控件的一次性令牌都不会跨次复用。 */
  round: number
  value: string
  onValueChange: (value: string) => void
  onCaptchaIdChange: (captchaId: string) => void
  error?: string
  /** 提交在途：锁定「确定」，取消始终可用。 */
  pending: boolean
  /** 弹窗里的表单提交（确定）。 */
  onSubmit: () => void
}

/**
 * 验证码弹窗：登录与注册共用的「判定前收一次验证码」这一步。
 *
 * 图形验证码给输入框，人机验证给令牌，两种都把结果交给调用方，只有图形验证码还要带 `captcha_id`。
 * 弹窗只管收，什么时候开、结果怎么用由页面决定；文案固定（判定失败的那一条也由调用方传入）。
 * 控件每轮换一次 key，令牌一次性，跨次复用必然被服务端拒绝。
 */
export function CaptchaDialog({
  open,
  onOpenChange,
  type,
  sitekey = '',
  round,
  value,
  onValueChange,
  onCaptchaIdChange,
  error,
  pending,
  onSubmit,
}: CaptchaDialogProps) {
  const { t } = useTranslation()

  return (
    <DialogPage
      open={open}
      /* 开合都照传：调用方只关心关闭（带 `false`），打开由 `open` 属性驱动。
         只转第一个参数：基础件的开合回调还带事件详情，这里不把它泄漏给调用方。 */
      onOpenChange={(next) => onOpenChange(next)}
      title={t('auth.dialog.captchaTitle')}
      closeLabel={t('auth.dialog.close')}
      /* 图形验证码有输入，打开即聚焦到输入框（浮层要显式管理焦点，layout.md 第 4 节）；
         人机验证里面是 iframe，没有可输入的控件，返回 `true` 让上游按默认行为聚焦面板。 */
      initialFocus={() => (type === 'turnstile' ? true : document.getElementById('auth-dialog-captcha'))}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t('auth.action.cancel')}
          </Button>
          <Button type="submit" form="auth-dialog-form" variant="inverse" disabled={pending} loading={pending}>
            {t('auth.action.confirm')}
          </Button>
        </>
      }
    >
      <form
        id="auth-dialog-form"
        className="captcha-dialog__form"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        {type === 'turnstile' ? (
          <TurnstileField
            key={`turnstile-${round}`}
            sitekey={sitekey}
            label={t('auth.captcha.turnstile')}
            /* 判定失败的文案落在控件下方（人机验证那种由控件自己给提示，不套红框） */
            error={error}
            onTokenChange={onValueChange}
          />
        ) : (
          <CaptchaField
            key={`captcha-${round}`}
            id="auth-dialog-captcha"
            label={t('auth.captcha.label')}
            placeholder={t('auth.captcha.placeholder')}
            refreshLabel={t('auth.captcha.refresh')}
            imageAlt={t('auth.captcha.image')}
            value={value}
            onValueChange={onValueChange}
            onCaptchaIdChange={onCaptchaIdChange}
            error={error}
            disabled={pending}
            size="large"
          />
        )}
      </form>
    </DialogPage>
  )
}
