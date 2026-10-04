export { DEFAULT_LOCALE, SUPPORTED_LOCALES, i18n } from './i18n'
/* 类型由基准语言 zh-CN 生成（scripts/build-i18n-types.mjs）—— 从平台层统一出口，见 architecture/08-i18n.md §5。 */
export type { I18nKey } from './i18n-types'
/* 统一从平台层取 `useTranslation`（re-export，不是另一层封装）——
   这样任何用到文案的组件都会先加载并初始化 i18n 实例。 */
export { useTranslation } from 'react-i18next'

/* 失败码 → 人话：翻译的事，所以从 i18n 面出（`bridge` 也转出一份给验证页）*/
export { failureText } from '../bridge/translate'
