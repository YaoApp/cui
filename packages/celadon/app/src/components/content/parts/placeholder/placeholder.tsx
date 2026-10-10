import { Page, PageSection } from '@/components/page'
import { useTranslation } from '@/platform/i18n'
import type { I18nKey } from '@/platform/i18n/i18n-types'

export type PlaceholderPageProps = {
  /** 页名在语言包里的键；业务页与场景页共用 */
  titleKey: I18nKey
}

/* 占位页：骨架阶段每一页只画页名与一句说明，业务内容随后接真接口。
   它不认识业务，页名由调用方给（见 plan/08-layout-base.md §4）。 */
export function PlaceholderPage({ titleKey }: PlaceholderPageProps) {
  const { t } = useTranslation()
  return (
    <Page>
      <PageSection heading={t(titleKey)}>
        <p className="content__hint">{t('shell.content.placeholder')}</p>
      </PageSection>
    </Page>
  )
}
