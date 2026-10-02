/* 本文件由 scripts/build-i18n-types.mjs 从三处语言包（基准语言 zh-CN）生成 —— 请勿手改。
   重新生成：pnpm build:i18n
   来源：app/src/locales/ · app/src/features/<域>/locales/ · app/src/components/<名>/locales/ */
import 'i18next'

/** 基准语言里存在的全部 key —— `t('…')` 只接受这些。 */
export type I18nKey =
  | 'inbox.title'
  | 'nav.old'
  | 'pageHeader.title'

/* 语言包是**平铺 + 点号分组**（`nav.old`），运行时 keySeparator:false，类型也必须一致，
   否则 `t('nav.old')` 会被当成嵌套查找。resources 只列 key 不列值：值随语言变，key 不随。 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    keySeparator: false
    nsSeparator: false
    resources: {
      translation: {
        'inbox.title': string
        'nav.old': string
        'pageHeader.title': string
      }
    }
  }
}
