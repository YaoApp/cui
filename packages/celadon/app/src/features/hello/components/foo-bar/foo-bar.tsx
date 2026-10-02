import './foo-bar.less'
import { useTranslation } from '@/platform/i18n'

/* feature 的私有组件：只服务 hello，所以住在 features/hello/components/ 下 */
export function FooBar({ name, count }: { name: string; count: number }) {
  const { t } = useTranslation()

  return (
    <p className="foo-bar">
      {t('hello.trial')}
      <b>{name}</b>
      <span className="foo-bar__count">{t('hello.refreshed', { count })}</span>
    </p>
  )
}
