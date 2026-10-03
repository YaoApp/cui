/* 本文件由 scripts/build-i18n-types.mjs 从三处语言包（基准语言 zh-CN）生成 —— 请勿手改。
   重新生成：pnpm build:i18n
   来源：app/src/locales/ · app/src/features/<域>/locales/ · app/src/components/<名>/locales/ */
import 'i18next'

/** 基准语言里存在的全部 key —— `t('…')` 只接受这些。 */
export type I18nKey =
  | 'entityPanel.close'
  | 'entityPanel.id'
  | 'entityPanel.kind'
  | 'entityPanel.label'
  | 'header.refresh'
  | 'hello.brands'
  | 'hello.brandsOther'
  | 'hello.browser'
  | 'hello.client'
  | 'hello.clientDesktop'
  | 'hello.clientId'
  | 'hello.clientType'
  | 'hello.clientWeb'
  | 'hello.host'
  | 'hello.hostNone'
  | 'hello.hostReady'
  | 'hello.icons'
  | 'hello.loading'
  | 'hello.namespace'
  | 'hello.os'
  | 'hello.refreshed'
  | 'hello.title'
  | 'hello.trial'
  | 'hello.version'
  | 'localeSwitch.enUS'
  | 'localeSwitch.ja'
  | 'localeSwitch.label'
  | 'localeSwitch.system'
  | 'localeSwitch.zhCN'
  | 'localeSwitch.zhTW'
  | 'nav.appLabel'
  | 'nav.hello'
  | 'nav.world'
  | 'surface.main'
  | 'surface.side'
  | 'themeToggle.label'
  | 'themeToggle.toDark'
  | 'themeToggle.toLight'
  | 'world.detailLabel'
  | 'world.filter'
  | 'world.filterPlaceholder'
  | 'world.fixture.e1.name'
  | 'world.fixture.e2.name'
  | 'world.fixture.e3.name'
  | 'world.fixture.e4.name'
  | 'world.fixture.w1.name'
  | 'world.fixture.w1.summary'
  | 'world.fixture.w2.name'
  | 'world.fixture.w2.summary'
  | 'world.fixture.w3.name'
  | 'world.fixture.w3.summary'
  | 'world.kind.place'
  | 'world.kind.role'
  | 'world.missing'
  | 'world.navLabel'
  | 'world.share'
  | 'world.title'

/* 语言包是**平铺 + 点号分组**（`nav.hello`），运行时 keySeparator:false，类型也必须一致，
   否则 `t('nav.hello')` 会被当成嵌套查找。resources 只列 key 不列值：值随语言变，key 不随。 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    keySeparator: false
    nsSeparator: false
    resources: {
      translation: {
        'entityPanel.close': string
        'entityPanel.id': string
        'entityPanel.kind': string
        'entityPanel.label': string
        'header.refresh': string
        'hello.brands': string
        'hello.brandsOther': string
        'hello.browser': string
        'hello.client': string
        'hello.clientDesktop': string
        'hello.clientId': string
        'hello.clientType': string
        'hello.clientWeb': string
        'hello.host': string
        'hello.hostNone': string
        'hello.hostReady': string
        'hello.icons': string
        'hello.loading': string
        'hello.namespace': string
        'hello.os': string
        'hello.refreshed': string
        'hello.title': string
        'hello.trial': string
        'hello.version': string
        'localeSwitch.enUS': string
        'localeSwitch.ja': string
        'localeSwitch.label': string
        'localeSwitch.system': string
        'localeSwitch.zhCN': string
        'localeSwitch.zhTW': string
        'nav.appLabel': string
        'nav.hello': string
        'nav.world': string
        'surface.main': string
        'surface.side': string
        'themeToggle.label': string
        'themeToggle.toDark': string
        'themeToggle.toLight': string
        'world.detailLabel': string
        'world.filter': string
        'world.filterPlaceholder': string
        'world.fixture.e1.name': string
        'world.fixture.e2.name': string
        'world.fixture.e3.name': string
        'world.fixture.e4.name': string
        'world.fixture.w1.name': string
        'world.fixture.w1.summary': string
        'world.fixture.w2.name': string
        'world.fixture.w2.summary': string
        'world.fixture.w3.name': string
        'world.fixture.w3.summary': string
        'world.kind.place': string
        'world.kind.role': string
        'world.missing': string
        'world.navLabel': string
        'world.share': string
        'world.title': string
      }
    }
  }
}
