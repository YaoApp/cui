import { useTranslation } from '@/platform/i18n'

/* 这段注释里有中文，但注释会被检查器先剥掉 —— 只有代码里的汉字才算硬编码。
   文案本身住在语言包里，组件只拿 key。 */
export function Inbox() {
  const { t } = useTranslation()
  return <h1>{t('inbox.title')}</h1>
}
