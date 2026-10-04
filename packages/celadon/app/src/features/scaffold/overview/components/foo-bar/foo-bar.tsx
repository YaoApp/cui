import './foo-bar.less'
import { useTranslation } from '@/platform/i18n'

/* 页私有的组件：只服务脚手架索引页，所以住在它自己的 components/ 下 */
export function FooBar({ name }: { name: string }) {
  const { t } = useTranslation()

  return (
    <p className="foo-bar">
      {t('overview.trial')}
      <b>{name}</b>
    </p>
  )
}
