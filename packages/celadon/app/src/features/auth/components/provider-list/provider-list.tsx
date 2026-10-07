import { BrandMark, type BrandId } from '@/components/base/brand-mark'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { useTranslation } from '@/platform/i18n'
import type { SigninProvider } from '@/data/user'
import './provider-list.less'

/** 第三方入口到产品品牌图标的对应关系：只认我们收录的三家，其余走配置给的图片或通用图标。 */
const BRAND_BY_PROVIDER: Record<string, BrandId> = {
  google: 'brand-google',
  github: 'brand-github',
  apple: 'brand-apple',
}

export type ProviderListProps = {
  /** 入口配置里的第三方列表，界面只渲染不筛选。 */
  providers: SigninProvider[]
  onPick: (provider: SigninProvider) => void
  /** 有请求在路上：整列禁用，避免连点。 */
  pending?: boolean
  className?: string
}

/**
 * 第三方登录入口：一项一行，行高取 `--row-height`。
 *
 * 行内三段排布与 `design/prototype/login.html` 的 `.provider` 一致：标记在左、标签居中、右侧留一个占位，
 * 因此标签落在整行的中线上，而不是被标记挤偏。
 *
 * 标记按提供方 id 匹配我们收录的品牌图标（Google · GitHub · Apple）；接口没给出我们认识的 id 时，
 * 退回配置里的图片地址，再退回账户类通用图标。提供方名不翻译，句式由语言包给。
 */
export function ProviderList({ providers, onPick, pending = false, className }: ProviderListProps) {
  const { t } = useTranslation()

  if (providers.length === 0) return null

  const mark = (provider: SigninProvider) => {
    const brand = BRAND_BY_PROVIDER[provider.id.toLowerCase()]
    if (brand) return <BrandMark className="provider-list__mark" name={brand} size={18} />
    if (provider.logo) return <img className="provider-list__mark" src={provider.logo} alt="" />
    return (
      <span className="provider-list__mark provider-list__mark--icon">
        <Icon name="i-nav-user" />
      </span>
    )
  }

  return (
    <ul className={['provider-list', className].filter(Boolean).join(' ')}>
      {providers.map((provider) => (
        <li key={provider.id}>
          <Button
            type="button"
            className="provider-list__item"
            variant="plain"
            block
            disabled={pending}
            onClick={() => onPick(provider)}
          >
            <span className="provider-list__row">
              {mark(provider)}
              <span className="provider-list__label">
                {t('auth.provider.continueWith', { provider: provider.label })}
              </span>
              <span aria-hidden="true" />
            </span>
          </Button>
        </li>
      ))}
    </ul>
  )
}
