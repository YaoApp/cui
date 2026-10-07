import { useTranslation } from '@/platform/i18n'
import { Checkbox } from '@/components/base/checkbox'
import { Link } from '@/components/base/link'
import './terms-note.less'

export type TermsNoteProps = {
  /** 勾选框的 HTML id，标签与错误都按它关联。 */
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  /** 未勾选时的提示；由调用方给，出现时机也由调用方定。 */
  error?: string
  /** 配置里给的两个地址；缺一个就只显示另一个，两个都没有时不渲染链接。 */
  serviceHref?: string
  privacyHref?: string
  disabled?: boolean
  className?: string
}

/**
 * 条款勾选：一行文字里带两个链接，勾选框与这段文字是一体的（点文字也能勾选）。
 *
 * 链接地址来自入口配置，因此可能只给一个或都不给：都给时是「服务条款 与 隐私政策」，
 * 只给一个时不出现连接词。链接是新窗口打开的外部地址，不属于应用路由。
 */
export function TermsNote({
  id,
  checked,
  onCheckedChange,
  error,
  serviceHref,
  privacyHref,
  disabled = false,
  className,
}: TermsNoteProps) {
  const { t } = useTranslation()

  const link = (href: string, label: string) => (
    <Link className="terms-note__link" href={href} external>
      {label}
    </Link>
  )

  return (
    <div className={['terms-note', className].filter(Boolean).join(' ')}>
      <Checkbox
        id={id}
        className="terms-note__checkbox"
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        error={error}
        label={
          <span className="terms-note__text">
            <span>{t('auth.terms.prefix')}</span>{' '}
            {serviceHref ? link(serviceHref, t('auth.terms.service')) : null}
            {serviceHref && privacyHref ? <span>{` ${t('auth.terms.and')} `}</span> : null}
            {privacyHref ? link(privacyHref, t('auth.terms.privacy')) : null}
          </span>
        }
      />
    </div>
  )
}
