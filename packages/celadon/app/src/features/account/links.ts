/** 账户菜单里的三个外链。文档按界面语言分流：中文走中文站，其余走英文站。 */
export type AccountLinks = { home: string; help: string; docs: string }

const ZH_DOCS = 'https://yaoagents.cn/docs/zh-cn/getting-started/what-is-yao-agents'
const EN_DOCS = 'https://yaoagents.com/docs/en-us/getting-started/what-is-yao-agents'

export function accountLinks(language: string): AccountLinks {
  const chinese = language.toLowerCase().startsWith('zh')
  return {
    home: 'https://yaoagents.com',
    help: 'https://yaoagents.com/docs',
    docs: chinese ? ZH_DOCS : EN_DOCS,
  }
}
