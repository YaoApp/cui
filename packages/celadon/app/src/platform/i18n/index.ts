export { DEFAULT_LOCALE, SUPPORTED_LOCALES, i18n } from './i18n'
/* 统一从平台层取 `useTranslation`（re-export，不是另一层封装）——
   这样任何用到文案的组件都会先加载并初始化 i18n 实例。 */
export { useTranslation } from 'react-i18next'
